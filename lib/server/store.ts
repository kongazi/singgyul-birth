import 'server-only';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import type { Order } from '../market';
import type { DeletedOrder, Review, Reviews } from '../moderation';
import { ANONYMOUS_SENDER } from '../submission';

const directory = path.join(process.cwd(), '.private-data');
const anonymousCounterKey = 'counter:anonymous-letters';
const deletedOrdersKey = 'deleted-orders';
const deletedOrdersFile = path.join(directory, deletedOrdersKey + '.json');
type DeletedOrders = Record<string, string>;
type StoredOrder = Order & { owner?: string };
const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { max: 3, ssl: 'require' }) : null;
let initialized: Promise<unknown> | undefined;
async function init() {
  if (sql) { await (initialized ??= sql`CREATE TABLE IF NOT EXISTS singgyul_private (key text PRIMARY KEY, value jsonb NOT NULL)`); }
  else { if (process.env.VERCEL || process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL_REQUIRED'); fs.mkdirSync(directory, { recursive: true, mode: 0o700 }); }
}
export async function put(key: string, value: unknown, insertOnly = false) {
  await init();
  if (sql) {
    if (insertOnly) await sql`INSERT INTO singgyul_private (key,value) VALUES (${key},${sql.json(value as never)}) ON CONFLICT (key) DO NOTHING`;
    else await sql`INSERT INTO singgyul_private (key,value) VALUES (${key},${sql.json(value as never)}) ON CONFLICT (key) DO UPDATE SET value=excluded.value`;
  } else {
    const file = path.join(directory, encodeURIComponent(key) + '.json');
    if (insertOnly) { try { fs.writeFileSync(file, JSON.stringify(value), { flag: 'wx', mode: 0o600 }); } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; } }
    else { const temp = file + '.tmp'; fs.writeFileSync(temp, JSON.stringify(value), { mode: 0o600 }); fs.renameSync(temp, file); }
  }
}
export async function get(key: string): Promise<unknown> {
  await init();
  if (sql) { const rows = await sql`SELECT value FROM singgyul_private WHERE key=${key}`; return rows[0]?.value; }
  try { return JSON.parse(fs.readFileSync(path.join(directory, encodeURIComponent(key) + '.json'), 'utf8')); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw e; }
}
function readLocalDeletedOrders(): DeletedOrders {
  return fs.existsSync(deletedOrdersFile) ? JSON.parse(fs.readFileSync(deletedOrdersFile, 'utf8')) : {};
}

function writeLocalDeletedOrders(deleted: DeletedOrders) {
  const temp = deletedOrdersFile + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(deleted), { mode: 0o600 });
  fs.renameSync(temp, deletedOrdersFile);
}

function localOrderFiles() {
  return fs.readdirSync(directory).filter(file => file.startsWith('order%3A') && file.endsWith('.json'));
}

