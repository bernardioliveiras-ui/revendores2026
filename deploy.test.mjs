import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root=new URL('..',import.meta.url).pathname;const read=(p)=>readFile(join(root,p),'utf8');

test('Hostinger guide is fresh-database deployment with Node 22 and Asaas webhook',async()=>{
  const doc=await read('HOSTINGER-DEPLOY.md');
  assert.match(doc,/Node 22/i);assert.match(doc,/database\/schema\.sql/);assert.match(doc,/api\/billing\/webhook/);assert.match(doc,/ASAAS_WEBHOOK_TOKEN/);assert.match(doc,/banco novo|banco zerado|fresh/i);assert.doesNotMatch(doc,/migration/i);
});

test('BKO guide explains the exact paid -> release -> WhatsApp -> shipping workflow',async()=>{
  const doc=await read('BKO-OPERACAO.md');
  for(const text of ['Pagamento confirmado','Liberar acesso','Abrir WhatsApp','Em separação','Despachado','Entregue'])assert.match(doc,new RegExp(text));
});

test('README calls out VSL file and the four reseller modules',async()=>{
  const doc=await read('README.md');
  assert.match(doc,/vsl-mix10\.mp4/);for(const text of ['Visão geral','Estoque','Vendas','Afiliados'])assert.match(doc,new RegExp(text));
});
