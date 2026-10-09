import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './runtime-loader.mjs';
const service = () => load('lib/purchase-measurement-browser.ts');
const config = { ga4Id: 'G-TEST123', metaPixelId: '123456789' };
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };

test('recusa não lê IDs de cookies nem consulta o Google', async () => {
  const fail = () => { throw Error('Must not read optional identifiers'); };
  assert.equal(await service().collectPurchaseIdentifiers(config, () => ({analytics:false,ads:false}), fail, fail), undefined);
});
test('IDs do Google são consultados só com consentimento analítico; publicidade permanece separada', async () => {
  const s = service(); let cookieRead = false;
  const result = await s.collectPurchaseIdentifiers(config, () => ({analytics:true,ads:false}), async field => field === 'client_id' ? '123.456' : 12345, () => { cookieRead = true; return '_fbp=private'; });
  assert.equal(result.clientId, '123.456'); assert.equal(result.sessionId, '12345'); assert.equal(result.fbp, undefined); assert.equal(cookieRead, false);
});
test('retirada durante a coleta assíncrona remove os identificadores da finalidade retirada', async () => {
  let choice = {analytics:true,ads:true};
  const result = await service().collectPurchaseIdentifiers(config, () => choice, async () => { choice={analytics:false,ads:true}; return '123.456'; }, () => '_fbp=fb.1.1791539000000.123');
  assert.equal(result.clientId, undefined); assert.equal(result.analyticsConsent, false); assert.equal(result.fbp, 'fb.1.1791539000000.123');
});
test('recibo guarda só a capacidade de retirada e conserva retirada pendente se a rede falhar', async () => {
  const s=service(), storage=memory(); const now=Date.now();
  s.rememberPurchaseReceipt(storage, {purchaseId:'p1',withdrawalToken:'a'.repeat(64),expiresAt:new Date(now+10000).toISOString(),analytics:true,ads:true,email:'private@example.test'},now);
  assert.equal(storage.getItem(s.PURCHASE_RECEIPTS_KEY).includes('private@'),false);
  await s.syncPurchaseReceipts(storage,{analytics:false,ads:true},async()=>{throw Error('offline')},now);
  let pending=JSON.parse(storage.getItem(s.PURCHASE_RECEIPTS_KEY))[0];assert.equal(pending.pending,true);assert.equal(pending.analytics,false);
  let sent;await s.syncPurchaseReceipts(storage,{analytics:true,ads:true},async body=>{sent=body;return 200},now);
  assert.equal(sent.analytics,false,'nova aceitação não reautoriza a compra cuja retirada estava pendente');
  assert.equal(JSON.parse(storage.getItem(s.PURCHASE_RECEIPTS_KEY))[0].pending,false);
});
test('recibos inválidos ou expirados não provocam chamadas de retirada', async () => {
  const s=service(), storage=memory(); const now=Date.now();
  s.rememberPurchaseReceipt(storage,{purchaseId:'p1',withdrawalToken:'secret',expiresAt:new Date(now+10000).toISOString()},now);
  s.rememberPurchaseReceipt(storage,{purchaseId:'p1',withdrawalToken:'a'.repeat(64),expiresAt:new Date(now-1).toISOString()},now);
  await s.syncPurchaseReceipts(storage,{analytics:false,ads:false},async()=>{throw Error('Must not send')},now);
  assert.deepEqual(JSON.parse(storage.getItem(s.PURCHASE_RECEIPTS_KEY)||'[]'),[]);
});
test('o primeiro recibo exige confirmação ao servidor mesmo sem retirar consentimento', async () => {
  const s=service(), store=memory();let calls=0;
  s.rememberPurchaseReceipt(store,{purchaseId:'p1',withdrawalToken:'a'.repeat(64),expiresAt:new Date(Date.now()+10000).toISOString(),analytics:true,ads:true});
  await s.syncPurchaseReceipts(store,{analytics:true,ads:true},async()=>{calls++;return 200});
  assert.equal(calls,1);assert.equal(JSON.parse(store.getItem(s.PURCHASE_RECEIPTS_KEY))[0].pending,false);
});
