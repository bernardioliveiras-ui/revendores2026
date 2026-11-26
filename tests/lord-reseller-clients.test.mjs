import test from 'node:test';
import assert from 'node:assert/strict';
import { load, memoryDb, operators, table } from './runtime-loader.mjs';
import { normalizeCustomerPhone, buildResellerClients } from '../lib/reseller-clients.mjs';

test('telefone nacional ou +55 gera mesmo contato e WhatsApp sem duplicar DDI', () => {
  assert.equal(normalizeCustomerPhone('(11) 98888-7777'), '11988887777');
  assert.equal(normalizeCustomerPhone('+55 11 98888-7777'), '11988887777');
  assert.equal(normalizeCustomerPhone('11 3333-4444'), '1133334444');
  assert.equal(normalizeCustomerPhone('999'), '');
  assert.equal(normalizeCustomerPhone('20 98888-7777'), '');
  assert.equal(normalizeCustomerPhone('00 (11) 98888-7777'), '');
});

test('clientes são derivados somente de vendas com nome e telefone e agrupados por número', () => {
  const clients=buildResellerClients([
    {id:'s1',customerName:'Ana Silva',customerPhone:'(11) 98888-7777',boxes:2,soldAt:'2026-11-20T10:00:00Z'},
    {id:'s2',customerName:'Ana S.',customerPhone:'+55 11 98888-7777',boxes:3,soldAt:'2026-11-26T10:00:00Z'},
    {id:'s3',customerName:'Carlos',customerPhone:'(21) 97777-6666',boxes:1,soldAt:'2026-11-24T10:00:00Z'},
    {id:'legacy',customerName:'Antiga',customerPhone:'',boxes:5,soldAt:'2026-11-25T10:00:00Z'},
  ]);
  assert.deepEqual(clients.map(c=>({name:c.name,phone:c.phone,salesCount:c.salesCount,totalBoxes:c.totalBoxes,whatsappUrl:c.whatsappUrl})),[
    {name:'Ana S.',phone:'11988887777',salesCount:2,totalBoxes:5,whatsappUrl:'https://wa.me/5511988887777'},
    {name:'Carlos',phone:'21977776666',salesCount:1,totalBoxes:1,whatsappUrl:'https://wa.me/5521977776666'},
  ]);
});

test('endpoint Clientes não revela vendas de outro revendedor nem permite admin', async () => {
  const schema={sales:table('userId')};
  const fixture=memoryDb(schema,{sales:[
    {id:'a',userId:'seller-1',customerName:'Maria',customerPhone:'11999990000',boxes:2,soldAt:'2026-11-25T10:00:00Z'},
    {id:'b',userId:'seller-2',customerName:'Sigiloso',customerPhone:'21988880000',boxes:1,soldAt:'2026-11-25T10:00:00Z'},
  ]});
  const mocks={'drizzle-orm':operators,'@/db':{getDb:()=>fixture.db},'@/db/schema':schema,'@/lib/auth':{requireSession:async()=>({id:'seller-1',role:'reseller'})},'@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},'@/lib/reseller-clients.mjs':{buildResellerClients}};
  const route=load('app/api/clients/route.ts',mocks);
  const response=await route.GET(new Request('https://lord.test/api/clients'));
  assert.equal(response.status,200);
  const payload=await response.json();
  assert.equal(payload.clients.length,1);
  assert.equal(payload.clients[0].name,'Maria');
  assert.equal(payload.clients[0].whatsappUrl,'https://wa.me/5511999990000');
  const blocked=load('app/api/clients/route.ts',{...mocks,'@/lib/auth':{requireSession:async()=>({id:'bko',role:'admin'})}});
  assert.equal((await blocked.GET(new Request('https://lord.test/api/clients'))).status,403);
});
