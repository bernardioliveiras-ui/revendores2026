import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load} from './runtime-loader.mjs';
import {indicatorDeletionBlockers} from '../lib/indicator-admin-delete-guards.mjs';

const files={
 'app/api/admin/indicators/route.ts':readFileSync(new URL('../app/api/admin/indicators/route.ts',import.meta.url),'utf8'),
 'components/indicator-admin.tsx':readFileSync(new URL('../components/indicator-admin.tsx',import.meta.url),'utf8'),
};
const original=(name)=>files[name];
const makeRequest=(body,origin='https://bko.example')=>new Request('https://bko.example/api/admin/indicators',{method:'DELETE',headers:{origin,host:'bko.example'},body:JSON.stringify(body)});
const userId='11111111-1111-4111-8111-111111111111';
const email='teste@example.com';
const tables=['users','indicator_profiles','purchases','indicator_campaigns','indicator_leads','indicator_receipts','indicated_clients','indicated_receipts','affiliate_referrals','affiliate_cashbacks','reseller_profiles','sales','stock_movements','auth_sessions','indicated_invitations','indicator_terms_acceptances'];
function harness({purchases=0,finance=0,role='indicator',admin=true,broken=false}={}){
 const trace=[];let committed=0,rolledBack=0,released=0;
 const conn={
  beginTransaction:async()=>{trace.push('begin')},
  commit:async()=>{committed++;trace.push('commit')},
  rollback:async()=>{rolledBack++;trace.push('rollback')},
  release:()=>{released++},
  execute:async(sql,args)=>{
   trace.push(sql);
   if(broken&&sql.startsWith('DELETE FROM indicator_leads'))throw Error('SQL_FAIL');
   if(sql.startsWith('SELECT id,email,role FROM users'))return [[{id:userId,email,role}]];
   if(sql.startsWith('SELECT user_id FROM indicator_profiles'))return [[{user_id:userId}]];
   if(sql.startsWith('SELECT COUNT(*) AS n FROM purchases'))return [[{n:purchases}]];
   if(sql.startsWith('SELECT TABLE_NAME AS name'))return [tables.map(name=>({name}))];
   if(sql.startsWith('SELECT COUNT(*) AS n'))return [[{n:sql.includes('affiliate_cashbacks')?finance:0}]];
   if(sql.startsWith('DELETE FROM users'))return [{affectedRows:1}];
   return [{affectedRows:1}];
  },
 };
 const mocks={
  'drizzle-orm':{},'@/db':{getMysqlPool:()=>({getConnection:async()=>conn})},
  '@/lib/asaas':{},'@/lib/indicator-terms-store':{ensureIndicatorTermsSchema:async()=>{}},
  '@/lib/indicator-terms':{},'@/db/schema':{},
  '@/lib/auth':{normalizeEmail:v=>v?.trim().toLowerCase()||null,requireAdmin:async()=>{if(!admin)throw Error('FORBIDDEN');return {id:'admin'}},isAdminEmail:()=>false},
  '@/lib/indicator-schema':{ensureIndicatorSchema:async()=>{}},
  '@/lib/indicated-schema':{ensureIndicatedSchema:async()=>{}},
  '@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},
  '@/lib/indicator-admin-delete-guards.mjs':{indicatorDeletionBlockers},
  '@/lib/indicator-invitations':{},'@/lib/indicator-accounting':{},
  '@/lib/indicator-security':{cleanText:(v,n=120)=>typeof v==='string'?v.trim().slice(0,n):'',indicatedError:e=>Response.json({error:e.message},{status:e.message==='FORBIDDEN'?403:500}),privateResponseHeaders:{'cache-control':'no-store'}},
 };
 return {DELETE:load('app/api/admin/indicators/route.ts',mocks).DELETE,trace,get committed(){return committed},get rolledBack(){return rolledBack},get released(){return released}};
}
test('ações de ativar, desativar, excluir e limpar lote aparecem no BKO',()=>{
 const source=original('components/indicator-admin.tsx');
 for(const name of ['Reativar acesso','Desativar acesso','Excluir cadastro de teste','Limpar indicadores de teste'])assert.match(source,new RegExp(name));
 assert.match(source,/\"PATCH\"/);assert.match(source,/\"DELETE\"/);
 assert.match(source,/ZERAR INDICADORES/);assert.match(source,/confirm:\"EXCLUIR\"/);
});
test('sem confirmação literal a API bloqueia sem abrir transação',async()=>{
 const s=harness();const r=await s.DELETE(makeRequest({userId,email,confirm:'SIM'}));
 assert.equal(r.status,400);assert.equal(s.trace.length,0);
});
test('sem origem segura, BKO negado ou perfil admin não pode excluir',async()=>{
 const s=harness();assert.equal((await s.DELETE(makeRequest({userId,email,confirm:'EXCLUIR'},'https://site.estranho'))).status,403);
 assert.equal(s.trace.length,0);
 const blocked=harness({admin:false});assert.equal((await blocked.DELETE(makeRequest({userId,email,confirm:'EXCLUIR'}))).status,403);
 const notIndicator=harness({role:'admin'});assert.equal((await notIndicator.DELETE(makeRequest({userId,email,confirm:'EXCLUIR'}))).status,404);
 assert.equal(notIndicator.committed,0);
});
test('pedidos vinculados impedem exclusão e preservam todos os dados',async()=>{
 const s=harness({purchases:1});const r=await s.DELETE(makeRequest({userId,email,confirm:'EXCLUIR'}));
 assert.equal(r.status,409);assert.equal((await r.json()).code,'HAS_FINANCIAL_HISTORY');
 assert.equal(s.committed,0);assert.equal(s.rolledBack,1);
 assert.equal(s.trace.filter(q=>q.startsWith('DELETE FROM')).length,0);
});
test('cashback impede exclusão mesmo sem pedidos',async()=>{
 const s=harness({finance:1});const r=await s.DELETE(makeRequest({userId,email,confirm:'EXCLUIR'}));
 assert.equal(r.status,409);assert.equal(s.committed,0);assert.equal(s.rolledBack,1);
});
test('indicador sem histórico é excluído com os vínculos na ordem e commit',async()=>{
 const s=harness();const r=await s.DELETE(makeRequest({userId,email,confirm:'EXCLUIR'}));
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{deleted:true,userId});
 assert.equal(s.committed,1);assert.equal(s.rolledBack,0);assert.equal(s.released,1);
 const deletes=s.trace.filter(q=>q.startsWith('DELETE FROM'));
 assert.ok(deletes.indexOf('DELETE FROM indicator_leads WHERE indicator_user_id=?') < deletes.indexOf('DELETE FROM indicator_profiles WHERE user_id=?'));
 assert.equal(deletes.at(-1),"DELETE FROM users WHERE id=? AND role='indicator' AND email=?");
 assert.ok(!deletes.some(q=>q.includes('DELETE FROM purchases')));
});
test('erro de SQL faz rollback e não apaga usuário',async()=>{
 const s=harness({broken:true});const r=await s.DELETE(makeRequest({userId,email,confirm:'EXCLUIR'}));
 assert.equal(r.status,500);assert.equal(s.committed,0);assert.equal(s.rolledBack,1);assert.equal(s.released,1);
});
test('classificação de risco financeiro não depende do valor da venda',()=>{
 assert.deepEqual(indicatorDeletionBlockers({purchases:1}),['pedidos vinculados']);
 assert.deepEqual(indicatorDeletionBlockers({affiliateCashbacks:1,financialLeads:1}),['cashback/repasse registrado','indicações com situação financeira']);
 assert.deepEqual(indicatorDeletionBlockers(),[]);
});
