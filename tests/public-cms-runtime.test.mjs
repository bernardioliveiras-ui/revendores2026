import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from './runtime-loader.mjs';

function cms(user=null){
 const calls=[];
 const mocks={
  '@/lib/content-studio':{
   isStudioDocType:type=>['landing','manual','products','media'].includes(type),
   getStudioDoc:async type=>{calls.push(type);return {type,draft:{text:'PRIVATE_DRAFT'},published:{text:type==='manual'?'PRIVATE_MANUAL_TEXT':'PUBLIC_CONTENT'}}},
  },
  '@/lib/auth':{getSessionUser:async()=>user,requireAdmin:async()=>{if(!user)throw Error('UNAUTHORIZED');if(user.role!=='admin')throw Error('FORBIDDEN');return user}},
 };
 return {calls,publicGet:load('app/api/public/cms/[type]/route.ts',mocks).GET,adminGet:load('app/api/admin/cms/[type]/route.ts',mocks).GET};
}
const context=type=>({params:Promise.resolve({type})});
const request=(type,preview=false)=>new Request(`https://example.test/api/public/cms/${type}${preview?'?preview=draft':''}`);

for(const user of [null,{role:'reseller',id:'unpaid'},{role:'reseller',id:'buyer'},{role:'admin',id:'bko'}])test('JSON público do manual não expõe conteúdo para '+(user?.id||'anônimo'),async()=>{
 const s=cms(user);
 for(const preview of [false,true]){
  const r=await s.publicGet(request('manual',preview),context('manual'));assert.equal(r.status,410);
  assert.doesNotMatch(await r.text(),/PRIVATE_MANUAL_TEXT|PRIVATE_DRAFT/);assert.match(r.headers.get('cache-control'),/no-store/);
 }
 assert.deepEqual(s.calls,[]);
});
for(const type of ['products','media'])test(type+' continua público, rascunho apenas para admin',async()=>{
 for(const user of [null,{role:'reseller'},{role:'admin'}]){
  const s=cms(user);const r=await s.publicGet(request(type,true),context(type));assert.equal(r.status,200);
  assert.deepEqual(await r.json(),{content:{text:user?.role==='admin'?'PRIVATE_DRAFT':'PUBLIC_CONTENT'},mode:user?.role==='admin'?'draft':'published'});
 }
});
test('CMS admin mantém manual protegido e disponível para edição no BKO',async()=>{
 for(const [user,status] of [[null,401],[{role:'reseller'},403],[{role:'admin'},200]]){
  const s=cms(user);const r=await s.adminGet(request('manual'),context('manual'));assert.equal(r.status,status);
  if(status===200)assert.equal((await r.json()).draft.text,'PRIVATE_DRAFT');else assert.deepEqual(s.calls,[]);
 }
});
