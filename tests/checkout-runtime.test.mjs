import test from 'node:test';
import assert from 'node:assert/strict';
import {load,memoryDb,operators,table} from './runtime-loader.mjs';
const schema={purchases:table('id','paymentStatus')};
const kits=load('lib/kits.ts');
const pricing=load('lib/checkout/pricing.ts',{'@/lib/checkout/shipping-rates':load('lib/checkout/shipping-rates.ts'),'@/lib/checkout/shipping-additions':load('lib/checkout/shipping-additions.ts')});
const data={kit:'kit20',name:'Comprador de teste',email:'buyer@example.test',phone:'11999999999',cpfCnpj:'12345678909',postalCode:'01001000',street:'Praça da Sé',number:'1',district:'Sé',city:'São Paulo',state:'SP',acceptedTerms:'yes',shippingType:'economical',paymentMethod:'pix',installments:1};
function checkout({failure=false,concurrentPaid=false,measurementFailure=false}={}){const s=memoryDb(schema);let charged;const {POST}=load('app/api/public/checkout/route.ts',{'@/lib/purchase-measurement':{capturePurchaseMeasurement:async()=>{if(measurementFailure)throw Error('TRACKING_OFFLINE');return null}},'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/campaigns':{campaignCookieFromRequest:()=>null,validCampaignCode:()=>false,resolveCampaign:async()=>null},'@/lib/kits':kits,'@/lib/checkout/pricing':pricing,'@/lib/postal-code':{lookupPostalCode:async()=>({state:'SP'}),PostalLookupError:class extends Error{}},'@/lib/asaas':{AsaasRequestError:class extends Error{},createCheckoutCustomer:async()=>({id:'cus1'}),createPayment:async(input)=>{charged=input;if(concurrentPaid)s.rows.purchases[0].paymentStatus='paid';if(failure)throw Error('TEST_PROVIDER_FAILURE');return {id:'pay1',invoiceUrl:'https://sandbox.asaas.com/i/test',installment:input.installments>1?'ins1':undefined}}}});return {...s,POST,get charged(){return charged}};}
const req=(body,referer)=>new Request('https://example.test',{method:'POST',body:JSON.stringify(body),headers:referer?{referer}:{}});
test('origem de checkout não persiste dados pessoais de query ou fragmento',async()=>{
 const s=checkout();assert.equal((await s.POST(req(data,'https://example.test/?email=buyer@example.test#phone=11999999999'))).status,200);
 assert.equal(s.rows.purchases[0].landingPage,'https://example.test/');
});
test('referer inválido é ignorado sem bloquear compra',async()=>{
 const s=checkout();assert.equal((await s.POST(req(data,'not a URL'))).status,200);assert.equal(s.rows.purchases[0].landingPage,'');
});
test('cliente não consegue alterar o valor cobrado por payload adulterado',async()=>{const s=checkout();const r=await s.POST(req({...data,totalCents:1,productTotalCents:1}));assert.equal(r.status,200);assert.equal(s.charged.valueCents,s.rows.purchases[0].totalCents);assert.equal(s.rows.purchases[0].productTotalCents,149800);assert.ok(s.charged.valueCents>149800);assert.equal(s.rows.purchases[0].paymentStatus,'payment_pending')});
test('cartão armazena vínculo do parcelamento sem liberar estoque por criação da cobrança',async()=>{const s=checkout();const r=await s.POST(req({...data,paymentMethod:'credit',installments:6}));assert.equal(r.status,200);assert.equal(s.rows.purchases[0].asaasInstallmentId,'ins1');assert.equal(s.rows.purchases[0].installments,6);assert.equal(s.rows.purchases[0].paymentStatus,'payment_pending');assert.ok(s.rows.purchases[0].interestCents>0)});
test('erro de provedor marca erro de pagamento pendente',async()=>{const s=checkout({failure:true});assert.equal((await s.POST(req(data))).status,500);assert.equal(s.rows.purchases[0].paymentStatus,'payment_error')});
test('falha de checkout não sobrescreve pagamento confirmado pelo webhook concorrente',async()=>{const s=checkout({failure:true,concurrentPaid:true});assert.equal((await s.POST(req(data))).status,500);assert.equal(s.rows.purchases[0].paymentStatus,'paid')});
test('dados sem aceite não criam compra',async()=>{const s=checkout();assert.equal((await s.POST(req({...data,acceptedTerms:'no'}))).status,400);assert.equal(s.rows.purchases.length,0)});
test('UF incoerente com CEP não inicia cobrança',async()=>{const s=checkout();assert.equal((await s.POST(req({...data,state:'RJ'}))).status,400);assert.equal(s.rows.purchases.length,0)});

test('falha opcional de mensuração não impede criar pagamento',async()=>{const s=checkout({measurementFailure:true});assert.equal((await s.POST(req(data))).status,200);assert.equal(s.rows.purchases[0].paymentStatus,'payment_pending');assert.ok(s.charged)});
