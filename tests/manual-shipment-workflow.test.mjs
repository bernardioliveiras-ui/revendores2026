import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planManualShipment, planManualDelivery, planLegacySuspension } from '../lib/manual-shipment-policy.mjs';

test('remessa manual exige quantidade positiva e não equivale a pagamento Asaas', () => {
  assert.equal(planManualShipment(20).boxes, 20);
  assert.equal(planManualShipment(20).stockCreditMode, 'on_delivery');
  for (const invalid of [0, -1, 1.2, 2147483648, '20'])
    assert.throws(() => planManualShipment(invalid), /quantidade/i);
});

test('entrega única libera estoque apenas na remessa ainda não creditada', () => {
  assert.deepEqual(planManualDelivery({shippingStatus:'shipped', stockCreditMode:'on_delivery', stockCreditedAt:null, boxes:50}), {creditBoxes:50, delivered:true});
  assert.deepEqual(planManualDelivery({shippingStatus:'delivered', stockCreditMode:'on_delivery', stockCreditedAt:'2026-11-26', boxes:50}), {creditBoxes:0, delivered:false});
  assert.deepEqual(planManualDelivery({shippingStatus:'shipped', stockCreditMode:'already_in_stock', stockCreditedAt:null, boxes:50}), {creditBoxes:0, delivered:true});
  assert.throws(() => planManualDelivery({shippingStatus:'separating',stockCreditMode:'on_delivery',boxes:20}), /postagem/i);
});

test('remessa histórica pode ter o saldo suspenso com conferência, sem duplicação', () => {
  assert.equal(planLegacySuspension({stockCreditMode:'already_in_stock',shippingStatus:'separating',boxes:20},20),20);
  assert.throws(()=>planLegacySuspension({stockCreditMode:'already_in_stock',shippingStatus:'separating',boxes:20},10),/insuficiente/i);
  assert.throws(()=>planLegacySuspension({stockCreditMode:'on_delivery',shippingStatus:'separating',boxes:20},30),/já/i);
});

test('expedição e portal incluem remessas manuais sem criar compras artificiais', () => {
  const root = new URL('../',import.meta.url);
  const source = path => readFileSync(new URL(path,root),'utf8');
  assert.match(source('db/schema.ts'), /manualShipments = mysqlTable/);
  assert.match(source('app/api/admin/overview/route.ts'), /manualShipments/);
  assert.match(source('app/api/my-purchases/route.ts'), /manualShipments/);
  assert.match(source('app/api/admin/shipping/route.ts'), /manualShipmentId/);
  assert.match(source('lib/correios-sync.ts'), /manual_shipments/);
  assert.match(source('app/api/admin/resellers/route.ts'), /manualShipments/);
  assert.match(source('components/bko-shipping.tsx'), /Remessa manual/);
});
