import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load, memoryDb, operators, table } from './runtime-loader.mjs';
import { indicatorProofTotals } from '../lib/indicator-accounting.ts';
import { invitationHash, newInvitationToken, mayMarkBought, safeReceiptMime } from '../lib/indicated-security.ts';

const schema={
 users:table('id','email','role','status','name','phone'),
 authSessions:table('userId'),indicatedInvitations:table('tokenHash','clientUserId','usedAt','expiresAt'),
 indicatedClients:table('id','clientUserId','receiptId'),indicatorProfiles:table('userId'),
 indicatorLeads:table('id','indicatorUserId','publicCode','receiptId','receiptReview','status'),
};
const admin={id:'adm',role:'admin'},isabella={id:'isa',role:'indicator'},other={id:'other',role:'indicator'};
const now=new Date().toISOString();
const lead=(id,indicatorUserId='isa')=>({id,indicatorUserId,publicCode:'code-1',name:'Comprador',phone:'11999999999',status:'ENTROU NO LINK',receiptId:null,receiptReview:'PENDENTE',verificationNotes:'',cashbackStatus:'PENDENTE',cashbackCents:null,createdAt:now,updatedAt:now});
const l1='11111111-1111-4111-8111-111111111111',l2='22222222-2222-4222-8222-222222222222';
const sql=(strings,...params)=>({sql:strings.join('?'),params});
const dep=(s,user)=>({
 'drizzle-orm':{...operators,sql},'@/db':{getDb:()=>s.db,getMysqlPool:()=>({execute:async()=>[[]]})},'@/db/schema':schema,
 '@/lib/auth':{requireSession:async()=>user,requireAdmin:async()=>{if(user.role!=='admin')throw Error('FORBIDDEN');return user},requireIndicator:async()=>{if(user.role!=='indicator')throw Error('FORBIDDEN');return user}},
 '@/lib/indicator-schema':{ensureIndicatorSchema:async()=>{}},
 '@/lib/indicator-security':{cleanText:(v,n=120)=>typeof v==='string'?v.trim().slice(0,n):'',cleanPhone:v=>typeof v==='string'?v.replace(/\D/g,''):null,indicatedError:e=>Response.json({error:e.message},{status:e.message==='FORBIDDEN'?403:500}),privateResponseHeaders:{'cache-control':'no-store'},INDICATOR_STATUSES:['LINK GERADO','ENTROU NO LINK','ESPERANDO NO CARRINHO','COMPROU'],INDICATOR_CASHBACK_STATUSES:['PENDENTE','LIBERADO','PAGO'],indicatorLink:code=>'/i/'+code},
 '@/lib/indicated-security':{MAX_RECEIPT_BYTES:8*1024*1024,safeReceiptMime,mayMarkBought,RECEIPT_REVIEWS:['PENDENTE','APROVADO','REJEITADO'],validChoice:(v,a)=>a.includes(v)},
});

const makeProof=(id,mime='application/pdf',bytes=Buffer.from('%PDF-1.7\n1 0 obj'))=>{
 const data=new FormData();data.append('id',id);data.append('file',new File([bytes],'proof.pdf',{type:mime}));
 return new Request('https://app.test/api/indicator/receipt',{method:'POST',body:data});
};
const reviewReq=(body)=>new Request('https://app.test/api/admin/indicators/leads',{method:'PATCH',body:JSON.stringify(body)});

test('indicadores têm contagem por indicação aprovada, não por upload ou clique',()=>{
 assert.deepEqual(indicatorProofTotals([
  {receiptId:null,receiptReview:'PENDENTE',status:'ENTROU NO LINK'},
  {receiptId:'proof1',receiptReview:'PENDENTE',status:'ENTROU NO LINK'},
  {receiptId:'proof2',receiptReview:'APROVADO',status:'COMPROU'},
  {receiptId:'proof3',receiptReview:'REJEITADO',status:'ESPERANDO NO CARRINHO'},
  {receiptId:'proof4',receiptReview:'APROVADO',status:'ESPERANDO NO CARRINHO'},
 ]),{submitted:4,pending:1,approved:1,rejected:1});
});

test('upload do indicador é privado, pendente e isolado por titular; COMPROU não é automático',async()=>{
 const s=memoryDb(schema,{indicatorLeads:[lead(l1),lead(l2,'other')]});
 let inserted=0;s.db.execute=async q=>{assert.match(q.sql,/INSERT INTO indicator_receipts/);inserted++;return [{affectedRows:1}]};
 const {POST}=load('app/api/indicator/receipt/route.ts',dep(s,isabella));
 const r=await POST(makeProof(l1));assert.equal(r.status,200);assert.equal(inserted,1);
 assert.equal(s.rows.indicatorLeads[0].receiptReview,'PENDENTE');
 assert.equal(s.rows.indicatorLeads[0].status,'ENTROU NO LINK');
 assert.ok(s.rows.indicatorLeads[0].receiptId);
 assert.equal((await POST(makeProof(l2))).status,404);assert.equal(inserted,1,'não gravou comprovante alheio');
 const invalid=await POST(makeProof(l1,'application/pdf',Buffer.from('<script>')));assert.equal(invalid.status,400);
 const denied=load('app/api/indicator/receipt/route.ts',dep(s,{id:'r',role:'reseller'}));assert.equal((await denied.POST(makeProof(l1))).status,403);
});

