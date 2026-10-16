import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load, memoryDb, operators, table } from './runtime-loader.mjs';
import { cleanPhone, safeReceiptMime, clientOwnsIndication, mayMarkBought, invitationHash, newInvitationToken } from '../lib/indicated-security.ts';
const schema={users:table('id','email','role','status','name','phone'),authSessions:table('userId'),indicatedClients:table('id','clientUserId','receiptId','status','receiptReview'),indicatedInvitations:table('tokenHash','clientUserId','expiresAt','usedAt')};
const now=new Date().toISOString();
const row={id:'11111111-1111-4111-8111-111111111111',clientUserId:'u1',name:'Cliente Um',phone:'11988887777',channel:'Link',responsible:'BKO',status:'ENTROU NO LINK',receiptId:null,receiptReview:'PENDENTE',receiptGuidance:'',cashbackStatus:'PENDENTE',cashbackCents:null,createdAt:now,updatedAt:now};
const admin={id:'a',role:'admin'};const client={id:'u1',role:'client_indicated'};
const deps=(s,user)=>({
 'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,
 '@/lib/auth':{requireAdmin:async()=>{if(user.role!=='admin')throw Error('FORBIDDEN');return user},requireIndicatedClient:async()=>{if(user.role!=='client_indicated')throw Error('FORBIDDEN');return user}},
 '@/lib/indicated-schema':{ensureIndicatedSchema:async()=>{}},
 '@/lib/indicated-security':{cleanPhone,cleanText:(v,max=120)=>typeof v==='string'?v.trim().slice(0,max):'',INDICATED_STATUSES:['ENTROU NO LINK','ESPERANDO NO CARRINHO','COMPROU'],RECEIPT_REVIEWS:['PENDENTE','APROVADO','REJEITADO'],MANUAL_CASHBACK_STATUSES:['PENDENTE','LIBERADO','PAGO'],clientOwnsIndication,MAX_RECEIPT_BYTES:8*1024*1024,safeReceiptMime,validChoice:(v,a)=>a.includes(v),mayMarkBought,indicatedError:(e)=>Response.json({error:e.message},{status:e.message==='FORBIDDEN'?403:500}),privateResponseHeaders:{'cache-control':'no-store'},PURCHASE_URL:'https://mix10pro.com.br/lp-v2'},
});
const req=(data)=>new Request('https://app.test/api/admin/indicated',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(data)});

