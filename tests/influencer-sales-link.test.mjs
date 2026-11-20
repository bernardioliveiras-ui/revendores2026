import test from 'node:test';
import assert from 'node:assert/strict';
import { load, memoryDb, operators, table } from './runtime-loader.mjs';
import { summarizeCampaign } from '../lib/campaign-metrics.mjs';

const code = '9'.repeat(32);
const campaign = { id: 'campaign-1', publicCode: code, name: 'Instagram', active: 1, clickCount: 4 };

test('the sales link redirects to the local checkout, keeping only attribution parameters', async () => {
  const indicatorCampaigns = table('id', 'clickCount');
  const { db, rows } = memoryDb({ indicatorCampaigns }, { indicatorCampaigns: [campaign] });
  const { GET } = load('app/v/[code]/route.ts', {
    'drizzle-orm': { ...operators, sql: () => 5 },
    '@/db': { getDb: () => db },
    '@/db/schema': { indicatorCampaigns },
    '@/lib/campaigns': { resolveCampaign: async value => value === code ? campaign : null },
  });
  const request = new Request('https://rev.example/v/' + code + '?utm_source=meta&fbclid=123&campanha=wrong&next=https://outside.test');
  const response = await GET(request, { params: Promise.resolve({ code }) });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/comprar?venda=' + code + '&utm_source=meta&fbclid=123');
  assert.equal(rows.indicatorCampaigns[0].clickCount, 5);
  const unavailable = await GET(request, { params: Promise.resolve({ code: 'invalid' }) });
  assert.equal(unavailable.status, 404);
  assert.equal(unavailable.headers.get('location'), null);
});

test('only issued pending PIX counts as pending PIX and recovery excludes paid or cancelled orders', () => {
  const order = (status, extra = {}) => ({
    campaignId: campaign.id, paymentStatus: status, totalCents: 1500,
    productTotalCents: 1000, shippingCents: 500, interestCents: 0, ...extra,
  });
  const result = summarizeCampaign(campaign, [
    order('payment_pending', { paymentMethod: 'pix', asaasPaymentId: 'pay_1' }),
    order('payment_pending', { paymentMethod: 'credit', asaasPaymentId: 'pay_2' }),
    order('payment_error', { paymentMethod: 'pix' }),
    order('paid', { paymentMethod: 'pix', asaasVerifiedAt: '2026-11-13', indicatorCashbackCents: 150 }),
    order('cancelled', { paymentMethod: 'pix', asaasPaymentId: 'pay_3' }),
  ]);
  assert.equal(result.pixPending, 1);
  assert.equal(result.recoveryOpportunities, 3);
  assert.equal(result.confirmedOrders, 1);
  assert.equal(result.cashbackAccruedCents, 150);
});
