import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root=new URL('..',import.meta.url).pathname;const read=(p)=>readFile(join(root,p),'utf8');

test('BKO access release is admin-only, manual and transactional', async()=>{
  const src=await read('app/api/admin/access/route.ts');
  assert.match(src,/requireAdmin/);
  assert.match(src,/paymentStatus\s*!==\s*"paid"/);
  assert.match(src,/generateTemporaryPassword/);
  assert.match(src,/transaction/);
  assert.match(src,/stockMovements/);
  assert.match(src,/mustChangePassword:\s*1/);
});

test('BKO shipping allows shipped without a tracking code', async()=>{
  const src=await read('app/api/admin/shipping/route.ts');
  assert.match(src,/"shipped"/);
  assert.match(src,/trackingCode/);
  assert.doesNotMatch(src,/if\s*\([^)]*trackingCode[^)]*\)\s*return[\s\S]*required/i);
});

test('admin overview keeps global business metrics', async()=>{
  const src=await read('app/api/admin/overview/route.ts');
  for(const key of ['activeResellers','paidPurchases','kitRevenueCents','boxesSold','aggregateStock','affiliateLinks','affiliateClicks']) assert.match(src,new RegExp(key));
});


test('BKO preserves CNPJ fiscal data for invoice handling', async()=>{
  const access=await read('app/api/admin/access/route.ts');
  const portal=await read('app/painel/portal-client.tsx');
  for(const field of ['companyTradeName','stateRegistration','municipalRegistration']) {
    assert.match(access,new RegExp(field));
    assert.match(portal,new RegExp(field));
  }
  assert.match(portal,/Fiscal:/);
});
