import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('checkout público oferece KIT20 e KIT50 e cria compra em purchases com preço de servidor', async () => {
  const [route, kits, landing] = await Promise.all([
    read('app/api/public/checkout/route.ts'),
    read('lib/kits.ts'),
    read('app/page.tsx'),
  ]);
  assert.match(route, /purchases/);
  assert.match(route, /getKit\(payload\.kit\)/);
  assert.match(kits, /kit20/);
  assert.match(kits, /149800/);
  assert.match(kits, /kit50/);
  assert.match(kits, /349500/);
  assert.match(landing, /\?kit=kit20#checkout/);
  assert.match(landing, /\?kit=kit50#checkout/);
});
