import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { calculateInfluencerCashback, validCampaignCashback } from '../lib/indicator-cashback.mjs';
import { summarizeCampaign } from '../lib/campaign-metrics.mjs';
const file=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('valor padrão é R$15 por compra válida, separado de % e revendedores',()=>{
 assert.equal(calculateInfluencerCashback(null,10000),1500);
 assert.equal(calculateInfluencerCashback({cashbackMode:'fixed',cashbackValue:2300},10000),2300);
 assert.equal(calculateInfluencerCashback({cashbackMode:'percent',cashbackValue:1500},20000),3000);
 assert.equal(calculateInfluencerCashback({cashbackMode:'percent',cashbackValue:750},12345),926);
 assert.equal(calculateInfluencerCashback({cashbackMode:'fixed',cashbackValue:1500},0),0);
 assert.ok(validCampaignCashback('fixed',1500));assert.ok(validCampaignCashback('percent',10000));
 for(const bad of [-1,NaN,Infinity,10001,'15'])assert.equal(validCampaignCashback('percent',bad),false);
});
test('métrica só contabiliza cashback salvo em vendas Asaas confirmadas, sem recálculo retroativo',()=>{
 const c={id:'campaign1',name:'Infl',publicCode:'xxx',active:1,clickCount:5};
 const orders=[
  {campaignId:'campaign1',paymentStatus:'paid',asaasVerifiedAt:'now',indicatorCashbackCents:1500,productTotalCents:10000,shippingCents:3000,interestCents:500,totalCents:13500},
  {campaignId:'campaign1',paymentStatus:'paid',asaasVerifiedAt:null,indicatorCashbackCents:null,productTotalCents:10000,totalCents:10000},
  {campaignId:'campaign1',paymentStatus:'cancelled',asaasVerifiedAt:null,indicatorCashbackCents:1500,productTotalCents:10000,totalCents:10000},
  {campaignId:'campaign1',paymentStatus:'paid',asaasVerifiedAt:'now',indicatorCashbackCents:null,productTotalCents:10000,totalCents:10000}
 ];
 const m=summarizeCampaign(c,orders);
 assert.equal(m.confirmedOrders,2);
 assert.equal(m.cashbackAccruedCents,1500);
 assert.equal(m.uncalculatedOrders,1);
 assert.equal(m.productRevenueCents,20000);
});
test('colunas persistentes e cobrança via webhook idempotente estão no projeto',()=>{
 assert.match(file('db/schema.ts'),/indicatorCashbackCents: int\("indicator_cashback_cents"\)/);
 assert.match(file('database/schema.sql'),/`cashback_value` int NOT NULL DEFAULT 1500/);
 assert.match(file('scripts/migration-core.mjs'),/indicator_cashback_cents/);
 const route=file('app/api/billing/webhook/route.ts');
 assert.match(route,/purchase\.paymentStatus!=="paid"/);
 assert.match(route,/saved\.indicatorCashbackCents===null/);
 assert.match(route,/calculateInfluencerCashback/);
 const bko=file('components/indicator-admin.tsx');assert.match(bko,/Salvar cashback/);
});
