import test from 'node:test';
import assert from 'node:assert/strict';
import {load,memoryDb,operators,table} from './runtime-loader.mjs';
import {asaasAuditStub} from './helpers/asaas-audit-stub.mjs';

const schema={purchases:table('id','orderNumber'),users:table('id'),stockMovements:table('referenceId')};
const basePurchase={id:'p1',orderNumber:'LORD-101',kit:'kit20',asaasPaymentId:'pay1',asaasCustomerId:'cus1',asaasInstallmentId:null,
 asaasInvoiceUrl:'https://sandbox.asaas.com/i/pay1',totalCents:10990,installments:1,installmentValueCents:10990,
 paymentStatus:'payment_pending',shippingStatus:'awaiting_payment'};
const baseRemote={id:'pay1',customer:'cus1',externalReference:'p1',value:109.90,status:'CONFIRMED',deleted:false};

function fixture({purchase={},remote={},environment='sandbox',asaasOffline=false,admin=true}={}){
 const s=memoryDb(schema,{purchases:[{...basePurchase,...purchase}],users:[],stockMovements:[]});
 let lookups=0,provisions=0;const events=[];
 class AsaasRequestError extends Error{}
 const deps={
  'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,
  '@/lib/auth':{requireAdmin:async()=>{if(!admin)throw Error('FORBIDDEN');return {id:'admin1',role:'admin'}}},
  '@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},
  '@/lib/purchase-fields':{operationalPurchaseFields:{}},
  '@/lib/access-provisioning':{provisionPaidPurchase:async()=>{provisions++;return {released:true}}},
  '@/lib/asaas':{
   AsaasRequestError,
   getAsaasConfig:()=>({configured:true,apiKey:'test-only',environment,baseUrl:environment==='sandbox'?'https://api-sandbox.asaas.com/v3':'https://api.asaas.com/v3'}),
   getPayment:async()=>{lookups++;if(asaasOffline)throw new AsaasRequestError('OFFLINE');return {...baseRemote,...remote}}
  },
  '@/lib/asaas-reconciliation-audit':asaasAuditStub,
  '@/lib/env':{getOptionalEnv:key=>key==='ASAAS_WEBHOOK_TOKEN'?'test-token':undefined},
  '@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},
  '@/lib/billing-webhook':{handleBillingWebhook:async request=>{
   const event=await request.json();events.push(event);
   // Simulate the output of the existing idempotent webhook service, not the provider.
   const row=s.rows.purchases[0];row.paymentStatus='paid';row.asaasVerifiedAt='2026-11-20T00:00:00Z';row.shippingStatus='separating';
   if(events.length===1){s.rows.users.push({id:'u1'});s.rows.stockMovements.push({referenceId:row.id,boxes:20})}
   return Response.json({received:true,duplicate:events.length>1});
  }}
 };
 deps['@/app/api/admin/orders/sync/route']={POST:load('app/api/admin/orders/sync/route.ts',deps).POST};
 const PATCH=load('app/api/admin/orders/route.ts',deps).PATCH;
 const request=()=>new Request('https://example.test/api/admin/orders',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({purchaseId:'p1',status:'paid'})});
 return {...s,request,call:()=>PATCH(request()),get lookups(){return lookups},get provisions(){return provisions},get events(){return events}};
}

test('PATCH BKO não transforma pedido pendente em pago se Asaas retornar PENDING',async()=>{
 const s=fixture({remote:{status:'PENDING'}});const response=await s.call();
 assert.equal(s.rows.purchases[0].paymentStatus,'payment_pending');
 assert.equal(s.rows.purchases[0].shippingStatus,'awaiting_payment');
 assert.equal(s.rows.users.length,0);assert.equal(s.rows.stockMovements.length,0);
 assert.equal(s.events.length,0);assert.equal(s.provisions,0);
 assert.notEqual((await response.json()).updated,true);
});

test('PATCH BKO falha fechado se Asaas estiver indisponível',async()=>{
 const s=fixture({asaasOffline:true});const response=await s.call();
 assert.notEqual(response.status,200);
 assert.equal(s.rows.purchases[0].paymentStatus,'payment_pending');
 assert.equal(s.rows.stockMovements.length,0);assert.equal(s.events.length,0);
});

for(const status of ['OVERDUE','CANCELLED','REFUNDED','CHARGEBACK_REQUESTED','DELETED','PENDING']){
 test(`PATCH BKO não confirma status Asaas ${status}`,async()=>{
  const s=fixture({remote:{status}});await s.call();
  assert.equal(s.rows.purchases[0].paymentStatus,'payment_pending');
  assert.equal(s.events.length,0);assert.equal(s.rows.stockMovements.length,0);
 });
}

for(const [name,remote] of [
 ['payment ID',{id:'wrong-payment'}],['titular',{customer:'other'}],['titular ausente',{customer:undefined}],
 ['externalReference',{externalReference:'other'}],['externalReference ausente',{externalReference:undefined}],
 ['valor',{value:1}],['valor ausente',{value:undefined}],
])test(`PATCH BKO bloqueia divergência de ${name}`,async()=>{
 const s=fixture({remote});const response=await s.call();
 assert.equal(response.status,409);assert.equal(s.rows.purchases[0].paymentStatus,'payment_pending');
 assert.equal(s.events.length,0);assert.equal(s.rows.stockMovements.length,0);
});

test('PATCH BKO bloqueia pedido cancelado mesmo quando Asaas confirma',async()=>{
 const s=fixture({purchase:{paymentStatus:'cancelled'}});assert.equal((await s.call()).status,409);
 assert.equal(s.rows.purchases[0].paymentStatus,'cancelled');assert.equal(s.events.length,0);
});
test('PATCH BKO bloqueia diferença de apenas um centavo no valor confirmado',async()=>{
 const s=fixture({remote:{value:109.89}});const response=await s.call();
 assert.equal(response.status,409);assert.equal(s.rows.purchases[0].paymentStatus,'payment_pending');assert.equal(s.events.length,0);
});

test('PATCH BKO bloqueia ambientes Asaas divergentes pelo vínculo da cobrança salvo no pedido',async()=>{
 const s=fixture({environment:'production'});const response=await s.call();
 assert.equal(response.status,409);assert.equal(s.rows.purchases[0].paymentStatus,'payment_pending');assert.equal(s.events.length,0);
});

test('PATCH BKO exige referência correta do parcelamento e valor de cada parcela',async()=>{
 for(const remote of [{installment:'wrong-group',value:54.95},{installment:'ins1',value:1}]){
  const s=fixture({purchase:{asaasInstallmentId:'ins1',installments:2,installmentValueCents:5495},remote});
  const response=await s.call();assert.equal(response.status,409);assert.equal(s.events.length,0);
 }
});

test('PATCH BKO confirma somente pelo Asaas e não duplica acesso/estoque em repetição',async()=>{
 const s=fixture();for(let i=0;i<2;i++){
  const response=await s.call();assert.equal(response.status,200);assert.equal((await response.json()).updated,true);
 }
 assert.equal(s.lookups,2);assert.equal(s.provisions,0);
 assert.equal(s.rows.purchases[0].paymentStatus,'paid');assert.equal(s.rows.purchases[0].shippingStatus,'separating');
 assert.equal(s.rows.users.length,1);assert.equal(s.rows.stockMovements.length,1);
});
