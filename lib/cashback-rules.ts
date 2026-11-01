export const CASHBACK_CENTS = 1500;
export type CashbackStatus = 'pending' | 'approved' | 'paid' | 'cancelled';
export function parseQualification(body: Record<string, unknown>) {
  const referralCode = typeof body.referralCode === 'string' ? body.referralCode.trim().toUpperCase() : '';
  const externalOrderId = typeof body.externalOrderId === 'string' ? body.externalOrderId.trim() : '';
  const buyerEmail = typeof body.buyerEmail === 'string' ? body.buyerEmail.trim().toLowerCase() : '';
  const boxes = body.boxes;
  if (!/^[A-Z0-9_-]{1,64}$/.test(referralCode) || !externalOrderId || externalOrderId.length > 71 || /[\x00-\x1f]/.test(externalOrderId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail) || buyerEmail.length > 254 || typeof boxes !== 'number' || !Number.isInteger(boxes) || boxes < 1 || boxes > 2147483647 || body.paymentStatus !== 'paid') return null;
  return {referralCode, externalOrderId, buyerEmail, boxes};
}
export function canTransitionCashback(from: string, to: string) {
  return (from === 'pending' && ['approved','cancelled'].includes(to)) || (from === 'approved' && ['paid','cancelled'].includes(to));
}
export function summarizeCashbacks(rows: Array<{status: string; amountCents: number}>) {
  const totals = {totalCents:0,pendingCents:0,approvedCents:0,paidCents:0,cancelledCents:0,qualifiedOrders:0};
  for (const row of rows) {
    if (row.status === 'cancelled') {totals.cancelledCents += row.amountCents; continue;}
    if (!['pending','approved','paid'].includes(row.status)) continue;
    totals.totalCents += row.amountCents; totals.qualifiedOrders++;
    if (row.status === 'pending') totals.pendingCents += row.amountCents;
    if (row.status === 'approved') totals.approvedCents += row.amountCents;
    if (row.status === 'paid') totals.paidCents += row.amountCents;
  }
  return totals;
}
export function affiliateDestination(base: string, code: string, incoming: URLSearchParams) {
  const destination = new URL(base);
  for (const [key,value] of incoming) if (/^utm_(source|medium|campaign|content|term)$/.test(key) || ['gclid','fbclid','msclkid'].includes(key)) destination.searchParams.set(key,value.slice(0,500));
  destination.searchParams.set('ref',code); destination.searchParams.set('referralCode',code);
  for (const [key,value] of [['utm_source','revendedor'],['utm_medium','indicacao'],['utm_campaign',`cashback-${code}`]]) if (!destination.searchParams.has(key)) destination.searchParams.set(key,value);
  return destination;
}
