import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load, memoryDb, operators, table} from './runtime-loader.mjs';
import {crmMetrics, crmLeadStage} from '../lib/indicator-crm.ts';

const record=(receiptId,receiptReview,status,shareAttempts=0,clickCount=0)=>({receiptId,receiptReview,status,shareAttempts,clickCount});
test('CRM não considera cliques, aberturas ou envio de comprovante como conversão',()=>{
 const records=[
  record(null,'PENDENTE','ENTROU NO LINK',3,8),
  record('proof','PENDENTE','ENTROU NO LINK',1,2),
  record('proof2','APROVADO','ESPERANDO NO CARRINHO',0,4),
  record('proof3','APROVADO','COMPROU',2,1),
  record('proof4','REJEITADO','ENTROU NO LINK',0,0),
 ];
 assert.deepEqual(crmMetrics(records),{generated:5,shareIntent:6,visits:15,withReceipt:4,pending:1,confirmed:1,rejected:1,reviewed:1});
 assert.deepEqual(records.map(crmLeadStage),['in_progress','pending','reviewed','confirmed','rejected']);
 records[3].shareAttempts=20;records[3].clickCount=1000;
 assert.equal(crmMetrics(records).confirmed,1,'interações não multiplicam compras');
});

test('endpoint de compartilhamento registra apenas ação da titular e recusa acesso cruzado',async()=>{
 const schema={indicatorLeads:table('id','indicatorUserId','shareAttempts','lastSharedAt')};
 const s=memoryDb(schema,{indicatorLeads:[{id:'l1',indicatorUserId:'isabella',shareAttempts:0},{id:'l2',indicatorUserId:'beatriz',shareAttempts:0}]});
 const db={...s.db,update:()=>({set:patch=>({where:async match=>{
  for(const row of s.rows.indicatorLeads)if(match(row)){row.shareAttempts++;row.lastSharedAt=patch.lastSharedAt}
 }})})};
 const user={id:'isabella',role:'indicator'};
 const deps={
  'drizzle-orm':{...operators,sql:()=>({})},
  '@/db':{getDb:()=>db},'@/db/schema':schema,
  '@/lib/auth':{requireIndicator:async()=>user.role==='indicator'?user:Promise.reject(Error('FORBIDDEN'))},
  '@/lib/indicator-schema':{ensureIndicatorSchema:async()=>{}},
  '@/lib/indicator-security':{cleanText:v=>typeof v==='string'?v.trim():'',indicatedError:e=>Response.json({error:e.message},{status:403}),privateResponseHeaders:{'cache-control':'no-store'}},
 };
 const {POST}=load('app/api/indicator/leads/share/route.ts',deps);
 const req=id=>new Request('https://lord.test/api/indicator/leads/share',{method:'POST',body:JSON.stringify({id})});
 assert.equal((await POST(req('l1'))).status,200);
 assert.equal(s.rows.indicatorLeads[0].shareAttempts,1);
 assert.equal((await POST(req('l2'))).status,404);
 assert.equal(s.rows.indicatorLeads[1].shareAttempts,0,'não registra dados de outra indicadora');
 assert.equal((await POST(req(''))).status,400);
 user.role='reseller';assert.equal((await POST(req('l1'))).status,403);
 assert.equal(s.rows.indicatorLeads[0].shareAttempts,1);
});

test('BKO tem uma área principal para parceiros e mantém clientes antigos separados',()=>{
 const portal=readFileSync(new URL('../app/painel/portal-client.tsx',import.meta.url),'utf8');
 const admin=readFileSync(new URL('../components/indicator-admin.tsx',import.meta.url),'utf8');
 const indicator=readFileSync(new URL('../components/indicator-portal.tsx',import.meta.url),'utf8');
 assert.match(portal,/Indicadores · CRM de Parceiros/);
 assert.doesNotMatch(portal,/\["clients","Acessos · Clientes"\]/);
 assert.match(admin,/IndicatedAccessAdmin/);
 assert.match(admin,/crm-workspace/);
 assert.match(admin,/Fila de conferência/);
 assert.match(indicator,/api\/indicator\/leads\/share/);
 assert.match(indicator,/Abre|Abrir WhatsApp/);
 for(const source of [admin,indicator])assert.doesNotMatch(source,/ASAAS_API_KEY|stockMovements|affiliateCashbacks|\/api\/admin\/sales/);
});

test('migração do CRM é aditiva e não altera esquema do Asaas',()=>{
 const ddl=readFileSync(new URL('../database/schema.sql',import.meta.url),'utf8');
 const mig=readFileSync(new URL('../scripts/migration-core.mjs',import.meta.url),'utf8');
 const startup=readFileSync(new URL('../lib/indicator-schema.ts',import.meta.url),'utf8');
 assert.match(ddl,/`share_attempts` int NOT NULL DEFAULT 0/);
 assert.match(mig,/indicator_leads:\{share_attempts:/);
 assert.match(startup,/last_shared_at/);
});
