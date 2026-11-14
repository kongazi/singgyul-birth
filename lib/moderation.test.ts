import test from 'node:test';
import assert from 'node:assert/strict';
import { getReview, updateReview, deliveryReady } from './moderation.ts';
import type { Order } from './market';

test('기존 주문은 미확인 및 미분류로 시작한다', () => {
  assert.equal(getReview({}, 'old-order').checked, false);
  assert.equal(getReview({}, 'old-order').delivery, 'pending');
});
test('미확인 편지는 승인할 수 없고 확인 취소 시 승인이 해제된다', () => {
  let reviews = updateReview({}, 'a', { delivery: 'approved' });
  assert.equal(reviews.a.delivery, 'pending');
  reviews = updateReview(reviews, 'a', { checked: true, delivery: 'approved', note: '내용 확인' });
  assert.equal(reviews.a.delivery, 'approved');
  reviews = updateReview(reviews, 'a', { checked: false });
  assert.equal(reviews.a.delivery, 'pending');
  assert.equal(reviews.a.note, '내용 확인');
});
test('확인 및 승인된 편지만 전달 목록에 포함하며 편지 단독 기록도 지원한다', () => {
  const orders = ['a', 'b', 'c', 'd'].map(id => ({ id, name: '귤', letter: '축하해요', items: [], total: 0, createdAt: '' } satisfies Order));
  let reviews = updateReview({}, 'a', { checked: true, delivery: 'approved' });
  reviews = updateReview(reviews, 'b', { checked: true, delivery: 'held' });
  reviews = updateReview(reviews, 'c', { checked: true, delivery: 'rejected' });
  assert.deepEqual(deliveryReady(orders, reviews).map(o => o.id), ['a']);
  assert.equal(orders.length, 4);
});
