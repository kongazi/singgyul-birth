import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSubmission, receipt } from './submission.ts';
const input = { id: 'b82402b0-8576-4ac0-a77e-03fa13c5fa3f', name: '테스트', letter: '관리자 전용 본문', items: [] };
test('편지만 서버에 접수할 수 있고 응답에는 본문이 없다', () => {
  const order = parseSubmission(input);
  assert.equal(order.total, 0);
  assert.equal(order.letter, input.letter);
  assert.equal(Object.hasOwn(receipt(order), 'letter'), false);
  assert.equal(JSON.stringify(receipt(order)).includes(input.letter), false);
});
test('가격은 클라이언트 값을 신뢰하지 않고 서버에서 계산한다', () => {
  const order = parseSubmission({ ...input, items: [{ id: 'mic', quantity: 2, price: 0 }], total: 0 });
  assert.equal(order.total, 80);
  assert.throws(() => parseSubmission({ ...input, items: [{ id: 'mic', quantity: 3 }] }));
});
test('빈 본문, 초과 길이, 중복 상품, 잘못된 수량을 거부한다', () => {
  for (const patch of [{ letter: ' ' }, { name: '' }, { letter: 'a'.repeat(2001) }, { items: [{ id: 'mic', quantity: -1 }] }, { items: [{ id: 'mic', quantity: 1 }, { id: 'mic', quantity: 1 }] }]) assert.throws(() => parseSubmission({ ...input, ...patch }));
});
