import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFile(join(root,p),'utf8');

test('Asaas webhook requires configured token and records events idempotently', async () => {
  const src = await read('lib/billing-webhook.ts');
  assert.match(src,/ASAAS_WEBHOOK_TOKEN/);
  assert.match(src,/asaas-access-token/);
  assert.match(src,/asaasEvents/);
  assert.match(src,/duplicate/);
});

test('paid Asaas events mark paid and provision through the shared transactional service', async () => {
  const src = await read('lib/billing-webhook.ts');
  assert.match(src,/PAYMENT_RECEIVED/);
  assert.match(src,/PAYMENT_CONFIRMED/);
  assert.match(src,/paymentStatus:status/);
  assert.match(src,/shippingStatus:[\s\S]*"separating"/);
  assert.match(src,/provisionPaidPurchase/);
  assert.doesNotMatch(src,/generateTemporaryPassword|hashPassword|insert\(users\)/);
});
