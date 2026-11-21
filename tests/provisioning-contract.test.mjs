import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('webhook provisiona compra inicial e coloca pedido em separação uma única vez', async () => {
  const [webhook, provisioning] = await Promise.all([
    read('lib/billing-webhook.ts'),
    read('lib/access-provisioning.ts'),
  ]);
  assert.match(webhook, /provisionPaidPurchase/);
  assert.match(provisioning, /\.for\("update"\)/);
  assert.match(provisioning, /mustChangePassword:\s*1/);
  assert.match(provisioning, /paymentStatus !== "paid"/);
  assert.match(provisioning, /stockMovements/);
});
