/** Apenas confirmação Asaas (não aprovações manuais nem intenção de compra). */
export function campaignPurchaseNetCents(purchase) {
  return Math.max(0, Number(purchase.productTotalCents) ||
    (Number(purchase.totalCents || 0) - Number(purchase.shippingCents || 0) - Number(purchase.interestCents || 0)));
}
export function isVerifiedPaid(purchase) {
  return purchase.paymentStatus === "paid" && Boolean(purchase.asaasVerifiedAt);
}
export function summarizeCampaign(campaign, purchases) {
  const related = purchases.filter(p => p.campaignId === campaign.id);
  const paid = related.filter(isVerifiedPaid);
  const confirmedOrders = paid.length;
  const productRevenueCents = paid.reduce((n,p) => n+campaignPurchaseNetCents(p),0);
  return { campaignId:campaign.id, name:campaign.name, code:campaign.publicCode,
    active:Boolean(campaign.active), clicks:Math.max(0,campaign.clickCount||0),
    checkouts:related.length, pending:related.filter(p=>!isVerifiedPaid(p)&&p.paymentStatus!=="cancelled").length,
    confirmedOrders, productRevenueCents,
    averageTicketCents:confirmedOrders ? Math.round(productRevenueCents/confirmedOrders):0,
    conversionRate:campaign.clickCount>0?Math.round(10000*confirmedOrders/campaign.clickCount)/100:0,
  };
}
