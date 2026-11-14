import { receipt } from './submission';
import { storage, type Order } from './market';
import { getReview, type Reviews } from './moderation';

// Called only after the administrator endpoint has authenticated this browser.
export async function migrateAdminRecords() {
  const legacy = storage.load<Order[]>('orders', []);
  const existing = storage.load<Order[]>('receipts', []);
  if (Array.isArray(legacy) && legacy.length) {
    const migrated = [];
    for (const order of legacy) {
      const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
      if (!r.ok) throw new Error('MIGRATION_FAILED');
      migrated.push((await r.json()).receipt);
    }
    const all = [...migrated, ...(Array.isArray(existing) ? existing : [])].map(receipt);
    storage.save('receipts', Array.from(new Map(all.map(o => [o.id, o])).values()));
    localStorage.removeItem('singgyul.v1.orders');
  }
  const oldReviews = storage.load<Reviews>('reviews', {});
  if (oldReviews && typeof oldReviews === 'object') {
    for (const id of Object.keys(oldReviews)) {
      const r = await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...getReview(oldReviews, id) }) });
      if (!r.ok) throw new Error('MIGRATION_FAILED');
    }
    localStorage.removeItem('singgyul.v1.reviews');
  }
}
