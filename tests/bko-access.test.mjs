import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('BKO libera acesso, abre WhatsApp e permite resetar senha', async () => {
  const [portal, accessRoute, overview] = await Promise.all([
    read('app/painel/portal-client.tsx'),
    read('app/api/admin/access/route.ts'),
    read('app/api/admin/overview/route.ts'),
  ]);
  assert.match(portal, /Abrir WhatsApp/);
  assert.match(portal, /Gerar nova senha/);
  assert.match(accessRoute, /generateTemporaryPassword/);
  assert.match(accessRoute, /reset-password/);
  assert.match(overview, /pendingAccess/);
});

test('expedição atual usa purchases e preserva rastreio opcional', async () => {
  const [route, portal] = await Promise.all([
    read('app/api/admin/shipping/route.ts'),
    read('app/painel/portal-client.tsx'),
  ]);
  assert.match(route, /carrier/);
  assert.match(route, /trackingCode/);
  assert.match(route, /shippingStatus/);
  assert.match(portal, /Em separação/);
  assert.match(portal, /Despachado/);
  assert.match(portal, /Entregue/);
});
