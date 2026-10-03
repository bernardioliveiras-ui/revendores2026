import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { KITS, getKit } from '../lib/kits.ts';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFile(join(root, p), 'utf8');

test('kit helper owns authoritative prices', () => {
  assert.equal(getKit('kit20')?.totalCents, 149800);
  assert.equal(getKit('kit50')?.totalCents, 349500);
  assert.equal(getKit('kit30'), null);
  assert.equal(KITS.kit50.unitPriceCents, 6990);
});

test('landing preserves the product, reseller journey, calculator and purchasing flow', async () => {
  const page = await read('app/page.tsx');
  for (const id of ['inicio', 'mix10pro', 'como-funciona', 'simulador', 'kits', 'checkout']) {
    assert.ok(page.includes(`id="${id}"`), `Missing section ${id}`);
  }
  assert.match(page, /ProfitSimulator/);
  assert.match(page, /CheckoutForm/);
  assert.match(page, /KitLink kit="kit20"/);
  assert.match(page, /KitLink kit="kit50"/);
  assert.match(page, /MIX10PRO/);
  assert.doesNotMatch(page, /mix10-gallery|mix10-trio|mix10-box/);
});

test('public checkout collects reseller data, calculates freight and never accepts client price fields', async () => {
  const form = await read('components/checkout-form.tsx');
  for (const field of ['name','email','phone','cpfCnpj','postalCode','street','number','district','city','state']) {
    assert.match(form, new RegExp(`name=["']${field}["']`));
  }
  assert.match(form, /\/api\/public\/quote/);
  assert.match(form, /shippingType/);
  assert.match(form, /paymentMethod/);
  assert.match(form, /Taxa de parcelamento/);
  assert.match(form, /até 6x/i);

  const route = await read('app/api/public/checkout/route.ts');
  assert.match(route, /getKit\(payload\.kit\)/);
  assert.match(route, /calculateShipping\(data\.postalCode, kit\.boxes\)/);
  assert.match(route, /calculateInstallment\(baseCents, installments\)/);
  assert.doesNotMatch(route, /payload\.(total|totalCents|unitPrice|unitPriceCents|price|shippingCents|interestCents)/);
  assert.match(route, /createPayment/);
});

test('checkout pricing preserves recovered freight table and 2.99 percent monthly installment rule', async () => {
  const pricing = await read('lib/checkout/pricing.ts');
  const rates = await read('lib/checkout/shipping-rates.ts');
  assert.match(pricing, /MAX_CARD_INSTALLMENTS = 6/);
  assert.match(pricing, /MONTHLY_INSTALLMENT_RATE = 0\.0299/);
  assert.match(pricing, /Math\.max\(region\.economical, 25\.8\)/);
  assert.match(pricing, /Math\.max\(region\.express, 27\.6\)/);
  assert.match(rates, /ZONE_METRO_G1/);
  assert.match(rates, /ZONE_FALLBACK_RN/);
});

test('hostinger build opts out of default turbopack and database stores checkout breakdown', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.scripts.build, 'next build --webpack');
  const schema = await read('database/schema.sql');
  for (const column of ['product_total_cents','shipping_type','shipping_cents','payment_method','installments','installment_value_cents','interest_cents']) {
    assert.match(schema, new RegExp('`' + column + '`'));
  }
  const migration = await read('scripts/migration-core.mjs');
  assert.match(migration, /product_total_cents/);
  assert.match(migration, /interest_cents/);
});
