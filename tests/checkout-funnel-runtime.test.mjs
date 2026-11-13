import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from './runtime-loader.mjs';

test('influenciador consulta somente sua campanha e aceita termos antes de ler',async()=>{
 let owner,terms;
 const {GET}=load('app/api/indicator/funnel/route.ts',{
  '@/lib/auth':{requireIndicator:async()=>({id:'owner-1'})},
  '@/lib/indicator-terms-store':{requireIndicatorTerms:async id=>{terms=id}},
  '@/lib/indicator-security':{privateResponseHeaders:{'cache-control':'no-store'},indicatedError:()=>new Response(null,{status:403})},
  '@/lib/checkout-activity':{readCheckoutFunnel:async id=>{owner=id;return []}},
 });
 const response=await GET(new Request('https://example.test?ownerId=other'));
 assert.equal(response.status,200);
 assert.equal(owner,'owner-1');assert.equal(terms,'owner-1');
});
test('atividade rejeita origem externa e não consulta campanha',async()=>{
 let called=false;
 const {POST}=load('app/api/public/checkout-activity/route.ts',{
  '@/db':{getMysqlPool:()=>{throw Error('unexpected database access')}},
  '@/lib/campaigns':{resolveCampaign:async()=>{called=true}},
  '@/lib/checkout-activity':{ensureCheckoutActivity:async()=>{}},
 });
 const response=await POST(new Request('https://example.test',{method:'POST',headers:{origin:'https://other.test'},body:'{}'}));
 assert.equal(response.status,403);assert.equal(called,false);
});
test('registra visita sem contato e parametriza os dados da campanha',async()=>{
 let saved;
 const {POST}=load('app/api/public/checkout-activity/route.ts',{
  '@/db':{getMysqlPool:()=>({execute:async(sql,params)=>{saved={sql,params}}})},
  '@/lib/campaigns':{resolveCampaign:async()=>({id:'campaign-1'})},
  '@/lib/checkout-activity':{ensureCheckoutActivity:async()=>{}},
 });
 const response=await POST(new Request('https://example.test',{method:'POST',headers:{origin:'https://example.test'},body:JSON.stringify({id:crypto.randomUUID(),code:'a'.repeat(32),event:'visit',phone:'11999999999'})}));
 assert.equal(response.status,200);
 assert.equal(saved.params[1],'campaign-1');
 assert.equal(saved.params[3],'');
 assert.equal(saved.params[4],null);
 assert.match(saved.sql,/ON DUPLICATE KEY UPDATE/);
});
