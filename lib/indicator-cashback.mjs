/** A mesma regra não altera o cashback e as comissões do revendedor. */
export const DEFAULT_INFLUENCER_CASHBACK_CENTS = 1500;
/** fixed: centavos por pedido; percent: pontos-base de 0 a 10000 (100.00%). */
export function validCampaignCashback(mode, value) {
  return ["fixed","percent"].includes(mode) && Number.isSafeInteger(value) && value>=0 &&
    (mode==="percent" ? value<=10000 : value<=10000000);
}
export function calculateInfluencerCashback(campaign, productTotalCents) {
  const mode=campaign?.cashbackMode||"fixed";
  const value=campaign?.cashbackValue??DEFAULT_INFLUENCER_CASHBACK_CENTS;
  if(!validCampaignCashback(mode,value)) throw Error("INVALID_INFLUENCER_CASHBACK");
  const base=Math.max(0,Number(productTotalCents)||0);
  if(!Number.isSafeInteger(base)) throw Error("INVALID_PRODUCT_TOTAL");
  if(base===0) return 0;
  return mode==="fixed"?value:Math.round(base*value/10000);
}
