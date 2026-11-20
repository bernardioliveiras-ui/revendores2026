import assert from 'node:assert/strict';
import test from 'node:test';
import { isVerifiedPaid, campaignPurchaseNetCents, summarizeCampaign } from '../lib/campaign-metrics.mjs';

const campaign={id:'camp-a',publicCode:'abcd',name:'Instagram',active:1,clickCount:100};
function order(id,paymentStatus,asaasVerifiedAt=null,extra={}){
 return {id,campaignId:'camp-a',paymentStatus,asaasVerifiedAt,productTotalCents:149800,
  totalCents:153600,shippingCents:3000,interestCents:800,...extra};
}
test('one reusable campaign attributes multiple real orders and excludes freight and interest',()=>{
 const data=[order('1','paid','2026-10-26T00:00:00.000Z'),order('2','paid','2026-10-26T01:00:00.000Z')];
 const totals=summarizeCampaign(campaign,data);
 assert.equal(totals.confirmedOrders,2);assert.equal(totals.checkouts,2);assert.equal(totals.productRevenueCents,299600);
 assert.equal(totals.averageTicketCents,149800);assert.equal(totals.conversionRate,2);
});
test('pending, failed and manually marked paid do not count as verified sales',()=>{
 const data=[order('1','payment_pending'),order('2','payment_error'),order('3','paid'),order('4','cancelled')];
 const totals=summarizeCampaign(campaign,data);
 assert.equal(totals.confirmedOrders,0);assert.equal(totals.productRevenueCents,0);
 assert.equal(totals.checkouts,4);assert.equal(totals.pending,3);
});
test('cancelled or refunded orders removed even if event previously verified',()=>{
 const data=[order('1','cancelled','2026-10-26T00:00:00.000Z'),order('2','paid','2026-10-26T01:00:00.000Z')];
 assert.equal(summarizeCampaign(campaign,data).confirmedOrders,1);
 assert.equal(isVerifiedPaid(data[0]),false);
});
test('attribution does not spill over into other influencers',()=>{
 const data=[order('1','paid','2026-10-26T00:00:00.000Z'),{...order('2','paid','2026-10-26T00:00:00.000Z'),campaignId:'camp-b'}];
 assert.equal(summarizeCampaign(campaign,data).confirmedOrders,1);
});
test('older orders lacking a product total calculate product-only revenue without freight or installment interest',()=>{
 const p=order('1','paid','2026-10-26T00:00:00.000Z',{productTotalCents:0});
 assert.equal(campaignPurchaseNetCents(p),149800);
});
