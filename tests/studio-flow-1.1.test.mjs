import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('Studio Flow 1.1 removes absolute-position editing', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  const server = await read('lib/content-studio.ts');
  assert.match(builder, /Studio .*Flow/);
  assert.match(builder, /normalizeFlowStyles/);
  assert.match(builder, /flowBlockedProperties/);
  assert.doesNotMatch(builder, /toggleFreePosition/);
  const studioAllowed = server.slice(server.indexOf('const allowedStudioStyleKeys'), server.indexOf('function sanitizeStudioHtml'));
  assert.doesNotMatch(studioAllowed, /"position"/);
  assert.doesNotMatch(studioAllowed, /"left"/);
  assert.doesNotMatch(studioAllowed, /"top"/);
});

test('visual style overrides win against the base landing CSS', async () => {
  const renderer = await read('components/studio-published-landing.tsx');
  assert.match(renderer, /\$\{value\}!important/);
});

test('easy editor exposes color, font size, alignment and flow movement', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /type="color"/);
  assert.match(builder, /changeFontSize/);
  assert.match(builder, /Centralizar no bloco/);
  assert.match(builder, /dragstart/);
  assert.match(builder, /dragover/);
  assert.match(builder, /drop/);
  assert.match(builder, /Elemento movido no fluxo/);
});

test('duplicating an element regenerates Studio IDs and copies styles', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /const newId = makeId\(\)/);
  assert.match(builder, /styleCopies/);
  assert.match(builder, /copy\.setAttribute\("data-studio-id", newId\)/);
});

test('commercial and regulatory constants remain preserved', async () => {
  const page = await read('app/page.tsx');
  assert.match(page, /2535115572620267/);
  assert.match(page, /R\$ 1\.498,00/);
  assert.match(page, /R\$ 3\.495,00/);
});
