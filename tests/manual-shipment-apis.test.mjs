import test from 'node:test';
import assert from 'node:assert/strict';
import { load, memoryDb, operators, table } from './runtime-loader.mjs';
import * as policy from '../lib/manual-shipment-policy.mjs';

const originHeaders={origin:'https://lord.example',host:'lord.example','content-type':'application/json'};
const req=(path,body,headers={})=>new Request('https://lord.example'+path,{method:'POST',headers:{...originHeaders,...headers},body:JSON.stringify(body)});

test('BKO cria remessa sem tocar em compra ou pagamento e exige origem autenticada',async()=>{
  const schema={users:table('id','role'),manualShipments:table('id','userId','boxes','stockCreditMode')};
  const s=memoryDb(schema,{users:[{id:'seller',role:'reseller'}]});
  const {POST}=load('app/api/admin/manual-shipments/route.ts',{
    'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,
    '@/lib/auth':{requireAdmin:async request=>{if(request.headers.get('x-deny'))throw Error('FORBIDDEN')}},
    '@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},
    '@/lib/manual-shipment-policy.mjs':policy,
    '@/lib/indicator-security':{privateResponseHeaders:{'cache-control':'no-store'}},
  });
  assert.equal((await POST(req('/api/admin/manual-shipments',{userId:'seller',boxes:12},{origin:'https://evil.example'}))).status,403);
  assert.equal((await POST(req('/api/admin/manual-shipments',{userId:'seller',boxes:12},{'x-deny':'1'}))).status,403);
  assert.equal((await POST(req('/api/admin/manual-shipments',{userId:'seller',boxes:0}))).status,400);
  const response=await POST(req('/api/admin/manual-shipments',{userId:'seller',boxes:12}));
  assert.equal(response.status,201);
  assert.equal(s.rows.manualShipments.length,1);
  assert.equal(s.rows.manualShipments[0].stockCreditMode,'on_delivery');
});

test('expedição recebe atualização manual e mantém compra financeira isolada',async()=>{
  let manualCalls=0,financialCalls=0;
  const {PATCH}=load('app/api/admin/shipping/route.ts',{
    '@/lib/auth':{requireAdmin:async()=>({id:'admin'})},
    '@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},
    '@/lib/shipping':{updatePurchaseShipping:async()=>{financialCalls++;return {updated:true,ignored:false}}},
    '@/lib/manual-shipments':{updateManualShipmentShipping:async()=>{manualCalls++;return {updated:true,ignored:false}},suspendLegacyManualShipment:async()=>({updated:true,stock:0})},
  });
  const send=body=>new Request('https://lord.example/api/admin/shipping',{method:'PATCH',headers:originHeaders,body:JSON.stringify(body)});
  assert.equal((await PATCH(send({manualShipmentId:'s1',status:'shipped',carrier:'Correios',trackingCode:'AA123456789BR'}))).status,200);
  assert.equal(manualCalls,1);assert.equal(financialCalls,0);
  assert.equal((await PATCH(send({purchaseId:'p1',status:'shipped'}))).status,200);
  assert.equal(financialCalls,1);
});
