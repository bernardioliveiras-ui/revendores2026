import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('webhook atual marca compra paga e provisionamento legado fica desativado', async () => {
  const [webhook, provisioning] = await Promise.all([
    read('app/api/billing/webhook/route.ts'),
    read('lib/access-provisioning.ts'),
  ]);
  assert.match(webhook, /paymentStatus:"paid"/);
  assert.match(webhook, /shippingStatus: purchase\.shippingStatus === "awaiting_payment" \? "separating"/);
  assert.match(provisioning, /Provisionamento automático legado desativado/);
  assert.match(provisioning, /\/api\/admin\/access/);
});
