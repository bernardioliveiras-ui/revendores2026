import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root=new URL('..',import.meta.url).pathname;const read=(p)=>readFile(join(root,p),'utf8');

test('reseller portal shows sales, resources and delivery work areas',async()=>{
  const src=await read('app/painel/portal-client.tsx');
  for(const label of ['Boas Vindas','Visão Geral','Manual do Revendedor','Estoque','Vendas','Acompanhe seu Pedido'])assert.match(src,new RegExp(label));
  assert.match(src,/Registrar venda/);assert.doesNotMatch(src,/view==="affiliates"/);
});

test('BKO portal exposes access release, logistics and metrics without reseller-only clutter',async()=>{
  const src=await read('app/painel/portal-client.tsx');
  for(const label of ['Liberar acesso','Em separação','Em percurso','Entregue','Revendedores ativos','Produtos vendidos (sem frete)'])assert.ok(src.includes(label),label);
  assert.match(src,/Abrir WhatsApp/);
});

test('legal pages exist and checkout footer links to them',async()=>{
  const terms=await read('app/termos-de-uso/page.tsx');const privacy=await read('app/politica-de-privacidade/page.tsx');const home=await read('components/landing-sections.tsx');
  assert.match(terms,/Termos de Uso/);assert.match(privacy,/Política de Privacidade/);assert.match(home,/\/termos-de-uso/);assert.match(home,/\/politica-de-privacidade/);
});
