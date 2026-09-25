import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { calculateStock } from '../lib/stock.ts';
const root=new URL('..',import.meta.url).pathname;const read=(p)=>readFile(join(root,p),'utf8');

test('stock math adds entries and subtracts sales/out adjustments',()=>{
  assert.equal(calculateStock([{type:'entry',boxes:20},{type:'sale',boxes:3},{type:'adjustment_in',boxes:2},{type:'adjustment_out',boxes:1}]),18);
});

test('sales endpoint prevents overselling current stock and records sale plus stock movement',async()=>{
  const src=await read('app/api/sales/route.ts');
  assert.match(src,/Estoque insuficiente/);
  assert.match(src,/transaction/);
  assert.match(src,/insert\(sales\)/);
  assert.match(src,/insert\(stockMovements\)/);
});

test('affiliate endpoint collects customer and WhatsApp and returns individual public link',async()=>{
  const src=await read('app/api/referrals/route.ts');
  assert.match(src,/customerName/);assert.match(src,/whatsapp/);assert.match(src,/publicCode/);assert.match(src,/\/r\//);
  const redirect=await read('app/r/[code]/route.ts');
  assert.match(redirect,/AFFILIATE_DESTINATION_URL/);assert.match(redirect,/clickCount/);assert.match(redirect,/affiliateClicks/);
});
