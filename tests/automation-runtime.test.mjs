import test from 'node:test';
import assert from 'node:assert/strict';
import {load,memoryDb,operators,table} from './runtime-loader.mjs';
const schema={purchases:table('id','asaasPaymentId','paymentStatus'),asaasEvents:table('eventId'),users:table('id','email'),stockMovements:table('id','userId','referenceId'),resellerProfiles:table('id')};
const paid={id:'p1',email:'buyer@test.com',paymentStatus:'paid',boxes:20,kit:'kit20',asaasPaymentId:'pay1'};
function provision(initial){
 const state=memoryDb(schema,initial);
 const service=load('lib/access-provisioning.ts',{'drizzle-orm':operators,'@/db':{getDb:()=>state.db},'@/db/schema':schema,'@/lib/temporary-secret':{encryptTemporarySecret:()=>({ciphertext:'encrypted',iv:'iv'})},'@/lib/passwords':{generateTemporaryPassword:()=> 'temporary',hashPassword:async()=> 'hash'},'@/lib/mysql-errors':{isMysqlDuplicateKeyError:()=>false},'@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},'@/lib/indicator-cashback.mjs':{calculateInfluencerCashback:()=>1500},'@/lib/purchase-fields':{operationalPurchaseFields:{}}});
 return {...state,...service};
}
test('pagamento pendente não libera acesso nem estoque',async()=>{
 const s=provision({purchases:[{...paid,paymentStatus:'payment_pending'}]});
 await assert.rejects(s.provisionPaidPurchase('p1'),/PAYMENT_REQUIRED/);assert.equal(s.rows.users.length,0);assert.equal(s.rows.stockMovements.length,0);
});
test('duas liberações concorrentes de um pedido criam um acesso e um estoque',async()=>{
 const s=provision({purchases:[paid]});await Promise.all([s.provisionPaidPurchase('p1'),s.provisionPaidPurchase('p1')]);
 assert.equal(s.rows.users.length,1);assert.equal(s.rows.stockMovements.length,1);assert.equal(s.rows.stockMovements[0].boxes,20);
});
test('recompra usa conta existente sem substituir senha',async()=>{
 const s=provision({purchases:[paid],users:[{id:'u1',email:paid.email,role:'reseller',status:'active',passwordHash:'original'}]});
 await s.provisionPaidPurchase('p1');assert.equal(s.rows.users[0].passwordHash,'original');assert.equal(s.rows.stockMovements.length,1);
});
test('boas-vindas da recompra permitem conta existente sem senha provisória',async()=>{
 const s=memoryDb(schema,{purchases:[{...paid,userId:'u1',welcomeStatus:'pending'}]});let sent;
 const original=globalThis.fetch;globalThis.fetch=async(_url,options)=>{sent=JSON.parse(options.body);return {ok:true}};
 try{
 const {sendWelcome}=load('lib/welcome-notification.ts',{'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/env':{getOptionalEnv:(key)=>key==='WELCOME_AUTOMATION_URL'?'https://example.test/hook':'token'},'@/lib/temporary-secret':{decryptTemporarySecret:()=>{throw Error('No password')}},'@/lib/welcome-contract':{welcomeEndpoint:v=>v,welcomeKey:v=>v},'@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},'@/lib/indicator-cashback.mjs':{calculateInfluencerCashback:()=>1500},'@/lib/purchase-fields':{operationalPurchaseFields:{}}});
 assert.equal((await sendWelcome('p1')).sent,true);assert.equal(sent.temporaryPassword,null);assert.equal(s.rows.purchases[0].welcomeStatus,'sent');
 }finally{globalThis.fetch=original}
});
function webhook(initial, overrides={}){
 const s=memoryDb(schema,initial);let releases=0;
 const {POST}=load('app/api/billing/webhook/route.ts',{'next/server':{after:()=>{}},'@/lib/purchase-measurement':{enqueueConfirmedPurchase:async()=>{},runPurchaseMeasurementQueue:async()=>{}},'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/auth':{safeHashEqual:(a,b)=>a===b},'@/lib/env':{getOptionalEnv:()=> 'secret'},'@/lib/mysql-errors':{isMysqlDuplicateKeyError:()=>false},'@/lib/access-provisioning':{provisionPaidPurchase:async()=>{releases++}},'@/lib/welcome-notification':{sendWelcome:async()=>({sent:true})},'@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},'@/lib/indicator-cashback.mjs':{calculateInfluencerCashback:()=>1500},'@/lib/purchase-fields':{operationalPurchaseFields:{}},'@/lib/asaas':{getPayment:async()=>({})},...overrides});
 const call=(body,token='secret')=>POST(new Request('https://example.test/api/billing/webhook',{method:'POST',headers:{'asaas-access-token':token,'content-type':'application/json'},body:typeof body==='string'?body:JSON.stringify(body)}));
 return {...s,call,get releases(){return releases}};
}
const event={id:'evt1',event:'PAYMENT_CONFIRMED',payment:{id:'pay1'}};
test('webhook desconhecido pede reenvio sem consumir o evento',async()=>{
 const s=webhook({});assert.equal((await s.call(event)).status,503);assert.equal(s.rows.asaasEvents.length,0);
});
test('webhook inválido retorna 400 e token errado retorna 401',async()=>{
 const s=webhook({});assert.equal((await s.call('{')).status,400);assert.equal((await s.call(event,'wrong')).status,401);
});
test('webhook pago e repetido mantêm pagamento e registro único',async()=>{
 const s=webhook({purchases:[{...paid,paymentStatus:'payment_pending',shippingStatus:'awaiting_payment'}]});
 assert.equal((await s.call(event)).status,200);assert.equal((await s.call(event)).status,200);assert.equal(s.rows.asaasEvents.length,1);assert.equal(s.rows.purchases[0].paymentStatus,'paid');assert.equal(s.rows.purchases[0].shippingStatus,'separating');
});
test('confirmação atrasada não reativa pagamento cancelado',async()=>{
 const s=webhook({purchases:[{...paid,paymentStatus:'cancelled'}]});await s.call(event);assert.equal(s.rows.purchases[0].paymentStatus,'cancelled');assert.equal(s.releases,0);
});
test('mesmo identificador com outro pagamento é rejeitado',async()=>{
 const s=webhook({purchases:[paid],asaasEvents:[{eventId:'evt1',eventType:'PAYMENT_CONFIRMED',paymentId:'other'}]});assert.equal((await s.call(event)).status,409);
});
test('expedição avança, preserva rastreio e rejeita regressão',async()=>{
 const s=memoryDb(schema,{purchases:[{...paid,shippingStatus:'separating',carrier:null,trackingCode:null}]});
 const {updatePurchaseShipping}=load('lib/shipping.ts',{'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/delivery-progress':load('lib/delivery-progress.ts'),'@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},'@/lib/indicator-cashback.mjs':{calculateInfluencerCashback:()=>1500},'@/lib/purchase-fields':{operationalPurchaseFields:{}},'@/lib/order-notification':{sendOrderStatusEmail:async()=>({sent:true})}});
 await updatePurchaseShipping('p1','shipped','Transportadora','BR123');await updatePurchaseShipping('p1','delivered');
 assert.equal(s.rows.purchases[0].trackingCode,'BR123');assert.equal((await updatePurchaseShipping('p1','separating')).ignored,true);assert.equal(s.rows.purchases[0].shippingStatus,'delivered');
});
test('pagamento de outra LP com referência externa não bloqueia fila do Asaas',async()=>{
 const s=webhook({});const response=await s.call({...event,payment:{id:'external-payment',externalReference:'external-order'}});
 assert.equal(response.status,200);assert.equal((await response.json()).ignored,true);assert.equal(s.rows.asaasEvents.length,0);
});

test('reenvio do webhook recupera provisionamento que falhou após gravar pagamento',async()=>{
 let attempts=0,welcome=0;
 const s=webhook({purchases:[{...paid,paymentStatus:'payment_pending',shippingStatus:'awaiting_payment'}]},{'@/lib/access-provisioning':{provisionPaidPurchase:async()=>{if(++attempts===1)throw Error('PROVISION_TEMPORARILY_UNAVAILABLE')}},'@/lib/welcome-notification':{sendWelcome:async()=>{welcome++;return {sent:true}}}});
 assert.equal((await s.call(event)).status,500);assert.equal(s.rows.purchases[0].paymentStatus,'paid');
 assert.equal((await s.call(event)).status,200);assert.equal(s.rows.asaasEvents.length,1);assert.equal(attempts,2);assert.equal(welcome,0,'BKO envia boas-vindas manualmente');
});

test('automação de boas-vindas repete a mesma chave e apaga segredo apenas após sucesso',async()=>{
 const s=memoryDb(schema,{purchases:[{...paid,userId:'u1',welcomeStatus:'pending',welcomeSecret:'encrypted',welcomeIv:'generation-1'}]});
 const calls=[];const original=globalThis.fetch;
 globalThis.fetch=async(_url,options)=>{calls.push(options);return {ok:calls.length>1}};
 try{
  const {sendWelcome}=load('lib/welcome-notification.ts',{'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/env':{getOptionalEnv:key=>({WELCOME_AUTOMATION_URL:'https://example.test/hook',WELCOME_AUTOMATION_TOKEN:'test-token',NEXT_PUBLIC_APP_URL:'https://example.test'})[key]},'@/lib/temporary-secret':{decryptTemporarySecret:()=> 'temporary-password'},'@/lib/welcome-contract':load('lib/welcome-contract.ts'),'@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},'@/lib/indicator-cashback.mjs':{calculateInfluencerCashback:()=>1500},'@/lib/purchase-fields':{operationalPurchaseFields:{}}});
  await assert.rejects(sendWelcome('p1'),/WELCOME_DELIVERY_FAILED/);assert.equal(s.rows.purchases[0].welcomeSecret,'encrypted');
  assert.equal((await sendWelcome('p1')).sent,true);assert.equal(s.rows.purchases[0].welcomeSecret,null);assert.equal(s.rows.purchases[0].welcomeIv,null);
  assert.equal(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key']);
  assert.equal((await sendWelcome('p1')).duplicate,true);assert.equal(calls.length,2);
 }finally{globalThis.fetch=original}
});

test('pagamento pendente não envia automação de acesso',async()=>{
 const s=memoryDb(schema,{purchases:[{...paid,paymentStatus:'payment_pending',userId:'u1',welcomeStatus:'pending'}]});
 const {sendWelcome}=load('lib/welcome-notification.ts',{'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/env':{getOptionalEnv:()=>{throw Error('NOT_QUALIFIED_MUST_NOT_SEND')}},'@/lib/temporary-secret':{},'@/lib/welcome-contract':{},'@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},'@/lib/indicator-cashback.mjs':{calculateInfluencerCashback:()=>1500},'@/lib/purchase-fields':{operationalPurchaseFields:{}}});
 assert.equal((await sendWelcome('p1')).reason,'not_qualified');assert.equal(s.rows.purchases[0].welcomeStatus,'pending');
});

test('fallback Resend preserva chave de idempotência nos reenvios de boas-vindas',async()=>{
 const s=memoryDb(schema,{purchases:[{...paid,userId:'u1',welcomeStatus:'pending',welcomeSecret:'encrypted',welcomeIv:'generation-1',name:'Buyer',orderNumber:'MIX1'}]});
 const calls=[];const original=globalThis.fetch;
 globalThis.fetch=async(_url,options)=>{calls.push(options);return {ok:calls.length>1}};
 try{
  const {sendWelcome}=load('lib/welcome-notification.ts',{'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/env':{getOptionalEnv:key=>({RESEND_API_KEY:'test-only-resend-key',WELCOME_EMAIL_FROM:'sender@example.test',NEXT_PUBLIC_APP_URL:'https://example.test'})[key]},'@/lib/temporary-secret':{decryptTemporarySecret:()=> 'temporary-password'},'@/lib/welcome-contract':load('lib/welcome-contract.ts'),'@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},'@/lib/indicator-cashback.mjs':{calculateInfluencerCashback:()=>1500},'@/lib/purchase-fields':{operationalPurchaseFields:{}}});
  await assert.rejects(sendWelcome('p1'),/WELCOME_EMAIL_FAILED/);assert.equal((await sendWelcome('p1')).sent,true);
  assert.equal(calls[0].headers['Idempotency-Key'],'lordnutri-welcome:p1:generation-1');assert.equal(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key']);
 }finally{globalThis.fetch=original}
});

test('falha de mensuração não impede provisionamento do pagamento confirmado',async()=>{const s=webhook({purchases:[{...paid,paymentStatus:'payment_pending'}]},{'@/lib/purchase-measurement':{enqueueConfirmedPurchase:async()=>{throw Error('TRACKING_OFFLINE')},runPurchaseMeasurementQueue:async()=>{}}});assert.equal((await s.call(event)).status,200);assert.equal(s.rows.purchases[0].paymentStatus,'paid');assert.equal(s.releases,1)});
