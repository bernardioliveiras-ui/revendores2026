import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('critical business blocks lock their own structure and ancestors', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /function isStructureLocked/);
  assert.match(builder, /protectedDescendant/);
  assert.match(builder, /selected\?\.lockedStructure/);
  assert.match(builder, /draggable=\{!layer\.lockedStructure\}/);
  assert.match(builder, /Esse bloco contém uma função crítica e não pode ser excluído/);
});

test('Studio refuses to save a canvas that lost or duplicated critical slots', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  const server = await read('lib/content-studio.ts');
  assert.match(builder, /criticalStatusFromRoot/);
  assert.match(builder, /Publicação bloqueada por segurança/);
  assert.match(server, /requiredStudioProtectedSlots/);
  assert.match(server, /assertStudioCriticalIntegrity/);
  assert.match(server, /Studio bloqueou a operação por segurança/);
});

test('old broken Studio drafts are repaired from the canonical landing regions', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /repairCriticalHtml/);
  assert.match(builder, /restoreRegion\("checkout", "#checkout", "#checkout", "footer"\)/);
  assert.match(builder, /restoreRegion\("simulator", "#simulador", "#simulador", "#kits"\)/);
  assert.match(builder, /restoreRegion\("google-dynamic", "\.lnr-proof-section"/);
});

test('public landing has runtime safety recovery for checkout, simulator and Google reviews', async () => {
  const renderer = await read('components/studio-published-landing.tsx');
  assert.match(renderer, /data-ln-runtime-recovery="checkout"/);
  assert.match(renderer, /data-ln-runtime-recovery="simulator"/);
  assert.match(renderer, /data-ln-runtime-recovery="google"/);
  assert.match(renderer, /<CheckoutForm/);
  assert.match(renderer, /<ProfitSimulator/);
  assert.match(renderer, /<GoogleReviews/);
});

test('Safe Flow keeps free X-Y positioning blocked and bumps Studio version', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  const server = await read('lib/content-studio.ts');
  const pkg = JSON.parse(await read('package.json'));
  assert.match(builder, /version: "1\.4"/);
  assert.match(server, /version: "1\.4"/);
  assert.equal(pkg.version, '1.4.0');
  const studioAllowed = server.slice(server.indexOf('const allowedStudioStyleKeys'), server.indexOf('function sanitizeStudioHtml'));
  assert.doesNotMatch(studioAllowed, /"position"/);
  assert.doesNotMatch(studioAllowed, /"left"/);
  assert.doesNotMatch(studioAllowed, /"top"/);
});
