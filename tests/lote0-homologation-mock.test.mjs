// Integration through real BKO + billing + provisioning code, replacing only
// Asaas transport and MySQL. This is NOT a MySQL homologation test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {load,memoryDb,operators,table} from './runtime-loader.mjs';

const schema={
 purchases:table('id','orderNumber','asaasPaymentId','asaasInstallmentId','paymentStatus'),
 asaasEvents:table('eventId'),users:table('id','email'),resellerProfiles:table('id'),
 stockMovements:table('id','userId','referenceId','referenceType','type'),
 indicatorCampaigns:table('id'),authSessions:table('userId')
};
const purchase={
 id:'synthetic-order-01',orderNumber:'MOCK-0001',name:'Pessoa Teste',email:'comprador@example.test',phone:'11900000000',
 cpfCnpj:'00000000000',postalCode:'00000000',street:'Rua Teste',number:'1',complement:'',district:'Bairro Teste',
 city:'Cidade Teste',state:'SP',kit:'kit20',boxes:20,unitPriceCents:5495,totalCents:10990,
 asaasPaymentId:'pay_mock_01',asaasCustomerId:'cus_mock_01',asaasInvoiceUrl:'https://sandbox.asaas.com/i/pay_mock_01',
 asaasInstallmentId:null,installments:1,installmentValueCents:10990,
 paymentStatus:'payment_pending',asaasVerifiedAt:null,shippingStatus:'awaiting_payment',campaignId:null,
 indicatorCashbackCents:null,welcomeStatus:'pending',userId:null,accessReleasedAt:null,
 createdAt:'2026-11-20T12:00:00.000Z',updatedAt:'2026-11-20T12:00:00.000Z'
};
const remotePayment={
 id:'pay_mock_01',customer:'cus_mock_01',externalReference:'synthetic-order-01',
 value:109.90,status:'CONFIRMED',deleted:false,installment:undefined
};
const TOKEN='synthetic-token-not-a-credential';

function environment({saved={},remote={},asaasEnvironment='sandbox',offline=false,withCampaign=false}={}){
 const state=memoryDb(schema,{purchases:[{...purchase,...saved}],indicatorCampaigns:withCampaign?[{id:'campaign-mock-01',cashbackMode:'fixed',cashbackValue:1500}]:[]});
 let asaasReads=0,cashbackCalculations=0;
 const payment={...remotePayment,...remote};
 class AsaasRequestError extends Error{}
 const auth={requireAdmin:async()=>({id:'synthetic-admin',role:'admin'}),safeHashEqual:(a,b)=>a===b};
 const base={
  'drizzle-orm':operators,'@/db':{getDb:()=>state.db},'@/db/schema':schema,
  '@/lib/auth':auth,
  '@/lib/env':{getOptionalEnv:key=>key==='ASAAS_WEBHOOK_TOKEN'?TOKEN:undefined},
  '@/lib/asaas':{
   AsaasRequestError,
   getAsaasConfig:()=>({apiKey:'synthetic-only',configured:true,environment:asaasEnvironment}),
   getPayment:async id=>{
    asaasReads++;
    assert.equal(id,'pay_mock_01');
    if(offline)throw new AsaasRequestError('MOCK_TIMEOUT');
    return {...payment};
   }
  },
  '@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},
  '@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},
  '@/lib/purchase-fields':{operationalPurchaseFields:{}},
  '@/lib/mysql-errors':{isMysqlDuplicateKeyError:()=>false},
  '@/lib/temporary-secret':{encryptTemporarySecret:()=>({ciphertext:'synthetic-cipher',iv:'synthetic-iv'})},
  '@/lib/passwords':{generateTemporaryPassword:()=> 'temporary-only',hashPassword:async()=> 'synthetic-hash'},
  '@/lib/indicator-cashback.mjs':{calculateInfluencerCashback:()=>{cashbackCalculations++;return 1500}},
  'next/server':{after:()=>{}},
  '@/lib/purchase-measurement':{enqueueConfirmedPurchase:async()=>{},runPurchaseMeasurementQueue:async()=>{}}
 };
 const provisioning=load('lib/access-provisioning.ts',base);
 const webhook=load('lib/billing-webhook.ts',{...base,'@/lib/access-provisioning':provisioning});
 const sync=load('app/api/admin/orders/sync/route.ts',{...base,'@/lib/billing-webhook':webhook});
 const patch=load('app/api/admin/orders/route.ts',{...base,'@/app/api/admin/orders/sync/route':sync});
 const access=load('app/api/admin/access/route.ts',{...base,'@/lib/access-provisioning':provisioning});
 const req=(method,body)=>new Request('https://homolog.example.test/api/admin/orders',{
  method,headers:{'content-type':'application/json'},body:JSON.stringify(body)
 });
 return {
  ...state,get asaasReads(){return asaasReads},get cashbackCalculations(){return cashbackCalculations},
  patch:()=>patch.PATCH(req('PATCH',{purchaseId:purchase.id,status:'paid'})),
  access:()=>access.POST(req('POST',{purchaseId:purchase.id,action:'release'})),
  webhook:(id,event='PAYMENT_CONFIRMED')=>webhook.handleBillingWebhook(new Request('https://homolog.example.test/api/billing/webhook',{
   method:'POST',headers:{'content-type':'application/json','asaas-access-token':TOKEN},
   body:JSON.stringify({id,event,payment:{...payment,id:'pay_mock_01',status:event==='PAYMENT_REFUNDED'?'REFUNDED':payment.status}})
  })),
 };
}
const state=(s)=>({
 payment:s.rows.purchases[0].paymentStatus,
 accounts:s.rows.users.length,entries:s.rows.stockMovements.filter(m=>m.type==='entry').length,
 reversals:s.rows.stockMovements.filter(m=>m.referenceType==='cancelled_purchase').length
});

