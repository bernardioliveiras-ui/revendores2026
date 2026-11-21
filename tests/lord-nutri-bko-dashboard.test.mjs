import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBkoDashboard } from '../lib/bko-dashboard-data.mjs';

const now = new Date('2026-11-21T12:00:00.000Z');
const purchases = [
  { id:'paid-today', kit:'kit20', campaignId:null, paymentStatus:'paid', asaasVerifiedAt:'2026-11-21T10:00:00.000Z', createdAt:'2026-11-20T18:00:00.000Z', totalCents:13000, productTotalCents:10000, shippingCents:3000, interestCents:0, accessReleasedAt:null, shippingStatus:'separating' },
  { id:'paid-old', kit:'kit50', campaignId:null, paymentStatus:'paid', asaasVerifiedAt:'2026-11-10T15:00:00.000Z', createdAt:'2026-11-09T17:00:00.000Z', totalCents:29000, productTotalCents:25000, shippingCents:4000, interestCents:0, accessReleasedAt:'2026-11-11T14:00:00.000Z', shippingStatus:'shipped' },
  { id:'pending', paymentStatus:'pending', asaasVerifiedAt:null, createdAt:'2026-11-21T08:00:00.000Z', totalCents:8000, shippingStatus:'pending' },
  { id:'unverified', paymentStatus:'paid', asaasVerifiedAt:null, createdAt:'2026-11-21T08:00:00.000Z', totalCents:12000, shippingStatus:'separating' },
];

test('painel do dia conta somente cobranças verificadas no Asaas, sem somar frete nem pagamento sem verificação', () => {
  const result = buildBkoDashboard(purchases, 'today', now);
  assert.equal(result.verifiedCount, 1);
  assert.equal(result.productRevenueCents, 10000);
  assert.equal(result.pendingCount, 1);
  assert.equal(result.pendingAccessCount, 1);
  assert.equal(result.shippingCount, 1);
});

test('filtros 7 e 30 dias preservam a data real da confirmação, sem misturar cadastro e pagamento', () => {
  assert.equal(buildBkoDashboard(purchases, '7d', now).verifiedCount, 1);
  assert.equal(buildBkoDashboard(purchases, '30d', now).verifiedCount, 2);
  assert.equal(buildBkoDashboard(purchases, '30d', now).productRevenueCents, 35000);
});

test('mês anterior e gráfico diário não inventam dados financeiros', () => {
  const result = buildBkoDashboard(purchases, 'prev_month', now);
  assert.equal(result.verifiedCount, 0);
  assert.equal(result.productRevenueCents, 0);
  const sevenDays = buildBkoDashboard(purchases, '7d', now).daily;
  assert.equal(sevenDays.length, 7);
  assert.equal(sevenDays.reduce((total, day) => total + day.cents, 0), 10000);
});

test('pedido com valor ou timestamp inválido não cria crédito ou receita', () => {
  const result = buildBkoDashboard([{paymentStatus:'paid', asaasVerifiedAt:'invalido', productTotalCents:999999}], 'all', now);
  assert.equal(result.verifiedCount, 0);
  assert.equal(result.productRevenueCents, 0);
});

test('duas compras unitárias verificadas não criam acessos pendentes de revendedores',()=>{
  const rows=[
    {...purchases[0],id:'campaign-unit',kit:'mix10-unit',campaignId:'campaign-1',accessReleasedAt:null},
    {...purchases[0],id:'direct-unit',kit:'mix10-unit',campaignId:null,accessReleasedAt:null},
  ];
  const result=buildBkoDashboard(rows,'today',now);
  assert.equal(result.verifiedCount,2);
  assert.equal(result.productRevenueCents,20000);
  assert.equal(result.pendingAccessCount,0);
  assert.equal(result.influencerUnitCount,1);
  assert.equal(result.directUnitCount,1);
  assert.equal(result.resellerKitCount,0);
});
