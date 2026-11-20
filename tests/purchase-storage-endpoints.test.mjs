import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { load } from './runtime-loader.mjs';
const contract = load('lib/purchase-measurement-contract.ts');
function storage(env = {}, execute = async () => [[]]) {
  let deliveries = 0;
  const service = load('lib/purchase-measurement.ts', {
    '@/db': { getMysqlPool: () => ({execute}) }, '@/lib/env': {getOptionalEnv:key=>env[key]},
    './purchase-measurement-contract':contract,
    './purchase-measurement-worker':{drainPurchaseMeasurements:async()=>{deliveries++;return {sent:0}}},
  });
  return {...service,get deliveries(){return deliveries}};
}
test('captura desativada não acessa o banco nem devolve recibo', async () => {
  const s=storage({},async()=>{throw Error('Must not query')});
  assert.equal(await s.capturePurchaseMeasurement('p1',{analyticsConsent:true},new Request('https://example.test')),null);
});
test('snapshot sem confirmação do navegador nunca é enfileirado mesmo com pedido pago', async () => {
  const calls=[];const conn={beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{},execute:async(sql)=>{calls.push(sql);if(sql.includes('FROM purchases'))return [[{id:'p1',payment_status:'paid'}]];if(sql.includes('FROM purchase_measurement'))return [[{snapshot:JSON.stringify({analyticsConsent:true,adsConsent:false,clientId:'123.456',expiresAt:new Date(Date.now()+10000).toISOString()}),expires_at:new Date(Date.now()+10000).toISOString(),activated_at:null}]];throw Error('Must not queue an unacknowledged purchase')}};
  const service=load('lib/purchase-measurement.ts',{'@/db':{getMysqlPool:()=>({getConnection:async()=>conn})},'@/lib/env':{getOptionalEnv:key=>({PURCHASE_MEASUREMENT_ENABLED:'true',ASAAS_ENVIRONMENT:'production'})[key]},'./purchase-measurement-contract':contract,'./purchase-measurement-worker':{}});
  await service.enqueueConfirmedPurchase('p1');assert.equal(calls.length,2);assert.equal(calls.some(sql=>/^(INSERT|UPDATE)\b/.test(sql)),false);
});
test('captura persiste somente snapshot sanitizado e hash do token de retirada', async () => {
  let saved;
  const s=storage({PURCHASE_MEASUREMENT_ENABLED:'true',ASAAS_ENVIRONMENT:'production',NEXT_PUBLIC_GA4_MEASUREMENT_ID:'G-TEST',GA4_API_SECRET:'server-secret'},async(_sql,values)=>{saved=values;return [[]]});
  const receipt=await s.capturePurchaseMeasurement('p1',{analyticsConsent:true,adsConsent:false,ga4Id:'G-TEST',clientId:'123.456',email:'private@example.test',totalCents:1},new Request('https://example.test'));
  assert.equal(receipt.purchaseId,'p1');assert.equal(receipt.analytics,true);assert.equal(receipt.ads,false);
  assert.equal(saved[2],createHash('sha256').update(receipt.withdrawalToken).digest('hex'));
  assert.equal(saved.includes(receipt.withdrawalToken),false);
  assert.equal(JSON.stringify(saved).includes('private@'),false);assert.equal(JSON.parse(saved[1]).totalCents,undefined);
});
test('expiração continua limpando identificadores mesmo com entrega desativada', async () => {
  const calls=[];const s=storage({},async(sql,values)=>{calls.push({sql,values});return [[]]});
  assert.deepEqual(await s.runPurchaseMeasurementQueue(),{disabled:true});
  assert.equal(s.deliveries,0);assert.equal(calls.length,1);
  assert.match(calls[0].sql,/UPDATE purchase_measurement SET snapshot = '\{\}', withdrawal_token_hash = NULL WHERE expires_at <= \?/);
  assert.ok(Number.isFinite(Date.parse(calls[0].values[0])));
});
test('endpoint de retry exige segredo antes de acessar a fila', async () => {
  let calls=0;
  const route=load('app/api/internal/measurement/retry/route.ts',{'@/lib/auth':{safeHashEqual:(a,b)=>a===b},'@/lib/env':{getOptionalEnv:()=> 'token-private'},'@/lib/purchase-measurement':{runPurchaseMeasurementQueue:async()=>{calls++;return {sent:1}}}});
  assert.equal((await route.POST(new Request('https://example.test/api/internal/measurement/retry',{method:'POST'}))).status,401);assert.equal(calls,0);
  assert.equal((await route.POST(new Request('https://example.test/api/internal/measurement/retry',{method:'POST',headers:{authorization:'Bearer token-private'}}))).status,200);assert.equal(calls,1);
});
test('retirada valida origem e formato e só encaminha flags e capacidade do pedido', async () => {
  const calls=[];const route=load('app/api/public/measurement/consent/route.ts',{'@/lib/purchase-measurement':{revokePurchaseMeasurement:async(...args)=>{calls.push(args);return true}}});
  const request=(body,origin='https://example.test')=>new Request('https://example.test/api/public/measurement/consent',{method:'POST',headers:{origin},body:JSON.stringify(body)});
  assert.equal((await route.POST(request(null))).status,400);
  const body={purchaseId:'p1',withdrawalToken:'a'.repeat(64),analytics:false,ads:true,email:'private@example.test'};
  assert.equal((await route.POST(request(body,'https://other.test'))).status,403);assert.equal(calls.length,0);
  assert.equal((await route.POST(request(body))).status,200);
  assert.deepEqual(calls,[['p1','a'.repeat(64),{analytics:false,ads:true}]]);
});
