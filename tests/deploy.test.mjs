import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root=new URL('..',import.meta.url).pathname;const read=(p)=>readFile(join(root,p),'utf8');

test('Hostinger guide documents Node 22, additive startup and Asaas webhook',async()=>{
  const doc=await read('LEIA-ME-PRIMEIRO.md');
  assert.match(doc,/Node 22/i);assert.match(doc,/db:migrate/);assert.match(doc,/api\/billing\/webhook/);assert.match(doc,/ASAAS_WEBHOOK_TOKEN/);assert.match(doc,/aditiva/);

});

test('BKO guide explains the exact paid -> release -> WhatsApp -> shipping workflow',async()=>{
  const doc=await read('BKO-OPERACAO.md');
  for(const text of ['Pagamento confirmado','Liberar acesso','Abrir WhatsApp','Em separação','Em percurso','Entregue'])assert.match(doc,new RegExp(text));
});

test('README describes the LORDNUTRI reseller modules and VSL',async()=>{
  const doc=await read('README.md');
  assert.match(doc,/vsl-mix10\.mp4/);for(const text of ['Visão geral','Estoque','Vendas','Manual do Revendedor'])assert.match(doc,new RegExp(text));
});
