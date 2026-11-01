import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load,memoryDb,operators,table} from './runtime-loader.mjs';
import {validateResellerEdit} from '../lib/reseller-edit-validation.mjs';
const file=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const normalizeEmail=(v)=>typeof v==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())?v.trim().toLowerCase():null;
const isAdminEmail=(e)=>e==='admin@lord.test';
const privateResponseHeaders={'cache-control':'no-store'};
const indicatedError=(e)=>Response.json({error:e.message},{status:e.message==='FORBIDDEN'?403:500});
function editHarness({role='reseller',email='teste@lord.test'}={}){
 const schema={users:table('id','name','email','phone','role','status','updatedAt'),authSessions:table('tokenHash','userId')};
 const {db,rows}=memoryDb(schema,{users:[{id:'rev1',name:'Antigo',email,phone:'11912345678',role,status:'active'}],authSessions:[{tokenHash:'s1',userId:'rev1'}]});
 const mocks={
  'drizzle-orm':operators,'@/db':{getDb:()=>db,getMysqlPool:()=>{}},'@/db/schema':schema,
  '@/lib/auth':{normalizeEmail,isAdminEmail,requireAdmin:async()=>({id:'adm1'})},
  '@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},
  '@/lib/indicator-security':{cleanText:v=>typeof v==='string'?v.trim():'',indicatedError,privateResponseHeaders},
  '@/lib/reseller-delete-guards.mjs':{resellerDeletionBlockers:()=>[]},
  '@/lib/reseller-edit-validation.mjs':{validateResellerEdit}
 };
 const {PUT}=load('app/api/admin/resellers/route.ts',mocks);
 const request=(body,origin='https://bko.test')=>new Request('https://bko.test/api/admin/resellers',{method:'PUT',headers:{origin,host:'bko.test','content-type':'application/json'},body:JSON.stringify(body)});
 return {PUT,request,rows};
}
test('edição altera somente cadastro do revendedor, encerra sessão se login mudou',async()=>{
 const h=editHarness();const result=await h.PUT(h.request({userId:'rev1',name:'Novo Nome',email:'NOVO@LORD.TEST',phone:'(11) 98888-7777',role:'admin',active:false}));
 assert.equal(result.status,200);
 assert.equal((await result.json()).loginChanged,true);
 assert.deepEqual([h.rows.users[0].name,h.rows.users[0].email,h.rows.users[0].phone,h.rows.users[0].role,h.rows.users[0].status],['Novo Nome','novo@lord.test','11988887777','reseller','active']);
 assert.equal(h.rows.authSessions.length,0);
});
test('edição protege ADMIN, origem, email reservado e telefone inválido',async()=>{
 let h=editHarness({role:'admin'});
 assert.equal((await h.PUT(h.request({userId:'rev1',name:'João',email:'joao@lord.test',phone:'11999999999'}))).status,404);
 h=editHarness();
 assert.equal((await h.PUT(h.request({userId:'rev1',name:'João',email:'joao@lord.test',phone:'11999999999'},'https://outro.test'))).status,403);
 assert.equal((await h.PUT(h.request({userId:'rev1',name:'João',email:'admin@lord.test',phone:'11999999999'}))).status,400);
 assert.equal((await h.PUT(h.request({userId:'rev1',name:'João',email:'joao@lord.test',phone:'123'}))).status,400);
 assert.equal(h.rows.users[0].email,'teste@lord.test');
});
test('BKO separa cadastro, pedidos e manutenção, com botão de edição',()=>{
 const ui=file('app/painel/portal-client.tsx');
 for(const term of ['Cadastros · Revendedores','Pedidos e acessos','Manutenção · Zerar testes','Editar cadastro','Salvar cadastro','Atualizar prévia','Copiar comando de limpeza'])assert.ok(ui.includes(term),term);
 assert.ok(!ui.includes('adminTab === "access" || adminTab === "shipping"'),'pedidos não podem ficar na aba de cadastros');
});
test('prévia de manutenção consulta contagens e não pode apagar',async()=>{
 const calls=[];const pool={query:async(sql)=>{
  calls.push(sql);
  if(sql.includes('information_schema.TABLES'))return [[{name:'purchases'},{name:'sales'},{name:'stock_movements'}]];
  if(sql.includes('GROUP BY role'))return [[{role:'admin',n:1},{role:'reseller',n:3}]];
  if(sql.includes('purchases'))return [[{n:14}]];
  return [[{n:2}]];
 }};
 const {GET}=load('app/api/admin/maintenance/route.ts',{'@/db':{getMysqlPool:()=>pool},'@/lib/auth':{requireAdmin:async()=>({role:'admin'})},'@/lib/indicator-security':{privateResponseHeaders,indicatedError}});
 const result=await GET(new Request('https://bko.test/api/admin/maintenance'));
 assert.equal(result.status,200);
 const data=await result.json();assert.equal(data.counts.purchases,14);assert.equal(data.usersByRole.admin,1);assert.equal(data.mode,'preview_only');
 assert.ok(calls.every(sql=>/^SELECT /.test(sql)));
});
