import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFile(join(root, p), 'utf8');

test('kit catalog has the approved KIT20 and KIT50 values', async () => {
  assert.ok(existsSync(join(root, 'lib/kits.ts')));
  const source = await read('lib/kits.ts');
  assert.match(source, /kit20[\s\S]*boxes:\s*20[\s\S]*unitPriceCents:\s*7490[\s\S]*totalCents:\s*149800/);
  assert.match(source, /kit50[\s\S]*boxes:\s*50[\s\S]*unitPriceCents:\s*6990[\s\S]*totalCents:\s*349500/);
  assert.doesNotMatch(source, /kit30/i);
});

test('fresh schema contains only the V1 operational tables', async () => {
  const sql = await read('database/schema.sql');
  for (const table of ['users','auth_sessions','purchases','reseller_profiles','stock_movements','sales','affiliate_referrals','affiliate_clicks','asaas_events']) {
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS `'+table+'`'));
  }
  assert.doesNotMatch(sql, /auth_login_codes|invitations|memberships/);
});

test('package has no Resend or Cloudflare runtime', async () => {
  const pkg = await read('package.json');
  assert.doesNotMatch(pkg, /resend|wrangler|cloudflare/i);
});