function localActiveOrders(owner: string) {
  const deleted = readLocalDeletedOrders();
  return localOrderFiles()
    .map(file => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')) as StoredOrder)
    .filter(order => order.owner === owner && !Object.hasOwn(deleted, order.id));
}

async function activeOrders(query: postgres.Sql | postgres.TransactionSql, owner: string): Promise<Order[]> {
  const rows = await query`
    SELECT value FROM singgyul_private AS stored
    WHERE key LIKE 'order:%' AND value->>'owner' = ${owner}
      AND NOT EXISTS (
        SELECT 1 FROM singgyul_private AS deleted
        WHERE deleted.key = ${deletedOrdersKey} AND deleted.value ? substring(stored.key from 7)
      )
    ORDER BY value->>'createdAt' DESC
  `;
  return rows.map(row => row.value as Order);
}

async function lockWriter(tx: postgres.TransactionSql, owner: string) {
  // Submitting and restoring both change which letters are active for this writer.
  await tx`SELECT pg_advisory_xact_lock(hashtextextended(${owner}, 0))`;
}

function existingSubmission(active: Order[], id: string, anonymous: boolean) {
  const existing = active.find(order => order.id === id);
  if (existing) return existing;
  if (!anonymous && active.length) throw new Error('ALREADY_SENT');
}

export async function archiveOrders(target: { id: string } | { through: string }) {
  await init();
  const deletedAt = new Date().toISOString();
  const orderKey = 'id' in target ? `order:${target.id}` : null;
  const through = 'through' in target ? target.through : null;
  if (sql) {
    await sql`
      INSERT INTO singgyul_private (key, value)
      SELECT ${deletedOrdersKey}, jsonb_object_agg(substring(key from 7), ${deletedAt}::text)
      FROM singgyul_private
      WHERE key LIKE 'order:%'
        AND (${orderKey}::text IS NULL OR key = ${orderKey})
        AND (${through}::text IS NULL OR value->>'createdAt' <= ${through})
      HAVING count(*) > 0
      ON CONFLICT (key) DO UPDATE SET value = excluded.value || singgyul_private.value
    `;
    return;
  }
  const files = orderKey
    ? [encodeURIComponent(orderKey) + '.json'].filter(file => fs.existsSync(path.join(directory, file)))
    : localOrderFiles();
  const deleted = readLocalDeletedOrders();
  for (const file of files) {
    const id = decodeURIComponent(file.slice(0, -5)).slice(6);
    if (deleted[id]) continue;
    const order = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')) as Order;
    if (!through || order.createdAt <= through) deleted[id] = deletedAt;
  }
  writeLocalDeletedOrders(deleted);
}

export async function restoreOrder(id: string) {
  await init();
  const key = `order:${id}`;
  if (sql) {
    await sql.begin(async tx => {
      const [record] = await tx`SELECT value FROM singgyul_private WHERE key = ${key}`;
      const owner = (record?.value as StoredOrder | undefined)?.owner;
      if (owner?.startsWith('naver:')) {
        await lockWriter(tx, owner);
        const active = await activeOrders(tx, owner);
        if (active.some(order => order.id !== id)) throw new Error('ACTIVE_LETTER_EXISTS');
      }
      await tx`UPDATE singgyul_private SET value = value - ${id}::text WHERE key = ${deletedOrdersKey} AND value ? ${id}`;
    });
    return;
  }
  const deleted = readLocalDeletedOrders();
  if (!Object.hasOwn(deleted, id)) return;
  const orderFile = path.join(directory, encodeURIComponent(key) + '.json');
  const order = fs.existsSync(orderFile) ? JSON.parse(fs.readFileSync(orderFile, 'utf8')) as StoredOrder : undefined;
  const owner = order?.owner;
  if (owner?.startsWith('naver:') && localActiveOrders(owner).some(other => other.id !== id)) {
    throw new Error('ACTIVE_LETTER_EXISTS');
  }
  delete deleted[id];
  writeLocalDeletedOrders(deleted);
}

export async function isOrderDeleted(id: string) {
  const deleted = await get(deletedOrdersKey) as DeletedOrders | undefined;
  return deleted ? Object.hasOwn(deleted, id) : false;
}
export async function consumeOAuth(state:string) {
  await init();
  const key=`oauth:${state}`;
  if(sql) {
    const rows=await sql`DELETE FROM singgyul_private WHERE key=${key} RETURNING value`;
    return Number(rows[0]?.value?.expires)>Date.now();
  }
  const file=path.join(directory,encodeURIComponent(key)+'.json');
  try { const value=JSON.parse(fs.readFileSync(file,'utf8')); fs.unlinkSync(file); return value.expires>Date.now(); }
  catch(e) { if((e as NodeJS.ErrnoException).code==='ENOENT')return false;throw e; }
}
export async function submitOnce(order:Order,accountOwner:string|null) {
  await init();
  const anonymous = accountOwner === null;
  const owner = accountOwner ?? `anonymous:${order.id}`;
  const key = `order:${order.id}`;
  if(sql) return sql.begin(async tx=>{
    await lockWriter(tx, owner);
    const existing = existingSubmission(await activeOrders(tx, owner), order.id, anonymous);
    if (existing) return existing;
    let namedOrder = order;
    if (anonymous) {
      const [counter] = await tx`
        INSERT INTO singgyul_private (key,value) VALUES (${anonymousCounterKey},'1'::jsonb)
        ON CONFLICT (key) DO UPDATE SET value=to_jsonb((singgyul_private.value::text)::int+1)
        RETURNING value
      `;
      namedOrder = { ...order, name: ANONYMOUS_SENDER + counter.value };
    }
    const saved=await tx`INSERT INTO singgyul_private (key,value) VALUES (${key},${tx.json({...namedOrder,owner})}) ON CONFLICT (key) DO NOTHING RETURNING key`;
    if(!saved.length)throw new Error('ID_CONFLICT');
    return namedOrder;
  });
  const existing = existingSubmission(localActiveOrders(owner), order.id, anonymous);
  if (existing) return existing;
  const orderFile = path.join(directory, encodeURIComponent(key) + '.json');
  if (fs.existsSync(orderFile)) throw new Error('ID_CONFLICT');
  let namedOrder = order;
  if (anonymous) {
    const counterFile = path.join(directory, encodeURIComponent(anonymousCounterKey) + '.json');
    const next = fs.existsSync(counterFile) ? Number(fs.readFileSync(counterFile, 'utf8')) + 1 : 1;
    const temp = counterFile + '.tmp';
    fs.writeFileSync(temp, JSON.stringify(next), { mode: 0o600 });
    fs.renameSync(temp, counterFile);
    namedOrder = { ...order, name: ANONYMOUS_SENDER + next };
  }
  const temp = orderFile + '.' + randomUUID() + '.tmp';
  try {
    fs.writeFileSync(temp, JSON.stringify({ ...namedOrder, owner }), { flag: 'wx', mode: 0o600 });
    fs.linkSync(temp, orderFile);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') throw new Error('ID_CONFLICT');
    throw e;
  } finally {
    fs.rmSync(temp, { force: true });
  }
  return namedOrder;
}
export async function allRecords(includeDeleted = false) {
  await init();
  const entries: { key: string; value: unknown }[] = sql
    ? await sql`SELECT key,value FROM singgyul_private WHERE key LIKE 'order:%' OR key LIKE 'review:%' OR key = ${deletedOrdersKey}`
    : fs.readdirSync(directory)
      .filter(file => file.endsWith('.json') && /^(order%3A|review%3A|deleted-orders\.json$)/.test(file))
      .map(file => ({ key: decodeURIComponent(file.slice(0, -5)), value: JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')) }));
  const deleted = (entries.find(entry => entry.key === deletedOrdersKey)?.value ?? {}) as DeletedOrders;
  const orders: Order[] = [];
  const deletedOrders: DeletedOrder[] = [];
  const reviews: Reviews = {};
  for (const entry of entries) {
    if (entry.key.startsWith('order:')) {
      const order = entry.value as Order;
      const deletedAt = deleted[order.id];
      if (!deletedAt) orders.push(order);
      else if (includeDeleted) deletedOrders.push({ ...order, deletedAt });
    }
    if (entry.key.startsWith('review:')) {
      const id = entry.key.slice(7);
      if (includeDeleted || !Object.hasOwn(deleted, id)) reviews[id] = entry.value as Review;
    }
  }
  return {
    orders: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    deletedOrders: deletedOrders.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt) || b.createdAt.localeCompare(a.createdAt)),
    reviews,
  };
}
export async function writerOrders(owner: string): Promise<Order[]> {
  await init();
  if (sql) return activeOrders(sql, owner);
  return localActiveOrders(owner).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function rateLimit(key: string, max: number, seconds: number) {
  await init();
  const bucket = Math.floor(Date.now() / (seconds * 1000)); const rateKey = `rate:${key}:${bucket}`;
  if (sql) {
    const rows = await sql`INSERT INTO singgyul_private (key,value) VALUES (${rateKey},'1'::jsonb) ON CONFLICT (key) DO UPDATE SET value=to_jsonb((singgyul_private.value::text)::int+1) RETURNING value`;
    return Number(rows[0].value) <= max;
  }
  // Synchronous local increment prevents overlapping writes in the dev process.
  const file = path.join(directory, encodeURIComponent(rateKey) + '.json');
  const count = fs.existsSync(file) ? Number(fs.readFileSync(file, 'utf8')) + 1 : 1;
  fs.writeFileSync(file, JSON.stringify(count), { mode: 0o600 }); return count <= max;
}
