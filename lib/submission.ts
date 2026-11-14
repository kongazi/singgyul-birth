import { products, BUDGET, type Order } from './market.ts';

export type Receipt = Omit<Order, 'letter'>;
export function receipt(order: Order): Receipt { return { id: order.id, createdAt: order.createdAt, name: order.name, items: order.items, total: order.total }; }
export function parseSubmission(data: unknown): Order {
  if (!data || typeof data !== 'object') throw new Error('INVALID');
  const d = data as Record<string, unknown>;
  if (typeof d.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(d.id) || typeof d.name !== 'string' || !d.name.trim() || d.name.length > 30 || typeof d.letter !== 'string' || !d.letter.trim() || d.letter.length > 2000 || !Array.isArray(d.items) || d.items.length > products.length) throw new Error('INVALID');
  const seen = new Set<string>();
  const items = d.items.map(i => { const p = products.find(p => p.id === i?.id); if (!p || seen.has(p.id) || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 6) throw new Error('INVALID'); seen.add(p.id); return { id: p.id, name: p.name, price: p.price, quantity: i.quantity as number }; });
  const total = items.reduce((n,i)=>n+i.price*i.quantity,0); if (total > BUDGET) throw new Error('INVALID');
  return { id:d.id, createdAt:new Date().toISOString(), name:d.name.trim(), letter:d.letter.trim(), items, total };
}
