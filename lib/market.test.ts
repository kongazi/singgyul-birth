import test from 'node:test';
import assert from 'node:assert/strict';
import {addItem,total,validCart,products,BUDGET} from './market.ts';
const [first, second] = products;
test('100귤까지 담을 수 있고 초과는 거부한다',()=>{
 const count = BUDGET / first.price;
 const cart = {[first.id]: count - 1};
 const exact = addItem(cart, first.id);
 assert.equal(total(exact), BUDGET);
 assert.equal(addItem(exact, second.id), exact);
 assert.equal(total(cart), BUDGET - first.price);
});
test('같은 상품의 수량도 예산에 포함한다',()=>{
 const cart = {[first.id]: 2};
 assert.equal(total(addItem(cart, first.id)), first.price * 3);
});
test('잘못되거나 예산을 초과한 저장값을 복구한다',()=>{
 assert.deepEqual(validCart(null),{});
 assert.deepEqual(validCart({[first.id]: Math.floor(BUDGET / first.price) + 1}),{});
 assert.deepEqual(validCart({[first.id]:-2,[second.id]:1,unknown:10}),{[second.id]:1});
 assert.deepEqual(validCart({[first.id]:1.5}),{});
});
