import test from 'node:test';
import assert from 'node:assert/strict';
import { load, memoryDb, operators, table } from './runtime-loader.mjs';

const schema={users:table('id'),sales:table('userId','clientRequestId'),stockMovements:table('userId'),resellerSalePriceSettings:table('id'),resellerSalePriceHistory:table('id')};
function setup(available=50,priceCents=10990){
 const fixture=memoryDb(schema,{users:[{id:'seller-1'}],stockMovements:[{id:'initial',userId:'seller-1',type:'entry',boxes:available}],resellerSalePriceSettings:[{id:1,priceCents}]});
 fixture.db.execute=async()=>[];
 const {POST}=load('app/api/sales/route.ts',{'drizzle-orm':{...operators,desc:()=>{},sql:()=>{}},'@/db':{getDb:()=>fixture.db},'@/db/schema':schema,'@/lib/auth':{requireSession:async()=>({id:'seller-1',role:'reseller'})},'@/lib/stock':load('lib/stock.ts'),'@/lib/stock-repair':{repairPaidPurchaseStockForUser:async()=>{}},'@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}}});
 return {...fixture,POST};
}
const make=(data)=>new Request('https://lord.test/api/sales',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
test('preço adulterado pelo revendedor é ignorado no servidor e estoque é deduzido',async()=>{
 const s=setup();const r=await s.POST(make({boxes:3,unitValue:0.01,requestId:'a0011000-0000-4000-8000-000000000001'}));
 assert.equal(r.status,200);const b=await r.json();assert.equal(b.unitPriceCents,10990);assert.equal(b.remainingStock,47);
 assert.equal(s.rows.sales[0].totalValueCents,32970);assert.equal(s.rows.sales[0].unitValueCents,10990);
 assert.equal(s.rows.stockMovements.at(-1).boxes,3);
});
test('mesmo requestId não duplica venda nem movimento',async()=>{
 const s=setup();const data={boxes:2,requestId:'a0011000-0000-4000-8000-000000000002'};
 const a=await s.POST(make(data));const b=await s.POST(make(data));
 assert.equal(a.status,200);assert.equal(b.status,200);assert.equal((await b.json()).created,false);
 assert.equal(s.rows.sales.length,1);assert.equal(s.rows.stockMovements.length,2);
});
test('vendas simultâneas acima do saldo são rejeitadas pelo lock',async()=>{
 const s=setup(3);const results=await Promise.all([s.POST(make({boxes:2,requestId:'a0011000-0000-4000-8000-000000000003'})),s.POST(make({boxes:2,requestId:'a0011000-0000-4000-8000-000000000004'}))]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(s.rows.sales.length,1);
});

test('somente BKO pode alterar preço; nova venda já usa valor atualizado e deixa auditoria',async()=>{
 const s=setup();
 const {validateResellerSalePrice,DEFAULT_RESELLER_SALE_PRICE_CENTS}=await import('../lib/reseller-sale-price.mjs');
 const mocks={'drizzle-orm':{...operators,desc:()=>{},sql:()=>{}},'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},'@/lib/reseller-sale-price.mjs':{validateResellerSalePrice,DEFAULT_RESELLER_SALE_PRICE_CENTS}};
 const forbidden=load('app/api/admin/reseller-sale-price/route.ts',{...mocks,'@/lib/auth':{requireAdmin:async()=>{throw Error('FORBIDDEN')}}});
 const payload={priceCents:11990,reason:'Reajuste de tabela'};
 assert.equal((await forbidden.PATCH(make(payload))).status,403);
 assert.equal(s.rows.resellerSalePriceSettings[0].priceCents,10990);
 const {PATCH}=load('app/api/admin/reseller-sale-price/route.ts',{...mocks,'@/lib/auth':{requireAdmin:async()=>({id:'bko-1',role:'admin'})}});
 const r=await PATCH(make(payload));assert.equal(r.status,200);
 assert.equal(s.rows.resellerSalePriceSettings[0].priceCents,11990);
 assert.equal(s.rows.resellerSalePriceHistory.length,1);
 const sale=await s.POST(make({boxes:1,requestId:'a0011000-0000-4000-8000-000000000005',unitValue:0.01}));
 assert.equal(sale.status,200);assert.equal(s.rows.sales[0].unitValueCents,11990);
});
