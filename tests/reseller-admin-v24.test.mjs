import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resellerDeletionBlockers} from '../lib/reseller-delete-guards.mjs';
import {validateResellerEdit} from '../lib/reseller-edit-validation.mjs';
import {load,memoryDb,operators,table} from './runtime-loader.mjs';
const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const id='rev1',email='rev@test.com';
function harness({role='reseller',purchases=0,stock=0,admin=true,broken=false}={}){
 const calls=[];let committed=0,rolledBack=0;
 const conn={beginTransaction:async()=>{},commit:async()=>{committed++},rollback:async()=>{rolledBack++},release:()=>{},execute:async(sql)=>{
  calls.push(sql);
  if(broken&&sql.includes('DELETE FROM auth_sessions'))throw Error('FAIL SQL');
  if(sql.startsWith('SELECT id,email,role FROM users'))return [[{id,email,role}]];
  if(sql.startsWith('SELECT TABLE_NAME AS name'))return [["users","purchases","reseller_profiles","sales","stock_movements","affiliate_referrals","affiliate_cashbacks"].map(name=>({name}))];
  if(sql.startsWith('SELECT COUNT(*)'))return [[{n:sql.includes('purchases')?purchases:sql.includes('stock_movements')?stock:0}]];
  if(sql.startsWith('DELETE FROM users'))return [{affectedRows:1}];
  return [{affectedRows:1}];
 }};
 const helpers={
  'drizzle-orm':{...operators},'@/db':{getMysqlPool:()=>({getConnection:async()=>conn}),getDb:()=>null},'@/db/schema':{},
  '@/lib/auth':{normalizeEmail:v=>v.trim().toLowerCase(),isAdminEmail:()=>false,requireAdmin:async()=>{if(!admin)throw Error('FORBIDDEN');return {id:'admin'}}},
  '@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},
  '@/lib/reseller-delete-guards.mjs':{resellerDeletionBlockers},
  '@/lib/reseller-edit-validation.mjs':{validateResellerEdit},
  '@/lib/indicator-security':{cleanText:v=>typeof v==='string'?v.trim():'',indicatedError:e=>Response.json({error:e.message},{status:e.message==='FORBIDDEN'?403:500}),privateResponseHeaders:{'cache-control':'no-store'}}
 };
 const {DELETE}=load('app/api/admin/resellers/route.ts',helpers);
 const req=(payload={userId:id,email,confirm:'EXCLUIR'},origin='https://bko.test')=>new Request('https://bko.test/api/admin/resellers',{method:'DELETE',headers:{origin,host:'bko.test'},body:JSON.stringify(payload)});
 return {DELETE,req,calls,get committed(){return committed},get rolledBack(){return rolledBack}};
}
test('BKO possui novos botões de gerenciar revendedores e mantém nova senha',()=>{
 const ui=file('app/painel/portal-client.tsx');
 for(const text of ['Gerenciar revendedores','Limpar revendedores sem movimento','Excluir cadastro de teste','Reativar','Desativar','Gerar nova senha'])assert.ok(ui.includes(text));
 assert.ok(ui.includes('api/admin/resellers'));
});
test('API barra sem origem válida e sem confirmação literal',async()=>{
 const s=harness();assert.equal((await s.DELETE(s.req({},'https://outsider.test'))).status,403);
 assert.equal((await s.DELETE(s.req({userId:id,email,confirm:'APAGAR'}))).status,400);
 assert.equal(s.calls.length,0);
});
test('somente revendedor vazio, nunca ADMIN ou conta com pedido/estoque',async()=>{
 const a=harness({role:'admin'});assert.equal((await a.DELETE(a.req())).status,404);assert.equal(a.committed,0);
 const b=harness({purchases:1});assert.equal((await b.DELETE(b.req())).status,409);assert.equal(b.committed,0);assert.equal(b.rolledBack,1);
 const c=harness({stock:1});assert.equal((await c.DELETE(c.req())).status,409);assert.equal(c.committed,0);
});
test('exclusão vazia commit; falha SQL rollback',async()=>{
 const a=harness();assert.equal((await a.DELETE(a.req())).status,200);assert.equal(a.committed,1);
 assert.deepEqual(a.calls.filter(c=>c.startsWith('DELETE FROM')),["DELETE FROM auth_sessions WHERE user_id=?","DELETE FROM users WHERE id=? AND role='reseller' AND email=?"]);
 const b=harness({broken:true});assert.equal((await b.DELETE(b.req())).status,500);assert.equal(b.committed,0);assert.equal(b.rolledBack,1);
});
test('classificação de bloqueios nunca decide com base em status active',()=>{
 assert.deepEqual(resellerDeletionBlockers(),[]);
 assert.deepEqual(resellerDeletionBlockers({stock:1,profiles:1}),['perfil de compra inicial','movimentações de estoque']);
});
