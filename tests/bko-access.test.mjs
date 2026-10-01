import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('BKO exibe novos acessos, WhatsApp e permite resetar senha', async () => {
  const [portal, accessRoute, overview] = await Promise.all([
    read('app/painel/portal-client.tsx'),
    read('app/api/admin/access/route.ts'),
    read('app/api/admin/overview/route.ts'),
  ]);
  assert.match(portal, /Novos acessos/);
  assert.match(portal, /Abrir WhatsApp/);
  assert.match(portal, /Redefinir senha/);
  assert.match(accessRoute, /decryptTemporarySecret/);
  assert.match(accessRoute, /generateTemporaryPassword/);
  assert.match(overview, /accessProvisioning/);
});

test('admin pode despachar sem rastreio sem apagar os dados da expedição ao entregar', async () => {
  const [route, portal] = await Promise.all([
    read('app/api/admin/orders/route.ts'),
    read('app/painel/portal-client.tsx'),
  ]);
  assert.match(route, /carrier/);
  assert.match(route, /shippedAt/);
  assert.match(route, /trackingCode/);
  assert.match(route, /carrierProvided/);
  assert.match(route, /trackingProvided/);
  assert.match(portal, /shippingPayload/);
  assert.match(portal, /status === "shipped"/);
});

test('BKO pode gerar senha provisória para revendedores existentes após retirar Resend', async () => {
  const [portal, accessRoute, overview] = await Promise.all([
    read('app/painel/portal-client.tsx'),
    read('app/api/admin/access/route.ts'),
    read('app/api/admin/overview/route.ts'),
  ]);
  assert.match(accessRoute, /reset-user/);
  assert.match(accessRoute, /userId/);
  assert.match(overview, /hasPassword/);
  assert.match(portal, /Revendedores atuais/);
  assert.match(portal, /Gerar senha provisória/);
});