test('cliente indicado nunca herda papel revendedor ou BKO ao criar acesso',async()=>{
 const s=memoryDb(schema,{users:[],indicatedClients:[]});
 const mod=load('app/api/admin/indicated/route.ts',{
  ...deps(s,admin),'@/lib/auth':{requireAdmin:async()=>admin,normalizeEmail:v=>v?.toLowerCase()||null,isAdminEmail:()=>false},
  '@/lib/indicated-invitations':{issueIndicatedInvitation:async()=>({activationPath:'/ativar-cliente?token=test-token',expiresAt:now})}
 });
 const r=await mod.POST(new Request('https://app.test/api/admin/indicated',{method:'POST',body:JSON.stringify({name:'Maria',email:'maria@test.com',phone:'11988887777',channel:'LP',responsible:'Atendimento'})}));
 assert.equal(r.status,201);const body=await r.json();assert.match(body.activationPath,/^\/ativar-cliente\?token=/);assert.equal(s.rows.users.length,1);assert.equal(s.rows.users[0].role,'client_indicated');
 assert.equal(s.rows.users[0].passwordHash,null);assert.equal(s.rows.indicatedClients[0].clientUserId,s.rows.users[0].id);
});
test('BKO não pode marcar COMPROU sem conferência aprovada, nem sem comprovante',async()=>{
 const s=memoryDb(schema,{users:[{id:'u1',role:'client_indicated'}],indicatedClients:[structuredClone(row)]});
 const {PATCH}=load('app/api/admin/indicated/route.ts', {...deps(s,admin),'@/lib/indicated-invitations':{issueIndicatedInvitation:async()=>({activationPath:'/ativar-cliente?token=test-token',expiresAt:now})},'@/lib/auth':{requireAdmin:async()=>admin}});
 assert.equal((await PATCH(req({id:row.id,status:'COMPROU'}))).status,409);
 s.rows.indicatedClients[0].receiptId='file-1';
 assert.equal((await PATCH(req({id:row.id,status:'COMPROU'}))).status,409);
 assert.equal((await PATCH(req({id:row.id,receiptReview:'APROVADO'}))).status,200);
 assert.equal(s.rows.indicatedClients[0].status,'ENTROU NO LINK');
 assert.equal((await PATCH(req({id:row.id,status:'COMPROU'}))).status,200);
 assert.equal(s.rows.indicatedClients[0].status,'COMPROU');
 assert.equal((await PATCH(req({id:row.id,receiptReview:'REJEITADO',receiptGuidance:'Reenvie'}))).status,409);
 assert.equal((await PATCH(req({id:row.id,receiptReview:'REJEITADO',receiptGuidance:'Reenvie',status:'ESPERANDO NO CARRINHO'}))).status,200);
 assert.equal(s.rows.indicatedClients[0].status,'ESPERANDO NO CARRINHO');
});
test('rejeição exige orientação; acesso desativado revoga sessões e convites',async()=>{
 const s=memoryDb(schema,{users:[{id:'u1',role:'client_indicated',status:'active'}],indicatedClients:[{...row,receiptId:'file-1'}],authSessions:[{userId:'u1'}],indicatedInvitations:[{clientUserId:'u1',tokenHash:'token'}]});
 const {PATCH}=load('app/api/admin/indicated/route.ts',{...deps(s,admin),'@/lib/auth':{requireAdmin:async()=>admin},'@/lib/indicated-invitations':{issueIndicatedInvitation:async()=>({activationPath:'/ativar-cliente?token=test-token',expiresAt:now})}});
 assert.equal((await PATCH(req({id:row.id,receiptReview:'REJEITADO'}))).status,400);
 assert.equal((await PATCH(req({id:row.id,active:false}))).status,200);
 assert.equal(s.rows.users[0].status,'inactive');assert.equal(s.rows.authSessions.length,0);assert.equal(s.rows.indicatedInvitations.length,0);
});
test('cliente só consulta e atualiza a própria indicação',async()=>{
 const s=memoryDb(schema,{indicatedClients:[structuredClone(row),{...row,id:'22222222-2222-4222-8222-222222222222',clientUserId:'u2',name:'Cliente Dois'}]});
 const mod=load('app/api/indicated/me/route.ts',deps(s,client));
 const r=await mod.GET(new Request('https://app.test/api/indicated/me'));
 assert.equal(r.status,200);const body=await r.json();assert.equal(body.indication.name,'Cliente Um');assert.equal(body.indication.email,undefined);
 const u=await mod.PATCH(new Request('https://app.test/api/indicated/me',{method:'PATCH',body:JSON.stringify({name:'Alterado',phone:'11988887777',status:'COMPROU',clientUserId:'u2'})}));
 assert.equal(u.status,200);assert.equal(s.rows.indicatedClients[0].name,'Alterado');assert.equal(s.rows.indicatedClients[1].name,'Cliente Dois');assert.equal(s.rows.indicatedClients[0].status,'ENTROU NO LINK');
 const rejected=load('app/api/indicated/me/route.ts',deps(s,{id:'r',role:'reseller'}));
 assert.equal((await rejected.GET(new Request('https://app.test/api/indicated/me'))).status,403);
});
test('arquivos são privados, PDFs e imagens por assinatura binária, sem acesso cruzado',async()=>{
 assert.equal(safeReceiptMime(Buffer.from('%PDF-1.7\n')),'application/pdf');
 assert.equal(safeReceiptMime(Buffer.from([0xff,0xd8,0xff,0xe0])),'image/jpeg');
 assert.equal(safeReceiptMime(Buffer.from([137,80,78,71,13,10,26,10])),'image/png');
 assert.equal(safeReceiptMime(Buffer.from('<script>not pdf</script>')),null);
 assert.equal(clientOwnsIndication('client_indicated','u2','u1'),false);
 assert.equal(clientOwnsIndication('reseller','u1','u1'),false);
 assert.equal(mayMarkBought('PENDENTE',true),false);
 const s=memoryDb(schema,{indicatedClients:[{...row,receiptId:'proof-1'}]});let downloaded=false;
 const {GET}=load('app/api/indicated/receipt/route.ts',{...deps(s,client),'@/lib/auth':{requireSession:async()=>client,requireIndicatedClient:async()=>client},'@/db':{getDb:()=>s.db,getMysqlPool:()=>({execute:async()=>{downloaded=true;return [[{mime_type:'application/pdf',bytes:Buffer.from('%PDF-1.4')}]]}})}});
 const r=await GET(new Request(`https://app.test/api/indicated/receipt?id=${row.id}`));
 assert.equal(r.status,200);assert.match(r.headers.get('content-disposition'),/attachment/);assert.equal(downloaded,true);
 const {GET:denied}=load('app/api/indicated/receipt/route.ts',{...deps(s,{id:'u2',role:'client_indicated'}),'@/lib/auth':{requireSession:async()=>({id:'u2',role:'client_indicated'})},'@/db':{getDb:()=>s.db,getMysqlPool:()=>({execute:async()=>{throw Error('LEAK')}})}});
 assert.equal((await denied(new Request(`https://app.test/api/indicated/receipt?id=${row.id}`))).status,404);
});
test('tokens de ativação são fortes, únicos e armazenados apenas como hash',()=>{
 const a=newInvitationToken(),b=newInvitationToken();assert.equal(a.length,43);assert.notEqual(a,b);assert.equal(invitationHash(a).length,64);assert.notEqual(invitationHash(a),a);
});
test('nova estrutura do MySQL é aditiva e separada dos perfis de revendedores',()=>{
 const ddl=readFileSync(new URL('../database/schema.sql',import.meta.url),'utf8');
 for (const name of ['indicated_clients','indicated_invitations','indicated_receipts']) assert.match(ddl,new RegExp('CREATE TABLE IF NOT EXISTS `'+name+'`'));
 assert.match(ddl,/`bytes` longblob NOT NULL/);
 const asaas=readFileSync(new URL('../app/api/billing/webhook/route.ts',import.meta.url),'utf8');assert.match(asaas,/provisionPaidPurchase/);
});

