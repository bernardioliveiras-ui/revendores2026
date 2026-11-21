import test from 'node:test';
import assert from 'node:assert/strict';
import { segmentPurchases, isResellerKitPurchase } from '../lib/purchase-segments.mjs';

const purchase=(id,kit,campaignId=null)=>({id,kit,campaignId,paymentStatus:'paid',asaasVerifiedAt:'2026-11-21T10:00:00Z'});

test('kits ficam em acessos, MIX10 com campanha fica com influenciador e MIX10 sem campanha em vendas avulsas',()=>{
  const rows=[purchase('kit20','kit20'),purchase('kit50-campaign','kit50','campaign-1'),purchase('affiliated','mix10-unit','campaign-1'),purchase('direct','mix10-unit'),purchase('unknown','other')];
  const result=segmentPurchases(rows);
  assert.deepEqual(result.resellerKits.map(p=>p.id),['kit20','kit50-campaign']);
  assert.deepEqual(result.influencerUnits.map(p=>p.id),['affiliated']);
  assert.deepEqual(result.directUnits.map(p=>p.id),['direct']);
  assert.deepEqual(result.unknown.map(p=>p.id),['unknown']);
  assert.equal(isResellerKitPurchase(purchase('retail','mix10-unit')),false);
});
