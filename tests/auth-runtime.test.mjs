import test from 'node:test';
import assert from 'node:assert/strict';
import {load,memoryDb,operators,table} from './runtime-loader.mjs';

const schema={users:table('id','email'),authSessions:table('tokenHash','userId')};
const account={id:'u1',email:'buyer@example.test',role:'reseller',status:'active',passwordHash:'hash',mustChangePassword:1,failedLoginAttempts:0};
function login(){
 const s=memoryDb(schema,{users:[account]});let sessions=0;
 const auth=load('lib/auth.ts',{'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/env':{getOptionalEnv:()=>undefined}});
 const {POST}=load('app/api/auth/login/route.ts',{'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/auth':{...auth,createSession:async()=>{sessions++;return 'session=test'}},'@/lib/env':{getOptionalEnv:()=>undefined},'@/lib/passwords':{hashPassword:async()=> 'hash',verifyPassword:async(password)=>{await Promise.resolve();return password==='correct'}}});
 return {...s,POST,get sessions(){return sessions}};
}
const request=(payload)=>new Request('https://example.test/api/auth/login',{method:'POST',body:JSON.stringify(payload)});
test('cinco tentativas de login concorrentes bloqueiam tentativas seguintes',async()=>{
 const s=login();
 const responses=await Promise.all(Array.from({length:8},()=>s.POST(request({email:account.email,password:'wrong'}))));
 assert.equal(responses.filter(r=>r.status===401).length,5);
 assert.equal(responses.filter(r=>r.status===429).length,3);
 assert.ok(new Date(s.rows.users[0].lockedUntil).getTime()>Date.now());
 assert.equal(s.sessions,0);
 assert.equal((await s.POST(request({email:account.email,password:'correct'}))).status,429);
});
test('login válido limpa tentativas e informa a troca obrigatória da senha',async()=>{
 const s=login();s.rows.users[0].failedLoginAttempts=3;
 const r=await s.POST(request({email:account.email,password:'correct'}));
 assert.equal(r.status,200);assert.equal(s.sessions,1);assert.equal(s.rows.users[0].failedLoginAttempts,0);
 assert.equal((await r.json()).mustChangePassword,true);
});
test('bloqueio expirado permite autenticar novamente',async()=>{
 const s=login();s.rows.users[0].lockedUntil='2000-01-01T00:00:00.000Z';
 assert.equal((await s.POST(request({email:account.email,password:'correct'}))).status,200);assert.equal(s.rows.users[0].lockedUntil,null);
});
test('login BKO preserva papel admin e nunca autentica senha incorreta',async()=>{
 const s=login();s.rows.users[0].role='admin';
 assert.equal((await s.POST(request({email:account.email,password:'wrong'}))).status,401);assert.equal(s.sessions,0);
 const r=await s.POST(request({email:account.email,password:'correct'}));assert.equal(r.status,200);assert.equal((await r.json()).role,'admin');
});
test('JSON malformado de login recebe 400',async()=>{
 const s=login();assert.equal((await s.POST(new Request('https://example.test',{method:'POST',body:'{'}))).status,400);assert.equal(s.sessions,0);
});
for(const value of [null,[],{email:account.email},'bad'])test('payload inválido de login recebe 400 '+JSON.stringify(value),async()=>{
 const s=login();assert.equal((await s.POST(request(value))).status,400);assert.equal(s.sessions,0);
});
test('cookie de sessão com escape inválido é tratado como sessão ausente',async()=>{
 let dbTouched=false;
 const auth=load('lib/auth.ts',{'drizzle-orm':operators,'@/db':{getDb:()=>{dbTouched=true;throw Error('DB_OFFLINE')}},'@/db/schema':schema,'@/lib/env':{getOptionalEnv:()=>undefined}});
 const req=new Request('https://example.test',{headers:{cookie:'mix10_session=%E0%A4%A'}});
 assert.equal(await auth.getSessionUser(req),null);await auth.revokeSession(req);assert.equal(dbTouched,false);
});

test('troca obrigatória de senha grava scrypt e remove a flag apenas com confirmação válida',async()=>{
 const s=memoryDb(schema,{users:[account]});const passwords=load('lib/passwords.ts');
 const {POST}=load('app/api/auth/change-password/route.ts',{'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/auth':{requireSession:async()=>account},'@/lib/passwords':passwords});
 assert.equal((await POST(request({password:'nova senha segura',confirm:'diferente'}))).status,400);assert.equal(s.rows.users[0].mustChangePassword,1);
 assert.equal((await POST(request({password:'nova senha segura',confirm:'nova senha segura'}))).status,200);assert.equal(s.rows.users[0].mustChangePassword,0);
 assert.equal(await passwords.verifyPassword('nova senha segura',s.rows.users[0].passwordHash),true);
});
