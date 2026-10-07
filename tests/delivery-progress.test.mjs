import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryProgress, canAdvanceShipping } from '../lib/delivery-progress.ts';
test('unpaid and cancelled orders never show completed delivery steps',()=>{
 assert.equal(deliveryProgress('payment_pending','delivered').step,-1);
 assert.equal(deliveryProgress('cancelled','delivered').step,-1);
});
test('paid delivery progresses from separation to delivered',()=>{
 assert.equal(deliveryProgress('paid','separating').step,0);
 assert.equal(deliveryProgress('paid','shipped').step,1);
 assert.equal(deliveryProgress('paid','delivered').step,2);
});
test('shipping cannot regress or bypass a cancelled order',()=>{
 assert.equal(canAdvanceShipping('delivered','separating'),false);
 assert.equal(canAdvanceShipping('shipped','separating'),false);
 assert.equal(canAdvanceShipping('cancelled','shipped'),false);
 assert.equal(canAdvanceShipping('separating','shipped'),true);
 assert.equal(canAdvanceShipping('shipped','delivered'),true);
});
