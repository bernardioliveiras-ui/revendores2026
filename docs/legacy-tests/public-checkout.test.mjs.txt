import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('checkout público oferece KIT20 e KIT50 e cria compra initial com preço de servidor', async () => {
  const [route, kits, landing] = await Promise.all([
    read('app/api/public/checkout/route.ts'),
    read('lib/kits.ts'),
    read('app/page.tsx'),
  ]);
  assert.match(route, /initialPurchases/);
  assert.match(route, /INITIAL_KITS/);
  assert.match(kits, /kit20/);
  assert.match(kits, /149980/);
  assert.match(kits, /kit50/);
  assert.match(kits, /349500/);
  assert.match(landing, /\/comprar\?kit=/);
});
