import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('KIT20 permanece e KIT50 substitui KIT30 nas novas ofertas', async () => {
  const [landing, ordersApi, portal, kits] = await Promise.all([
    read('app/page.tsx'),
    read('app/api/orders/route.ts'),
    read('app/painel/portal-client.tsx'),
    read('lib/kits.ts'),
  ]);
  assert.match(landing, /KIT20/);
  assert.match(landing, /KIT50/);
  assert.match(landing, /R\$ 3\.495,00/);
  assert.match(ordersApi, /INITIAL_KITS/);
  assert.match(kits, /kit50/);
  assert.match(kits, /349500/);
  assert.doesNotMatch(landing, /Escolher KIT30/);
  assert.match(portal, /Caixas em estoque/);
  assert.match(portal, /Cliques em indicações/);
});

test('continua preparado para Hostinger Node 22 + MySQL', async () => {
  const [pkg, deploy] = await Promise.all([read('package.json'), read('HOSTINGER-DEPLOY.md')]);
  assert.match(pkg, /"node": "22\.x"/);
  assert.match(pkg, /"mysql2"/);
  assert.match(deploy, /Hostinger/i);
});