test('upload pelo cliente salva arquivo privado com conferência PENDENTE e não marca COMPROU',async()=>{
 const s=memoryDb(schema,{indicatedClients:[structuredClone(row)]});
 let fileRecord=null;
 s.db.execute=async query=>{fileRecord=query;return [{affectedRows:1}]};
 const sql=(strings,...params)=>({sql:strings.join('?'),params});
 const mod=load('app/api/indicated/receipt/route.ts', {...deps(s,client),'drizzle-orm':{...operators,sql},'@/lib/auth':{requireIndicatedClient:async()=>client,requireSession:async()=>client},'@/db':{getDb:()=>s.db,getMysqlPool:()=>({})}});
 const data=new FormData();data.append('file',new File([Buffer.from('%PDF-1.7\n1 0 obj')],'comprovante.pdf',{type:'application/pdf'}));
 const r=await mod.POST(new Request('https://app.test/api/indicated/receipt',{method:'POST',body:data}));
 assert.equal(r.status,200);assert.ok(fileRecord);assert.match(fileRecord.sql,/INSERT INTO indicated_receipts/);
 assert.equal(s.rows.indicatedClients[0].receiptReview,'PENDENTE');assert.notEqual(s.rows.indicatedClients[0].receiptId,null);
 assert.equal(s.rows.indicatedClients[0].status,'ENTROU NO LINK');
 const bad=new FormData();bad.append('file',new File([Buffer.from('<script>alert(1)</script>')],'comprovante.pdf',{type:'application/pdf'}));
 assert.equal((await mod.POST(new Request('https://app.test/api/indicated/receipt',{method:'POST',body:bad}))).status,400);
 const other=load('app/api/indicated/receipt/route.ts', {...deps(s,{id:'u2',role:'client_indicated'}),'drizzle-orm':{...operators,sql},'@/lib/auth':{requireIndicatedClient:async()=>({id:'u2',role:'client_indicated'})},'@/db':{getDb:()=>s.db,getMysqlPool:()=>({})}});
 assert.equal((await other.POST(new Request('https://app.test/api/indicated/receipt',{method:'POST',body:data}))).status,404);
});

test('ativação do convite só aceita token válido de cliente indicado, ainda não utilizado',async()=>{
 const token=newInvitationToken(),hash=invitationHash(token);
 const s=memoryDb(schema,{users:[{id:'u1',role:'client_indicated',status:'active',passwordHash:null,mustChangePassword:0}],indicatedClients:[structuredClone(row)],indicatedInvitations:[{tokenHash:hash,clientUserId:'u1',usedAt:null,expiresAt:new Date(Date.now()+3600_000).toISOString()}],authSessions:[{userId:'u1'}]});
 const ops={...operators,gt:(column,value)=>(r)=>r[column]>value,isNull:column=>(r)=>r[column]===null};
 const mod=load('app/api/indicated/activate/route.ts',{'drizzle-orm':ops,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/indicated-schema':{ensureIndicatedSchema:async()=>{}},'@/lib/indicated-security':{invitationHash,privateResponseHeaders:{}},'@/lib/passwords':{hashPassword:async()=> 'secure-hash'}});
 const request=()=>new Request('https://app.test/api/indicated/activate',{method:'POST',body:JSON.stringify({token,password:'valid-strong-password',confirm:'valid-strong-password'})});
 assert.equal((await mod.POST(request())).status,200);assert.equal(s.rows.users[0].passwordHash,'secure-hash');assert.equal(s.rows.authSessions.length,0);
 assert.equal((await mod.POST(request())).status,410);
 const reseller=memoryDb(schema,{users:[{id:'u1',role:'reseller',status:'active',passwordHash:null}],indicatedClients:[structuredClone(row)],indicatedInvitations:[{tokenHash:hash,clientUserId:'u1',usedAt:null,expiresAt:new Date(Date.now()+3600_000).toISOString()}]});
 const denied=load('app/api/indicated/activate/route.ts',{'drizzle-orm':ops,'@/db':{getDb:()=>reseller.db},'@/db/schema':schema,'@/lib/indicated-schema':{ensureIndicatedSchema:async()=>{}},'@/lib/indicated-security':{invitationHash,privateResponseHeaders:{}},'@/lib/passwords':{hashPassword:async()=> 'secure-hash'}});
 assert.equal((await denied.POST(request())).status,403);
});