test('BKO é o único que aprova, COMPROU exige prova aprovada, rejeição exige motivo',async()=>{
 const s=memoryDb(schema,{indicatorProfiles:[{userId:'isa'}],indicatorLeads:[lead(l1)]});
 const {PATCH}=load('app/api/admin/indicators/leads/route.ts',dep(s,admin));
 assert.equal((await PATCH(reviewReq({id:l1,status:'COMPROU'}))).status,409);
 s.rows.indicatorLeads[0].receiptId='proof';
 assert.equal((await PATCH(reviewReq({id:l1,status:'COMPROU'}))).status,409);
 assert.equal((await PATCH(reviewReq({id:l1,receiptReview:'APROVADO'}))).status,200);
 assert.equal(s.rows.indicatorLeads[0].status,'ENTROU NO LINK');
 assert.equal((await PATCH(reviewReq({id:l1,status:'COMPROU'}))).status,200);
 assert.equal(indicatorProofTotals(s.rows.indicatorLeads).approved,1);
 assert.equal((await PATCH(reviewReq({id:l1,receiptReview:'REJEITADO'}))).status,400);
 assert.equal((await PATCH(reviewReq({id:l1,receiptReview:'REJEITADO',verificationNotes:'Reenvie',status:'ESPERANDO NO CARRINHO'}))).status,200);
 assert.equal(indicatorProofTotals(s.rows.indicatorLeads).approved,0);
 const forbidden=load('app/api/admin/indicators/leads/route.ts',dep(s,isabella));assert.equal((await forbidden.PATCH(reviewReq({id:l1,status:'COMPROU'}))).status,403);
});

test('download de comprovante só funciona para dona da indicação ou BKO',async()=>{
 const s=memoryDb(schema,{indicatorLeads:[{...lead(l1),receiptId:'proof1'}]});
 let reads=0;
 const custom=(user)=>({...dep(s,user),'@/db':{getDb:()=>s.db,getMysqlPool:()=>({execute:async()=>{reads++;return [[{mime_type:'application/pdf',bytes:Buffer.from('%PDF-1.7')}]]}})}});
 const url=`https://app.test/api/indicator/receipt?id=${l1}`;
 assert.equal((await load('app/api/indicator/receipt/route.ts',custom(other)).GET(new Request(url))).status,404);
 assert.equal(reads,0);
 const own=await load('app/api/indicator/receipt/route.ts',custom(isabella)).GET(new Request(url));assert.equal(own.status,200);
 assert.match(own.headers.get('content-disposition'),/attachment/);
 assert.equal((await load('app/api/indicator/receipt/route.ts',custom(admin)).GET(new Request(url))).status,200);
 assert.equal(reads,2);
});

test('links de ativação de indicador herdam token de uso único, sem promover revendedor',async()=>{
 const s=memoryDb(schema,{users:[{id:'isa',role:'indicator',status:'active'}],indicatorProfiles:[{userId:'isa'}]});
 const mod=load('lib/indicated-invitations.ts',{
  'drizzle-orm':{...operators,isNull:col=>row=>row[col]==null},'@/db':{getDb:()=>s.db},'@/db/schema':schema,
  '@/lib/indicator-schema':{ensureIndicatorSchema:async()=>{}},'@/lib/indicated-security':{invitationHash,newInvitationToken}
 });
 const inv=await mod.issueIndicatedInvitation('isa');assert.match(inv.activationPath,/^\/ativar-cliente\?token=/);
 const token=new URL('https://a.test'+inv.activationPath).searchParams.get('token');
 assert.equal(s.rows.indicatedInvitations[0].tokenHash,invitationHash(token));
 s.rows.users[0].role='reseller';await assert.rejects(()=>mod.issueIndicatedInvitation('isa'),/INVITE_FORBIDDEN/);
});

test('conversão explícita de cliente antigo sem comprovante preserva histórico, nunca revendedor',async()=>{
 const user={id:'isa',name:'Isabella',email:'isabella@test.com',role:'client_indicated',status:'active'};
 const s=memoryDb(schema,{users:[user],indicatedClients:[{id:'old',clientUserId:'isa',receiptId:null}],authSessions:[{userId:'isa'}],indicatedInvitations:[{clientUserId:'isa',tokenHash:'foo'}]});
 const mod=load('app/api/admin/indicators/route.ts',{
  ...dep(s,admin),
  '@/lib/auth':{requireAdmin:async()=>admin,normalizeEmail:v=>v,isAdminEmail:()=>false},
  '@/lib/indicator-accounting':{indicatorProofTotals},
  '@/lib/indicated-invitations':{issueIndicatedInvitation:async()=>({activationPath:'/ativar-cliente?token=foo',expiresAt:now})},
 });
 const args=(email)=>new Request('https://app.test/api/admin/indicators',{method:'POST',body:JSON.stringify({name:'Isabella',email,phone:'11999999999',convertExisting:'on'})});
 assert.equal((await mod.POST(args('isabella@test.com'))).status,201);
 assert.equal(s.rows.users[0].role,'indicator');assert.equal(s.rows.indicatedClients.length,1,'arquivo histórico preservado');
 assert.equal(s.rows.indicatorProfiles.length,1);assert.equal(s.rows.authSessions.length,0);
 s.rows.users[0].role='reseller';
 assert.equal((await mod.POST(args('isabella@test.com'))).status,409);
 assert.equal(s.rows.users[0].role,'reseller','perfil revendedor nunca é convertido');
});

test('setor de indicadores não usa vendas, estoque ou Asaas',()=>{
 const api=readFileSync(new URL('../app/api/admin/indicators/leads/route.ts',import.meta.url),'utf8');
 const indicator=readFileSync(new URL('../app/api/indicator/receipt/route.ts',import.meta.url),'utf8');
 const redirect=readFileSync(new URL('../app/i/[code]/route.ts',import.meta.url),'utf8');
 for(const text of [api,indicator,redirect])assert.doesNotMatch(text,/ASAAS_API_KEY|provisionPaidPurchase|stockMovements|affiliateCashbacks|from\s+['"]@\/lib\/asaas/);
 assert.match(redirect,/https:|INDICATOR_PURCHASE_URL/);
});
