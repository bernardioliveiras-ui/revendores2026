import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFile(join(root, p), 'utf8');

test('cashback is fixed, separated from billing, and idempotent per purchase', async () => {
  const schema = await read('db/schema.ts');
  const webhook = await read('app/api/billing/webhook/route.ts');
  const bridge = await read('app/api/public/affiliate/qualify/route.ts');
  assert.match(schema, /affiliateCashbacks/);
  assert.match(schema, /amountCents: int\("amount_cents"\).*default\(1500\)/);
  assert.match(schema, /uniqueIndex\("idx_cashback_purchase"\)/);
  assert.match(webhook, /affiliateCashbacks/);
  assert.match(bridge, /AFFILIATE_WEBHOOK_TOKEN/);
  assert.match(bridge, /paymentStatus !== "paid"/);
});

test('affiliate redirect preserves the referral code for the external LP', async () => {
  const route = await read('app/r/[code]/route.ts');
  assert.match(route, /referralCode/);
  assert.match(route, /utm_medium/);
  assert.match(route, /mix10pro\.com\.br\/lp-v2/);
});
