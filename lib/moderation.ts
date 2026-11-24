import type { Order } from './market';

export type Delivery = 'pending' | 'approved' | 'held' | 'rejected';
export type Review = { checked: boolean; delivery: Delivery; note: string; updatedAt: string };
export type Reviews = Record<string, Review>;
export type DeletedOrder = Order & { deletedAt: string };
export const deliveryLabels: Record<Delivery, string> = { pending: '미분류', approved: '전달 가능', held: '보류', rejected: '전달 불가' };
export function getReview(reviews: Reviews, id: string): Review {
  const r = reviews[id];
  return { checked: r?.checked === true, delivery: r && Object.hasOwn(deliveryLabels, r.delivery) ? r.delivery : 'pending', note: typeof r?.note === 'string' ? r.note : '', updatedAt: typeof r?.updatedAt === 'string' ? r.updatedAt : '' };
}
export function updateReview(reviews: Reviews, id: string, patch: Partial<Review>): Reviews {
  const next = { ...getReview(reviews, id), ...patch, updatedAt: new Date().toISOString() };
  // 승인 상태는 반드시 내용 확인을 거쳐야 합니다.
  if (!next.checked && next.delivery === 'approved') next.delivery = 'pending';
  return { ...reviews, [id]: next };
}
export function deliveryReady(orders: Order[], reviews: Reviews) {
  return orders.filter(o => { const r = getReview(reviews, o.id); return r.checked && r.delivery === 'approved'; });
}
