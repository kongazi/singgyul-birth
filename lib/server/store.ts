import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import type { Order } from '../market';
import type { Review, Reviews } from '../moderation';

const directory = path.join(process.cwd(), '.private-data');
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
export async function deleteOrder(id: string) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error('INVALID');
  await init();
  const keys = [`order:${id}`, `review:${id}`];
  if (sql) {
    await sql`DELETE FROM singgyul_private WHERE key IN (${keys[0]}, ${keys[1]})`;
  } else {
    for (const key of keys) fs.rmSync(path.join(directory, encodeURIComponent(key) + '.json'), { force: true });
  }
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
export async function submitOnce(order:Order,owner:string) {
  await init();
  const claim=`sent:${owner}`, key=`order:${order.id}`, value={...order,owner};
  if(sql) return sql.begin(async tx=>{
    const inserted=await tx`INSERT INTO singgyul_private (key,value) VALUES (${claim},${tx.json({id:order.id})}) ON CONFLICT (key) DO NOTHING RETURNING key`;
    if(!inserted.length) {
      const [existing]=await tx`SELECT value FROM singgyul_private WHERE key=${claim}`;
      const [saved]=await tx`SELECT value FROM singgyul_private WHERE key=${key}`;
      if(existing?.value.id===order.id && saved?.value.owner===owner) return saved.value as Order;
      throw new Error('ALREADY_SENT');
    }
    const saved=await tx`INSERT INTO singgyul_private (key,value) VALUES (${key},${tx.json(value)}) ON CONFLICT (key) DO NOTHING RETURNING key`;
    if(!saved.length)throw new Error('ID_CONFLICT');
    return order;
  });
  const claimFile=path.join(directory,encodeURIComponent(claim)+'.json');
  const orderFile=path.join(directory,encodeURIComponent(key)+'.json');
  try { fs.writeFileSync(claimFile,JSON.stringify({id:order.id}),{flag:'wx',mode:0o600}); }
  catch(e) {
    if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;
    const existing=JSON.parse(fs.readFileSync(claimFile,'utf8'));
    if(existing.id===order.id && fs.existsSync(orderFile)) {
      const saved=JSON.parse(fs.readFileSync(orderFile,'utf8'));
      if(saved.owner===owner)return saved as Order;
    }
    throw new Error('ALREADY_SENT');
  }
  try { fs.writeFileSync(orderFile,JSON.stringify(value),{flag:'wx',mode:0o600}); }
  catch(e) { fs.unlinkSync(claimFile);throw e; }
  return order;
}
export async function allRecords() {
  await init();
  const entries: {key:string;value:unknown}[] = sql ? await sql`SELECT key,value FROM singgyul_private WHERE key LIKE 'order:%' OR key LIKE 'review:%'` : fs.readdirSync(directory).filter(f => f.endsWith('.json')).map(f => ({ key: decodeURIComponent(f.slice(0, -5)), value: JSON.parse(fs.readFileSync(path.join(directory, f), 'utf8')) }));
  const orders: Order[] = []; const reviews: Reviews = {};
  for (const e of entries) { if (e.key.startsWith('order:')) orders.push(e.value as Order); if (e.key.startsWith('review:')) reviews[e.key.slice(7)] = e.value as Review; }
  return { orders: orders.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)), reviews };
}
export async function writerOrders(owner: string): Promise<Order[]> {
  await init();
  if (sql) {
    const rows = await sql`SELECT value FROM singgyul_private WHERE key LIKE 'order:%' AND value->>'owner'=${owner} ORDER BY value->>'createdAt' DESC`;
    return rows.map(row => row.value as Order);
  }
  const { orders } = await allRecords();
  return orders.filter(order => (order as Order & { owner?: string }).owner === owner);
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
