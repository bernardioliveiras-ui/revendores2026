import test from 'node:test';
import assert from 'node:assert/strict';
import { load, memoryDb, operators, table } from './runtime-loader.mjs';
import * as policy from '../lib/manual-shipment-policy.mjs';

const schema={users:table('id','role'),manualShipments:table('id','userId','boxes','shippingStatus','stockCreditMode','stockCreditedAt','trackingCode','carrier','orderNumber'),stockMovements:table('id','userId','type','boxes')};
const seller={id:'seller',role:'reseller'};
const parcel=(more={})=>({id:'s1',userId:'seller',boxes:20,orderNumber:'MAN-TESTE',shippingStatus:'separating',stockCreditMode:'on_delivery',stockCreditedAt:null,carrier:null,trackingCode:null,...more});
function setup(shipment,stock=[]){
  const state=memoryDb(schema,{users:[seller],manualShipments:[shipment],stockMovements:stock});
  const service=load('lib/manual-shipments.ts',{
    'drizzle-orm':operators,'@/db':{getDb:()=>state.db},'@/db/schema':schema,
    '@/lib/stock':{calculateStock:rows=>rows.reduce((n,r)=>n+(r.type==='entry'||r.type==='adjustment_in'?r.boxes:-(r.boxes)),0)},
    '@/lib/manual-shipment-policy.mjs':policy,'@/lib/delivery-progress':load('lib/delivery-progress.ts'),
    '@/lib/order-notification':{sendManualShipmentStatusEmail:async()=>({sent:true})},
  });
  return {...state,...service};
}

test('postagem e entrega manual liberam caixas uma só vez',async()=>{
  const s=setup(parcel());
  await s.updateManualShipmentShipping('s1','shipped','Correios','AA123456789BR');
  assert.equal(s.rows.manualShipments[0].shippingStatus,'shipped');
  assert.equal(s.rows.stockMovements.length,0);
  await s.updateManualShipmentShipping('s1','delivered');
  await s.updateManualShipmentShipping('s1','delivered');
  assert.equal(s.rows.stockMovements.length,1);
  assert.equal(s.rows.stockMovements[0].boxes,20);
  assert.equal(s.rows.stockMovements[0].referenceType,'manual_shipment_delivery');
  assert.ok(s.rows.manualShipments[0].stockCreditedAt);
});

test('lançamento histórico mantém saldo e não recebe crédito duplicado na entrega',async()=>{
  const s=setup(parcel({stockCreditMode:'already_in_stock'}),[{id:'old',userId:'seller',type:'entry',boxes:20}]);
  await s.updateManualShipmentShipping('s1','shipped','Correios','AA123456789BR');
  await s.updateManualShipmentShipping('s1','delivered');
  assert.equal(s.rows.stockMovements.length,1);
});

test('saldo antigo é suspenso com motivo e volta uma única vez após o recebimento',async()=>{
  const s=setup(parcel({stockCreditMode:'already_in_stock'}),[{id:'old',userId:'seller',type:'entry',boxes:20}]);
  await s.suspendLegacyManualShipment('s1',20,'admin');
  assert.equal(s.rows.manualShipments[0].stockCreditMode,'on_delivery');
  assert.equal(s.rows.stockMovements[1].type,'adjustment_out');
  await s.updateManualShipmentShipping('s1','shipped','Correios','AA123456789BR');
  await s.updateManualShipmentShipping('s1','delivered');
  assert.equal(s.rows.stockMovements[2].type,'entry');
  assert.equal(s.rows.stockMovements.length,3);
});

test('evento confiável dos Correios pode entregar direto após a etiqueta',async()=>{
  const s=setup(parcel({trackingCode:'AA123456789BR',carrier:'Correios'}));
  await s.updateManualShipmentShipping('s1','',undefined,undefined,{originalCode:'AA123456789BR',originalCarrier:'Correios',event:{stage:'delivered',description:'Objeto entregue ao destinatário',at:'2026-11-26T12:00:00Z'}});
  assert.equal(s.rows.manualShipments[0].shippingStatus,'delivered');
  assert.equal(s.rows.stockMovements.length,1);
});