test('H01 CONFIRMED: BKO confirma por Asaas e provisiona uma única conta e entrada',async()=>{
 const s=environment();const result=await s.patch();
 assert.equal(result.status,200);assert.equal((await result.json()).updated,true);
 assert.deepEqual(state(s),{payment:'paid',accounts:1,entries:1,reversals:0});
 assert.ok(s.rows.purchases[0].asaasVerifiedAt);assert.equal(s.asaasReads,1);
});
test('H02 RECEIVED: BKO aplica status recebido pela mesma rota idempotente',async()=>{
 const s=environment({remote:{status:'RECEIVED'}});assert.equal((await s.patch()).status,200);
 assert.deepEqual(state(s),{payment:'paid',accounts:1,entries:1,reversals:0});
 assert.equal(s.rows.asaasEvents[0].eventType,'PAYMENT_RECEIVED');
});
test('H03 PENDING: não marca paid e não provisiona',async()=>{
 const s=environment({remote:{status:'PENDING'}});assert.equal((await s.patch()).status,409);
 assert.deepEqual(state(s),{payment:'payment_pending',accounts:0,entries:0,reversals:0});
 assert.equal(s.rows.asaasEvents.length,0);
});
test('H04 CANCELLED: cobrança cancelada não confirma pagamento local',async()=>{
 const s=environment({remote:{status:'CANCELLED'}});assert.equal((await s.patch()).status,409);
 assert.deepEqual(state(s),{payment:'payment_pending',accounts:0,entries:0,reversals:0});
});
test('H05 REFUND: webhook posterior cancela pedido e compensa estoque virtual uma vez',async()=>{
 const alreadyRefunded=environment({remote:{status:'REFUNDED'}});
 assert.equal((await alreadyRefunded.patch()).status,409);
 assert.deepEqual(state(alreadyRefunded),{payment:'payment_pending',accounts:0,entries:0,reversals:0});
 const s=environment();assert.equal((await s.patch()).status,200);
 assert.equal((await s.webhook('refund-synthetic-01','PAYMENT_REFUNDED')).status,200);
 assert.equal((await s.webhook('refund-synthetic-02','PAYMENT_REFUNDED')).status,200);
 assert.deepEqual(state(s),{payment:'cancelled',accounts:1,entries:1,reversals:1});
 assert.equal(s.rows.purchases[0].asaasVerifiedAt,null);
});
test('H06 INSTALLMENT: exige parcela individual e grupo vinculado ao pedido',async()=>{
 const saved={asaasInstallmentId:'installment-mock-01',installments:2,installmentValueCents:5495};
 const good=environment({saved,remote:{value:54.95,installment:'installment-mock-01'}});
 assert.equal((await good.patch()).status,200);assert.equal(good.rows.purchases[0].paymentStatus,'paid');
 const bad=environment({saved,remote:{value:54.95,installment:'different-group'}});
 assert.equal((await bad.patch()).status,409);assert.equal(bad.rows.purchases[0].paymentStatus,'payment_pending');
});
test('H07 VALUE: diferença de um centavo não autoriza acesso nem estoque',async()=>{
 const s=environment({remote:{value:109.89}});assert.equal((await s.patch()).status,409);
 assert.deepEqual(state(s),{payment:'payment_pending',accounts:0,entries:0,reversals:0});
});
test('H08 EXTERNAL REFERENCE: não aceita cobrança de outro pedido',async()=>{
 const s=environment({remote:{externalReference:'different-order'}});assert.equal((await s.patch()).status,409);
 assert.deepEqual(state(s),{payment:'payment_pending',accounts:0,entries:0,reversals:0});
});
test('H09 ENVIRONMENT: não mistura link de sandbox com conta production',async()=>{
 const s=environment({asaasEnvironment:'production'});assert.equal((await s.patch()).status,409);
 assert.equal(s.asaasReads,0);assert.equal(s.rows.purchases[0].paymentStatus,'payment_pending');
});
test('H10 CONCURRENCY: duas reconciliações simultâneas geram uma conta e estoque',async()=>{
 const s=environment();const results=await Promise.all([s.patch(),s.patch()]);
 assert.deepEqual(results.map(r=>r.status),[200,200]);
 assert.deepEqual(state(s),{payment:'paid',accounts:1,entries:1,reversals:0});
 assert.equal(s.rows.asaasEvents.length,1);
});
test('H11 ACCESS: paid sem asaasVerifiedAt não permite release no BKO',async()=>{
 const s=environment({saved:{paymentStatus:'paid',asaasVerifiedAt:null}});
 assert.equal((await s.access()).status,409);
 assert.deepEqual(state(s),{payment:'paid',accounts:0,entries:0,reversals:0});
});
test('H12 DISTINCT IDS: webhooks diferentes do mesmo pagamento não duplicam fatos financeiros',async()=>{
 const s=environment({withCampaign:true,saved:{campaignId:'campaign-mock-01',productTotalCents:10990,shippingCents:0,interestCents:0}});
 assert.equal((await s.webhook('synthetic-event-01')).status,200);
 assert.equal((await s.webhook('synthetic-event-02')).status,200);
 assert.deepEqual(state(s),{payment:'paid',accounts:1,entries:1,reversals:0});
 assert.equal(s.rows.asaasEvents.length,2,'eventos de transporte diferentes são preservados para auditoria');
 assert.equal(s.rows.purchases[0].indicatorCashbackCents,1500);
 assert.equal(s.cashbackCalculations,1,'snapshot financeiro é calculado uma única vez');
});
test('H13 OFFLINE: Asaas indisponível gera 502 sem marcar paid',async()=>{
 const s=environment({offline:true});const r=await s.patch();
 assert.equal(r.status,502);assert.equal(s.rows.purchases[0].paymentStatus,'payment_pending');
 assert.equal(s.rows.users.length,0);assert.equal(s.rows.stockMovements.length,0);
 assert.doesNotMatch(await r.text(),/MOCK_TIMEOUT|synthetic-token/);
});
