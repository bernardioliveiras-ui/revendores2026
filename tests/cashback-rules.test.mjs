import test from 'node:test';
import assert from 'node:assert/strict';
const rules = await import('../lib/cashback-rules.ts').catch(() => ({}));

test('only a paid order containing at least one whole unit qualifies', () => {
  assert.equal(typeof rules.parseQualification, 'function');
  const base = { referralCode: ' ab12 ', externalOrderId: 'order-1', buyerEmail: 'Buyer@Example.com', boxes: 20, paymentStatus: 'paid' };
  assert.deepEqual(rules.parseQualification(base), { referralCode: 'AB12', externalOrderId: 'order-1', buyerEmail: 'buyer@example.com', boxes: 20 });
  for (const boxes of [0, -1, 1.5, '20', Infinity, undefined]) assert.equal(rules.parseQualification({ ...base, boxes }), null);
  for (const paymentStatus of ['pending','cancelled',null]) assert.equal(rules.parseQualification({ ...base, paymentStatus }), null);
  assert.equal(rules.parseQualification({ ...base, externalOrderId: 'x'.repeat(72) }), null);
});
test('cashback is always 1500 cents per order regardless of quantity', () => {
  assert.equal(rules.CASHBACK_CENTS, 1500);
});
test('payment requires approval; paid and cancelled cannot be reopened', () => {
  assert.equal(typeof rules.canTransitionCashback, 'function');
  for (const [from,to] of [['pending','approved'],['pending','cancelled'],['approved','paid'],['approved','cancelled']]) assert.equal(rules.canTransitionCashback(from,to), true);
  for (const [from,to] of [['pending','paid'],['paid','pending'],['paid','approved'],['paid','cancelled'],['cancelled','paid'],['cancelled','approved'],['approved','pending']]) assert.equal(rules.canTransitionCashback(from,to), false);
});
test('cancelled credits do not inflate balance or qualified order totals', () => {
  assert.equal(typeof rules.summarizeCashbacks, 'function');
  assert.deepEqual(rules.summarizeCashbacks(['pending','approved','paid','cancelled'].map(status => ({ status, amountCents:1500 }))), {totalCents:4500,pendingCents:1500,approvedCents:1500,paidCents:1500,cancelledCents:1500,qualifiedOrders:3});
});
test('redirect preserves incoming UTMs while binding referral to actual link owner', () => {
  assert.equal(typeof rules.affiliateDestination, 'function');
  const url = rules.affiliateDestination('https://mix10pro.com.br/lp-v2','AB12',new URLSearchParams('utm_source=google&utm_campaign=brand&utm_term=colageno&gclid=click&ref=OTHER'));
  assert.equal(url.searchParams.get('ref'),'AB12');
  assert.equal(url.searchParams.get('referralCode'),'AB12');
  assert.equal(url.searchParams.get('utm_source'),'google');
  assert.equal(url.searchParams.get('utm_medium'),'indicacao');
  assert.equal(url.searchParams.get('utm_term'),'colageno');
  assert.equal(url.searchParams.get('gclid'),'click');
});
