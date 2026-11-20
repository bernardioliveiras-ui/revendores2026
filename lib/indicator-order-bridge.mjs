/** Eventos enviados EXCLUSIVAMENTE do backend da loja para o painel de indicadores. */
export const paidStatuses = new Set(['RECEIVED', 'CONFIRMED']);
export const cancelledStatuses = new Set(['REFUNDED', 'DELETED', 'CHARGEBACK_REQUESTED', 'RECEIVED_IN_CASH_UNDONE']);
export function normalizeIndicatorOrderEvent(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const event = data.event;
  const externalOrderId = typeof data.externalOrderId === 'string' ? data.externalOrderId.trim() : '';
  const campaignCode = typeof data.campaignCode === 'string' ? data.campaignCode.trim() : '';
  const asaasPaymentId = typeof data.asaasPaymentId === 'string' ? data.asaasPaymentId.trim() : '';
  const productTotalCents = data.productTotalCents;
  if (!['created', 'paid', 'cancelled'].includes(event) ||
      !/^[a-zA-Z0-9_-]{1,120}$/.test(externalOrderId) ||
      !/^[a-f0-9]{32}$/.test(campaignCode) ||
      !/^[a-zA-Z0-9_-]{1,120}$/.test(asaasPaymentId) ||
      !Number.isSafeInteger(productTotalCents) || productTotalCents < 0 || productTotalCents > 100_000_000) return null;
  return {event,externalOrderId,campaignCode,asaasPaymentId,productTotalCents};
}
export function paymentTransition(event, status, externalReference, externalOrderId) {
  if (externalReference !== externalOrderId) return null;
  if (event === 'paid' && paidStatuses.has(status)) return 'paid';
  if (event === 'cancelled' && cancelledStatuses.has(status)) return 'cancelled';
  return null;
}
