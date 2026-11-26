import test from 'node:test';
import assert from 'node:assert/strict';
import {load,memoryDb,operators,table} from './runtime-loader.mjs';
import {normalizeCustomerPhone,buildResellerClients} from '../lib/reseller-clients.mjs';

test('venda manual no BKO com telefone também entra nos Clientes do revendedor, sem saldo extra',async()=>{
 const schema={users:table('id'),sales:table('userId'),stockMovements:table('userId')};
 const s=memoryDb(schema,{users:[{id:'seller-1',role:'reseller',status:'active'}],sales:[],stockMovements:[{id:'initial',userId:'seller-1',type:'entry',boxes:10}]});
 const {POST}=load('app/api/admin/sales/route.ts',{
  'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/auth':{requireAdmin:async()=>({id:'bko'})},'@/lib/stock':load('lib/stock.ts'),'@/lib/stock-repair':{repairPaidPurchaseStockForUser:async()=>{}},'@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},'@/lib/reseller-clients.mjs':{normalizeCustomerPhone}
 });
 const request=new Request('https://lord.test/api/admin/sales',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({userId:'seller-1',boxes:2,unitValue:109.9,customerName:'Cliente BKO',customerPhone:'(11) 97777-2222'})});
 const response=await POST(request);
 assert.equal(response.status,200);
 assert.equal(s.rows.sales[0].customerPhone,'11977772222');
 assert.deepEqual(buildResellerClients(s.rows.sales).map(c=>c.name),['Cliente BKO']);
 assert.equal(s.rows.stockMovements.length,2);
});
