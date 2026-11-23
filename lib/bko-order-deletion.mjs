/** Validação independente de interface; confirmação idêntica ao pedido completo. */
export function validateOrderDeletion(body) {
  const purchaseId=typeof body?.purchaseId === "string" ? body.purchaseId.trim() : "";
  const orderNumber=typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";
  if (!purchaseId || !orderNumber || purchaseId.length > 80 || orderNumber.length > 60 || !/^[\w-]+$/.test(orderNumber))
    return {error:"Informe o pedido e seu número completo."};
  if (body?.confirm !== orderNumber) return {error:"Digite exatamente o número do pedido para confirmar a exclusão."};
  return {purchaseId,orderNumber};
}

/** Histórico efetivamente utilizado nunca é removido por limpeza de teste. */
/**
 * @param {{
 *   shippingStatus?: string | null,
 *   trackingCode?: string | null,
 *   shippedAt?: string | null,
 *   deliveredAt?: string | null,
 *   sales?: number,
 *   referrals?: number,
 *   paidCashback?: boolean,
 *   outgoingMovements?: number
 * }} [options]
 */
export function deletionBlockers({shippingStatus,trackingCode,shippedAt,deliveredAt,sales=0,referrals=0,paidCashback=false,outgoingMovements=0}={}) {
  const blockers=[];
  if (["shipped","delivered"].includes(shippingStatus) || trackingCode || shippedAt || deliveredAt) blockers.push("expedição realizada");
  if (sales > 0) blockers.push("vendas registradas pelo revendedor");
  if (referrals > 0) blockers.push("indicações vinculadas à conta");
  if (paidCashback) blockers.push("cashback já pago");
  if (outgoingMovements > 0) blockers.push("movimentações de saída do estoque");
  return blockers;
}
