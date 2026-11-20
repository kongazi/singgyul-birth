import { json } from '../../../lib/server/auth';
import { account } from '../../../lib/server/account';
import { writerOrders } from '../../../lib/server/store';
export const runtime = 'nodejs';
export async function GET() {
  try {
    const owner = (await account())?.owner;
    if (!owner) return json({ orders: [] });
    const orders = await writerOrders(owner);
    return json({ orders: orders.map(o => ({ id: o.id, createdAt: o.createdAt, name: o.name, letter: o.letter, items: o.items, total: o.total })) });
  } catch { return json({ error: '보낸 편지를 불러오지 못했어요. 다시 시도해 주세요.' }, 503); }
}
