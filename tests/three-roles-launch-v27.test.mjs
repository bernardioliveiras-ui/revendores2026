import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { load, memoryDb, table, operators } from './runtime-loader.mjs';
import { invitationHash, newInvitationToken } from '../lib/indicated-security.ts';
const read = p => readFileSync(new URL('../'+p, import.meta.url),'utf8');
const root = new URL('../',import.meta.url);
const deleted = [
  'app/api/admin/indicated/route.ts','app/api/admin/indicated/invite/route.ts',
  'app/api/indicated/me/route.ts','app/api/indicated/activate/route.ts',
  'app/api/indicated/receipt/route.ts','app/minha-indicacao/page.tsx',
  'components/indicated-access-admin.tsx','app/api/indicator/receipt/route.ts',
  'app/api/indicator/leads/route.ts','app/api/indicator/leads/share/route.ts',
  'app/api/admin/indicators/leads/route.ts','app/i/[code]/route.ts'
];
test('existem somente três áreas operacionais e rotas legadas não estão implantáveis',()=>{
  for(const file of deleted) assert.equal(existsSync(new URL(file,root)),false,file);
  const roles=read('lib/auth.ts');
  assert.match(roles,/role: "admin" \| "reseller" \| "indicator"/);
  assert.doesNotMatch(roles,/row\.role !== "client_indicated"/);
  assert.doesNotMatch(read('components/indicator-admin.tsx'),/IndicatedAccessAdmin|Registros antigos/);
  assert.doesNotMatch(read('app/painel/portal-client.tsx'),/minha-indicacao|Clientes indicados/);
});
test('login de cliente legado bloqueado sem apagar conta',async()=>{
  const schema={users:table('email','id')};
  const s=memoryDb(schema,{users:[{id:'legacy',email:'antigo@test.example',role:'client_indicated',status:'active',passwordHash:'historical',failedLoginAttempts:0}]});
  const mod=load('app/api/auth/login/route.ts',{
    'drizzle-orm':operators, '@/db':{getDb:()=>s.db},'@/db/schema':schema,
    '@/lib/auth':{createSession:async()=>{throw Error('MUST_NOT_CREATE_SESSION')},isAdminEmail:()=>false,normalizeEmail:v=>v},
    '@/lib/env':{getOptionalEnv:()=>null},
    '@/lib/passwords':{hashPassword:async()=>{throw Error('MUST_NOT_HASH')},verifyPassword:async()=>{throw Error('MUST_NOT_VERIFY')}},
  });
  const r=await mod.POST(new Request('https://app.test/api/auth/login',{method:'POST',body:JSON.stringify({email:'antigo@test.example',password:'any'})}));
  assert.equal(r.status,401);
  assert.equal(s.rows.users[0].status,'active','histórico não apagado');
});
test('convite válido é exclusivo de influenciador; revendedor/admin/cliente legado não recebem convite',async()=>{
  const schema={users:table('id','role','status'),indicatorProfiles:table('userId'),indicatedInvitations:table('clientUserId','tokenHash','usedAt')};
  for (const role of ['reseller','admin','client_indicated','indicator']) {
    const s=memoryDb(schema,{users:[{id:'u',role,status:'active'}],indicatorProfiles:[{userId:'u'}]});
    const api=load('lib/indicator-invitations.ts',{
      'drizzle-orm':{...operators,isNull:col=>row=>row[col]==null},'@/db':{getDb:()=>s.db},'@/db/schema':schema,
      '@/lib/indicator-schema':{ensureIndicatorSchema:async()=>{}},'@/lib/indicated-security':{invitationHash,newInvitationToken},
    });
    if(role==='indicator'){
      const a=await api.issueIndicatorInvitation('u');
      assert.match(a.activationPath,/^\/ativar-indicador\?token=/);
      const token=new URL(a.activationPath,'https://site.test').searchParams.get('token');
      assert.equal(s.rows.indicatedInvitations[0].tokenHash,invitationHash(token));
      assert.equal(s.rows.indicatedInvitations[0].clientUserId,'u');
      const b=await api.issueIndicatorInvitation('u');
      assert.notEqual(a.activationPath,b.activationPath);
      assert.equal(s.rows.indicatedInvitations.length,1,'novo convite invalida o anterior');
    }else{
      await assert.rejects(api.issueIndicatorInvitation('u'),/INVITE_FORBIDDEN/);
      assert.equal(s.rows.indicatedInvitations.length,0);
    }
  }
});
test('ativação de convite bloqueia quarto papel e reuso de token',async()=>{
  const token=newInvitationToken(),hash=invitationHash(token),now=new Date().toISOString();
  const schema={users:table('id','role','status','passwordHash'),indicatorProfiles:table('userId'),indicatedInvitations:table('tokenHash','clientUserId','usedAt'),authSessions:table('userId')};
  async function call(role){
    const s=memoryDb(schema,{users:[{id:'u',role,status:'active',passwordHash:null}],indicatorProfiles:[{userId:'u'}],indicatedInvitations:[{tokenHash:hash,clientUserId:'u',usedAt:null,expiresAt:new Date(Date.now()+60000).toISOString()}]});
    const {POST}=load('app/api/indicator/activate/route.ts',{
      'drizzle-orm':{...operators,gt:(field,val)=>row=>row[field]>val,isNull:col=>row=>row[col]==null},
      '@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/indicator-schema':{ensureIndicatorSchema:async()=>{}},
      '@/lib/indicated-security':{invitationHash,privateResponseHeaders:{}},'@/lib/passwords':{hashPassword:async()=> 'hash'}
    });
    const request=()=>new Request('https://test.example/api/indicator/activate',{method:'POST',body:JSON.stringify({token,password:'strong-password-123',confirm:'strong-password-123'})});
    const first=await POST(request());
    if(role==='indicator'){
      assert.equal(first.status,200);
      assert.equal(s.rows.users[0].passwordHash,'hash');
      assert.equal((await POST(request())).status,410);
    }else{assert.equal(first.status,403);assert.equal(s.rows.users[0].passwordHash,null);}
  }
  for(const role of ['admin','reseller','client_indicated','indicator'])await call(role);
});
test('3 funções centrais permanecem: Asaas provê acessos, BKO envia boas-vindas, campanha sem comprovante',()=>{
  const webhook=read('lib/billing-webhook.ts');
  const portal=read('app/painel/portal-client.tsx');
  const influencer=read('components/indicator-portal.tsx');
  const checkout=read('app/api/public/checkout/route.ts');
  assert.match(webhook,/provisionPaidPurchase\(result\.id\)/);
  assert.doesNotMatch(webhook,/\bsendWelcome\s*\(/);
  assert.match(portal,/Marcar boas-vindas enviadas/);
  assert.match(portal,/Abrir WhatsApp/);
  assert.match(influencer,/require|termos|terms/);
  assert.doesNotMatch(influencer,/não precisam de comprovantes|sem enviar comprovantes/i); // Texto removido a pedido; confirmação segue no webhook.
  assert.match(checkout,/asaas|Asaas/i);
});
