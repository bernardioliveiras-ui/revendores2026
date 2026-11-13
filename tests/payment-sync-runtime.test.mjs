import test from 'node:test';
import assert from 'node:assert/strict';
import {load,memoryDb,operators,table} from './runtime-loader.mjs';
function fixture(options={}){
 const p={id:'p1',orderNumber:'MIX1',kit:'mix10-unit',campaignId:'c1',asaasPaymentId:'pay1',asaasCustomerId:'cus1',totalCents:10990,paymentStatus:'payment_pending'};
 const schema={purchases:table('id','orderNumber')};const s=memoryDb(schema,{purchases:[{...p,...options.purchase}]});let calls=0;
 class AsaasRequestError extends Error{}
 const {POST}=load('app/api/admin/orders/sync/route.ts',{
 'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,
 '@/lib/auth':{requireAdmin:async()=>{if(options.auth)throw Error(options.auth)}},
 '@/lib/asaas':{AsaasRequestError,getPayment:async()=>({id:'pay1',customer:'cus1',externalReference:'p1',value:109.9,status:'RECEIVED',...options.remote})},
 '@/lib/env':{getOptionalEnv:()=> 'secret'},'@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},
 '@/lib/billing-webhook':{handleBillingWebhook:async request=>{calls++;const b=await request.json();assert.equal(b.payment.id,'pay1');assert.equal(request.headers.get('asaas-access-token'),'secret');Object.assign(s.rows.purchases[0],{paymentStatus:'paid',asaasVerifiedAt:'now'});return Response.json({received:true})}}
 });
 return {call:()=>POST(new Request('https://test/api/admin/orders/sync',{method:'POST',body:JSON.stringify({orderNumber:'MIX1'})})),get calls(){return calls}};
}
test('sync exige sessão de administrador',async()=>{for(const auth of ['UNAUTHORIZED','FORBIDDEN']){const s=fixture({auth});assert.equal((await s.call()).status,auth==='UNAUTHORIZED'?401:403);assert.equal(s.calls,0)}});
test('sync consulta cobrança e confirma pedido correspondente',async()=>{const s=fixture();const r=await s.call();assert.equal(r.status,200);assert.equal((await r.json()).updated,true);assert.equal(s.calls,1)});
test('sync não confirma PIX pendente',async()=>{const s=fixture({remote:{status:'PENDING'}});assert.equal((await (await s.call()).json()).updated,false);assert.equal(s.calls,0)});
test('sync bloqueia valor, cliente ou referência divergentes',async()=>{for(const remote of [{value:1},{customer:'other'},{externalReference:'other'},{id:'other'}]){const s=fixture({remote});assert.equal((await s.call()).status,409);assert.equal(s.calls,0)}});
test('sync não reativa cancelados',async()=>{const s=fixture({purchase:{paymentStatus:'cancelled'}});assert.equal((await s.call()).status,409);assert.equal(s.calls,0)});
test('sync alerta venda avulsa sem atribuição',async()=>{const s=fixture({purchase:{campaignId:null}});assert.match((await (await s.call()).json()).message,/não tem campanha/)});
