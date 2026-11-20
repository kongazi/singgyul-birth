import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSubmission, receipt } from './submission.ts';
import { products, BUDGET } from './market.ts';
const product = products[0];
test('10귤 굿즈 10개는 전송할 수 있고 100귤 초과는 거부한다', () => {
  const ten = products.find(p => p.price === 10)!;
  const data = { id: 'b82402b0-8576-4ac0-a77e-03fa13c5fa3f', name: '테스트', letter: '축하해요', items: [{ id: ten.id, quantity: 10 }] };
  assert.equal(parseSubmission(data).total, 100);
  assert.throws(() => parseSubmission({ ...data, items: [{ id: ten.id, quantity: 11 }] }));
});
const input = { id: 'b82402b0-8576-4ac0-a77e-03fa13c5fa3f', name: '테스트', letter: '관리자 전용 본문', items: [] };
test('편지만 서버에 접수할 수 있고 응답에는 본문이 없다', () => {
  const order = parseSubmission(input);
  assert.equal(order.total, 0);
  assert.equal(order.letter, input.letter);
  assert.equal(Object.hasOwn(receipt(order), 'letter'), false);
  assert.equal(JSON.stringify(receipt(order)).includes(input.letter), false);
});
test('가격은 클라이언트 값을 신뢰하지 않고 서버에서 계산한다', () => {
  const order = parseSubmission({ ...input, items: [{ id: product.id, quantity: 2, price: 0 }], total: 0 });
  assert.equal(order.total, product.price * 2);
  assert.throws(() => parseSubmission({ ...input, items: [{ id: product.id, quantity: Math.floor(BUDGET / product.price) + 1 }] }));
});
test('빈 본문, 초과 길이, 중복 상품, 잘못된 수량을 거부한다', () => {
  for (const patch of [{ letter: ' ' }, { name: '' }, { letter: 'a'.repeat(2001) }, { items: [{ id: product.id, quantity: -1 }] }, { items: [{ id: product.id, quantity: 1 }, { id: product.id, quantity: 1 }] }]) assert.throws(() => parseSubmission({ ...input, ...patch }));
});
