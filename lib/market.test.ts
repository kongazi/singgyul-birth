import test from 'node:test';
import assert from 'node:assert/strict';
import {addItem,total,validCart} from './market.ts';
test('100귤까지 담을 수 있고 초과는 거부한다',()=>{let cart={mic:1,controller:1};const exact=addItem(cart,'mug');assert.equal(total(exact),100);assert.equal(addItem(exact,'photo'),exact);assert.equal(total(cart),75);});
test('같은 상품의 수량도 예산에 포함한다',()=>{let cart={mug:3};assert.equal(total(addItem(cart,'mug')),100);assert.equal(addItem({mug:4},'mug').mug,4);});
test('잘못되거나 예산을 초과한 저장값을 복구한다',()=>{assert.deepEqual(validCart(null),{});assert.deepEqual(validCart({mic:3}),{});assert.deepEqual(validCart({mug:-2,photo:1,unknown:10}),{photo:1});assert.deepEqual(validCart({mug:1.5}),{});});
