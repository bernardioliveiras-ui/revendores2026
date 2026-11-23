/** A UI só pode oferecer ações de acesso para cobrança paga e verificada. */
export function canManagePurchaseAccess(purchase) {
  return purchase?.paymentStatus === "paid" && Boolean(purchase?.asaasVerifiedAt);
}
