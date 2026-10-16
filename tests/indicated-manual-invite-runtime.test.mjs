import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load, memoryDb, operators, table } from './runtime-loader.mjs';
import { invitationHash, newInvitationToken } from '../lib/indicated-security.ts';

const schema={
 users:table('id','email','role','status','name','phone'),
 indicatedClients:table('id','clientUserId'),
 indicatedInvitations:table('tokenHash','clientUserId','expiresAt','usedAt'),
};
const orm={...operators,isNull:(col)=>(r)=>r[col]==null};
const user={id:'client-1',role:'client_indicated',status:'active',email:'indicado@example.test'};
const indication={id:'indication-1',clientUserId:'client-1'};
function sDb(u=user){return memoryDb(schema,{users:[u],indicatedClients:[indication],indicatedInvitations:[]})}
const invitationDeps=(s)=>({
 'drizzle-orm':orm,
 '@/db':{getDb:()=>s.db},
 '@/db/schema':schema,
 '@/lib/indicated-security':{invitationHash,newInvitationToken}
});

test('geração manual funciona sem Resend, token fica só em hash e vínculo é obrigatório', async()=>{
 const s=sDb();
 const {issueIndicatedInvitation}=load('lib/indicated-invitations.ts',invitationDeps(s));
 const first=await issueIndicatedInvitation(user.id);
 assert.match(first.activationPath,/^\/ativar-cliente\?token=[A-Za-z0-9_-]{43}$/);
 assert.equal(s.rows.indicatedInvitations.length,1);
 const token=new URL('https://app.test'+first.activationPath).searchParams.get('token');
 assert.equal(s.rows.indicatedInvitations[0].tokenHash,invitationHash(token));
 assert.ok(!JSON.stringify(s.rows).includes(token));
 assert.ok(Date.parse(first.expiresAt)>Date.now());
 const second=await issueIndicatedInvitation(user.id);
 assert.notEqual(second.activationPath,first.activationPath);
 assert.equal(s.rows.indicatedInvitations.length,1,'link anterior revogado');
 assert.notEqual(s.rows.indicatedInvitations[0].tokenHash,invitationHash(token));
});

test('não gera links para revendedor, admin, inativo ou usuário sem indicação',async()=>{
 for(const variant of [{role:'reseller'},{role:'admin'},{status:'inactive'}]){
  const s=sDb({...user,...variant});
  const {issueIndicatedInvitation}=load('lib/indicated-invitations.ts',invitationDeps(s));
  await assert.rejects(()=>issueIndicatedInvitation(user.id),/INVITE_FORBIDDEN/);
  assert.equal(s.rows.indicatedInvitations.length,0);
 }
 const s=sDb();s.rows.indicatedClients.length=0;
 const {issueIndicatedInvitation}=load('lib/indicated-invitations.ts',invitationDeps(s));
 await assert.rejects(()=>issueIndicatedInvitation(user.id),/INVITE_FORBIDDEN/);
});

test('API para gerar link só permite administrador autenticado e indicação válida',async()=>{
 const s=sDb();
 const create=load('lib/indicated-invitations.ts',invitationDeps(s)).issueIndicatedInvitation;
 const deps={...invitationDeps(s),
  '@/lib/auth':{requireAdmin:async()=>({id:'admin',role:'admin'})},
  '@/lib/indicated-schema':{ensureIndicatedSchema:async()=>{}},
  '@/lib/indicated-invitations':{issueIndicatedInvitation:create},
  '@/lib/indicated-security':{cleanText:(v)=>v||'',indicatedError:(e)=>Response.json({error:e.message},{status:e.message==='FORBIDDEN'?403:500}),privateResponseHeaders:{'cache-control':'private, no-store'}},
 };
 const {POST}=load('app/api/admin/indicated/invite/route.ts',deps);
 const invoke=(id)=>new Request('https://app.test/api/admin/indicated/invite',{method:'POST',body:JSON.stringify({id})});
 assert.equal((await POST(invoke('unknown'))).status,404);
 const r=await POST(invoke(indication.id));assert.equal(r.status,200);
 assert.match((await r.json()).activationPath,/token=/);
 assert.match(r.headers.get('cache-control'),/no-store/);
 const {POST:denied}=load('app/api/admin/indicated/invite/route.ts',{
  ...deps,'@/lib/auth':{requireAdmin:async()=>{throw Error('FORBIDDEN')}}
 });
 assert.equal((await denied(invoke(indication.id))).status,403);
 assert.equal(s.rows.indicatedInvitations.length,1,'acesso negado não gerou novo link');
});

test('scripts e endpoints de clientes indicados não dependem de Resend nem alteram provisionamento Asaas',()=>{
 const code=readFileSync(new URL('../lib/indicated-invitations.ts',import.meta.url),'utf8');
 assert.doesNotMatch(code,/resend\.com|RESEND_API_KEY|WELCOME_EMAIL_FROM/);
 const post=readFileSync(new URL('../app/api/admin/indicated/route.ts',import.meta.url),'utf8');
 assert.doesNotMatch(post,/RESEND_API_KEY|inviteSent|invitationReady/);
 const ps=readFileSync(new URL('../scripts/criar-cliente-indicado.ps1',import.meta.url),'utf8');
 assert.match(ps,/Get-Credential/);
 assert.match(ps,/api\/admin\/indicated/);
 assert.doesNotMatch(ps, /ASAAS_API_KEY|DATABASE_PASSWORD|RESEND_API_KEY/);
 const asaas=readFileSync(new URL('../app/api/billing/webhook/route.ts',import.meta.url),'utf8');
 assert.match(asaas,/provisionPaidPurchase/);
});
