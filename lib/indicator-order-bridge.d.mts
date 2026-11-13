export type IndicatorOrderBridgeEvent = {
  event: 'created'|'paid'|'cancelled';
  externalOrderId: string;
  campaignCode: string;
  asaasPaymentId: string;
  productTotalCents: number;
};
export const paidStatuses: Set<string>;
export const cancelledStatuses: Set<string>;
export function normalizeIndicatorOrderEvent(input: unknown): IndicatorOrderBridgeEvent | null;
export function paymentTransition(event: IndicatorOrderBridgeEvent['event'], status: string|undefined, externalReference: string|undefined, externalOrderId: string): 'paid'|'cancelled'|null;
