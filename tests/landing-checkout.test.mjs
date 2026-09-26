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

test('landing page follows the approved briefing structure and VSL', async () => {
  const page = await read('app/page.tsx');
  for (const copy of [
    'Com a LORDNUTRI você pode!',
    'Sua revenda LORDNUTRI em 3 passos',
    'Uma oportunidade em um mercado',
    'Por que escolher MIX10 PRO',
    '5 motivos para revender MIX10 PRO',
    'Quanto você quer construir de ganho bruto por mês?',
    'KIT20',
    'KIT50',
    'Isso é multinível?'
  ]) assert.match(page, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  assert.match(page, /vsl-mix10\.mp4/);
});

test('public checkout collects reseller and shipping data and never accepts price fields', async () => {
  const form = await read('components/checkout-form.tsx');
  for (const field of ['name','email','phone','cpfCnpj','postalCode','street','number','district','city','state']) {
    assert.match(form, new RegExp(`name=["']${field}["']`));
  }
  const route = await read('app/api/public/checkout/route.ts');
  assert.match(route, /getKit\(payload\.kit\)/);
  assert.doesNotMatch(route, /payload\.(total|totalCents|unitPrice|unitPriceCents|price)/);
  assert.match(route, /createPayment/);
});
