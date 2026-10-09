import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from './runtime-loader.mjs';

// SQL boundary double keeps joined table identities; HMAC, cookies and all
// authentication/authorization decisions run in the shipped auth module.
function sessionState(role='reseller'){
 const table=(t,columns)=>Object.fromEntries(columns.map(c=>[c,{t,c}]));
 const schema={users:table('users',['id','email','name','phone','role','status','mustChangePassword']),authSessions:table('sessions',['tokenHash','userId','expiresAt'])};
 const users=[{id:'u1',email:'buyer@example.test',name:'Buyer',phone:'',role,status:'active',mustChangePassword:1}];let sessions=[];
 const value=(v,row)=>v&&typeof v==='object'&&v.t?row[v.t][v.c]:v;
 const orm={eq:(a,b)=>row=>value(a,row)===value(b,row),gt:(a,b)=>row=>value(a,row)>value(b,row),and:(...f)=>row=>f.every(fn=>fn(row))};
 const db={
  insert:()=>({values:async row=>{sessions.push({...row})}}),
  select:(fields)=>({from:()=>({innerJoin:(_table,on)=>({where:predicate=>({limit:async n=>sessions.flatMap(s=>users.map(u=>({sessions:s,users:u}))).filter(on).filter(predicate).slice(0,n).map(row=>Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,value(v,row)])))})})})}),
  delete:()=>({where:async fn=>{sessions=sessions.filter(s=>!fn({sessions:s}))}}),
 };
 const auth=load('lib/auth.ts',{'drizzle-orm':orm,'@/db':{getDb:()=>db},'@/db/schema':schema,'@/lib/env':{getOptionalEnv:key=>key==='AUTH_SECRET'?'test-only-auth-secret-with-more-than-32-chars':undefined}});
 const req=(cookie='')=>new Request('https://example.test',{headers:{cookie}});
 return {users,get sessions(){return sessions},auth,req,async open(){const cookie=await auth.createSession('u1',req());return {cookie,request:req(cookie.split(';')[0])}}};
}
test('sessão do revendedor usa cookie seguro e token armazenado somente como HMAC',async()=>{
 const s=sessionState();const {cookie,request}=await s.open();
 assert.match(cookie,/HttpOnly; SameSite=Lax/);assert.match(cookie,/; Secure/);
 const token=cookie.split(';')[0].split('=')[1];assert.notEqual(s.sessions[0].tokenHash,token);
 const user=await s.auth.requireSession(request);assert.equal(user.id,'u1');assert.equal(user.role,'reseller');assert.equal(user.mustChangePassword,true);
 await assert.rejects(s.auth.requireAdmin(request),/FORBIDDEN/);
});
test('sessão adulterada ou ausente não autentica',async()=>{
 const s=sessionState();await s.open();
 assert.equal(await s.auth.getSessionUser(s.req()),null);
 assert.equal(await s.auth.getSessionUser(s.req('mix10_session=altered')),null);
});
test('sessão expirada e usuário inativo perdem acesso',async()=>{
 const s=sessionState();const {request}=await s.open();
 s.sessions[0].expiresAt='2000-01-01T00:00:00.000Z';assert.equal(await s.auth.getSessionUser(request),null);
 s.sessions[0].expiresAt='2999-01-01T00:00:00.000Z';s.users[0].status='inactive';assert.equal(await s.auth.getSessionUser(request),null);
});
test('logout revoga sessão e prepara cookie expirado',async()=>{
 const s=sessionState();const {request}=await s.open();await s.auth.revokeSession(request);
 assert.equal(await s.auth.getSessionUser(request),null);assert.match(s.auth.clearSessionCookie(request),/Max-Age=0; Secure/);
});
test('BKO com role admin passa pela autorização de administrador',async()=>{
 const s=sessionState('admin');const {request}=await s.open();assert.equal((await s.auth.requireAdmin(request)).role,'admin');
});
