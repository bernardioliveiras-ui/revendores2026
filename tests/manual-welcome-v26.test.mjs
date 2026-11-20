import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { manualWhatsAppLink, manualEmailLink, normalizeBrazilianPhone } from '../lib/manual-welcome.mjs';
import { load, memoryDb, operators, table } from './runtime-loader.mjs';

const origin = 'https://revendedores.mix10pro.com.br';
test('WhatsApp abre link reutilizável por revendedor, com telefone brasileiro normalizado e sem segredo', () => {
  assert.equal(normalizeBrazilianPhone('(11) 99888-7777'), '5511998887777');
  assert.equal(normalizeBrazilianPhone('55 (11) 99888-7777'), '5511998887777');
  assert.equal(normalizeBrazilianPhone('abc'), null);
  assert.equal(manualWhatsAppLink({ phone: 'not a phone', name: 'Maria', origin }), null);
  const link = manualWhatsAppLink({ name: 'Maria Silva', phone: '(11) 99888-7777', origin });
  const url = new URL(link);
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/5511998887777');
  assert.match(url.searchParams.get('text'), /Olá, Maria/);
  assert.match(url.searchParams.get('text'), /revendedores\.mix10pro\.com\.br\/entrar/);
  assert.doesNotMatch(url.searchParams.get('text'), /Senha provisória:\s*\w+|password=|token=/i);
  assert.equal(link.includes('password'), false);
});
test('e-mail preenche assunto e corpo sem dados de autenticação', () => {
  const link = manualEmailLink({ name: 'Eduardo Silva', email: 'revendedor@example.org', origin });
  assert.ok(link.startsWith('mailto:revendedor@example.org?'));
  assert.match(decodeURIComponent(link), /Bem-vindo/);
  assert.equal(manualEmailLink({ email: 'email invalido', origin }), null);
});
function setup({ role = 'admin', purchase = {}, rejectAuth = false } = {}) {
  const schema = { purchases: table('id') };
  const base = { id:'pedido-1', userId:'rev-1', accessReleasedAt:'2026-11-01T13:00:00.000Z', paymentStatus:'paid', welcomeStatus:'pending', welcomeSecret:'encrypted', welcomeIv:'iv', createdAt:'2026-11-01T12:00:00.000Z' };
  const state = memoryDb(schema, { purchases:[{ ...base, ...purchase }] });
  const { POST } = load('app/api/admin/welcome/route.ts', {
    'drizzle-orm': operators, '@/db':{getDb:()=>state.db}, '@/db/schema':schema,
    '@/lib/auth':{requireAdmin:async()=>{if(rejectAuth)throw Error('UNAUTHORIZED');if(role!=='admin')throw Error('FORBIDDEN')}} ,
    '@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},
  });
  const call = (body) => POST(new Request(origin+'/api/admin/welcome', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
  return {...state,call};
}
const confirmed = { purchaseId:'pedido-1', channel:'whatsapp', confirm:'CONFIRMO_ENVIO' };
test('não permite registrar envio sem ação explícita do BKO', async () => {
  const s=setup(); assert.equal((await s.call({purchaseId:'pedido-1'})).status,400);
  assert.equal((await s.call({purchaseId:'pedido-1',channel:'whatsapp'})).status,400);
  assert.equal(s.rows.purchases[0].welcomeStatus,'pending');
});
test('somente ADMIN pode registrar boas-vindas', async()=>{
  assert.equal((await setup({rejectAuth:true}).call(confirmed)).status,401);
  assert.equal((await setup({role:'reseller'}).call(confirmed)).status,403);
  assert.equal((await setup({role:'indicator'}).call(confirmed)).status,403);
});
test('pedido pendente, sem conta, sem acesso ou reposição não podem marcar boas-vindas', async()=>{
  for (const patch of [{paymentStatus:'payment_pending'},{userId:null},{accessReleasedAt:null},{welcomeStatus:'not_required'}]) {
    const s=setup({purchase:patch}); assert.equal((await s.call(confirmed)).status,409);
    assert.equal(s.rows.purchases[0].welcomeStatus,patch.welcomeStatus||'pending');
  }
});
test('registro após envio é idempotente e não dispara API externa', async()=>{
  const s=setup(); let called=0; const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>{called++;throw Error('NÃO DEVE FAZER REDE')};
  try {
    const r=await s.call(confirmed);assert.equal(r.status,200);
    assert.equal((await r.json()).recorded,true);
    assert.equal(s.rows.purchases[0].welcomeStatus,'sent');
    assert.ok(s.rows.purchases[0].welcomeSentAt);
    assert.equal(s.rows.purchases[0].welcomeSecret,null);
    const repeat=await s.call(confirmed);assert.equal(repeat.status,200);
    assert.equal((await repeat.json()).duplicate,true);
    assert.equal(called,0);
  } finally {globalThis.fetch=originalFetch}
});
test('webhook não envia automaticamente e card só oferece WhatsApp após liberar acesso',()=>{
  const webhook=readFileSync(new URL('../app/api/billing/webhook/route.ts',import.meta.url),'utf8');
  const portal=readFileSync(new URL('../app/painel/portal-client.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(webhook,/\bsendWelcome\s*\(/);
  assert.match(portal,/p\.accessReleasedAt && p\.welcomeStatus !== "sent"/);
  assert.match(portal,/Abrir WhatsApp/);
  assert.match(portal,/Marcar boas-vindas enviadas/);
  assert.match(portal,/return manualWhatsAppLink/);
});

test('BKO consulta senha provisória sem redefinir usuário e sem cache', async()=>{
  const schema={purchases:table('id'),users:table('id'),authSessions:table('userId')};
  const purchase={id:'p1',paymentStatus:'paid',asaasVerifiedAt:'2026-11-20T00:00:00Z',userId:'u1',accessReleasedAt:'now',welcomeStatus:'pending',welcomeSecret:'encrypted',welcomeIv:'iv',email:'reseller@example.org'};
  const state=memoryDb(schema,{purchases:[purchase],users:[{id:'u1',passwordHash:'original-hash'}]});
  const mocks={'drizzle-orm':operators,'@/db':{getDb:()=>state.db},'@/db/schema':schema,
    '@/lib/purchase-fields':{operationalPurchaseFields:{}},'@/lib/temporary-secret':{decryptTemporarySecret:(cipher,iv)=>{assert.equal(cipher,'encrypted');assert.equal(iv,'iv');return 'senha-secreta';}},
    '@/lib/access-provisioning':{provisionPaidPurchase:async()=>{throw Error('SHOULD_NOT_PROVISION')}},
    '@/lib/auth':{requireAdmin:async()=>{}},'@/lib/passwords':{generateTemporaryPassword:()=>{throw Error('SHOULD_NOT_RESET')},hashPassword:async()=>{throw Error('SHOULD_NOT_RESET')}},'@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},
  };
  const {POST}=load('app/api/admin/access/route.ts',mocks);
  const call=(purchaseId='p1')=>POST(new Request(origin+'/api/admin/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({purchaseId,action:'view-credentials'})}));
  const response=await call(); assert.equal(response.status,200);
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  assert.deepEqual(await response.json(),{email:'reseller@example.org',password:'senha-secreta'});
  assert.equal(state.rows.users[0].passwordHash,'original-hash');
  assert.equal(state.rows.purchases[0].welcomeStatus,'pending');
  assert.equal((await call('invalid')).status,404);
});
