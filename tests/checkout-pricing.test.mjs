import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { calculateInstallmentPrice, INSTALLMENT_RULES } from '../lib/installments.ts';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFile(join(root, p), 'utf8');

test('revendedor checkout uses 2.99% Price table up to 6 installments', () => {
  assert.equal(INSTALLMENT_RULES.maxInstallments, 6);
  assert.equal(INSTALLMENT_RULES.monthlyInterestRate, 0.0299);
  const cash = calculateInstallmentPrice(154650, 1);
  assert.equal(cash.chargedValueCents, 154650);
  assert.equal(cash.interestValueCents, 0);
  const six = calculateInstallmentPrice(154650, 6);
  assert.equal(six.installments, 6);
  assert.ok(six.chargedValueCents > 154650);
  assert.equal(six.chargedValueCents, six.installmentValueCents * 6);
});

test('shipping logic preserves institutional CEP table and Correios choices', async () => {
  const shipping = await read('lib/shipping.ts');
  const rates = await read('lib/shipping-rates.ts');
  assert.match(shipping, /Correios · Econômica/);
  assert.match(shipping, /Correios · Expressa/);
  assert.match(shipping, /Math\.max\(region\.economical, 25\.8\)/);
  assert.match(rates, /Grande São Paulo/);
  assert.match(rates, /Fallback Interior RN/);
});

test('checkout backend recalculates product, freight and card interest server-side', async () => {
  const route = await read('app/api/public/checkout/route.ts');
  assert.match(route, /getShippingOption\(data\.postalCode, kit\.boxes, shippingType\)/);
  assert.match(route, /calculateInstallmentPrice\(baseCents, installments\)/);
  assert.match(route, /productTotalCents/);
  assert.match(route, /shippingCents/);
  assert.match(route, /interestCents/);
  assert.doesNotMatch(route, /payload\.(shippingCents|interestCents|chargedCents|totalCents|productTotalCents)/);
});

test('Asaas receives PIX cash value or fixed card installment amount', async () => {
  const asaas = await read('lib/asaas.ts');
  assert.match(asaas, /billingType: "PIX" \| "CREDIT_CARD"/);
  assert.match(asaas, /installmentCount: input\.installments/);
  assert.match(asaas, /installmentValue: input\.installmentValueCents \/ 100/);
  assert.match(asaas, /value: input\.chargedValueCents \/ 100/);
});

test('BKO exposes freight, card increment and charged total', async () => {
  const portal = await read('app/painel/portal-client.tsx');
  const overview = await read('app/api/admin/overview/route.ts');
  assert.match(portal, /Frete cobrado/);
  assert.match(portal, /Acréscimos cartão/);
  assert.match(portal, /Total cobrado/);
  assert.match(overview, /shippingRevenueCents/);
  assert.match(overview, /interestRevenueCents/);
  assert.match(overview, /orderRevenueCents/);
});
