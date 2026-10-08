import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('Nested Flow allows dropping elements inside cards and across containers', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /type FlowDropMode = "before" \| "after" \| "inside"/);
  assert.match(builder, /canAcceptFlowChild/);
  assert.match(builder, /target\.appendChild\(flowDrag\.el\)/);
  assert.match(builder, /Elemento movido para dentro do bloco/);
  assert.doesNotMatch(builder, /target\.parentElement !== flowDrag\.el\.parentElement/);
});

test('new elements are inserted in the selected container instead of the outer shell', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /resolveInsertTarget/);
  assert.match(builder, /if \(isFlowContainer\(selectedEl\)\) return selectedEl/);
  assert.match(builder, /Adicionar dentro deste bloco/);
  assert.match(builder, /Elemento adicionado dentro do bloco selecionado/);
});

test('editor exposes a ready-made revenue highlight and reusable block', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /\+ Destaque/);
  assert.match(builder, /R\$ 10 mil\/mês/);
  assert.match(builder, /\+ Bloco/);
  assert.match(builder, /ln-studio-block/);
});

test('protected business components can move as whole blocks but internals stay protected', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  const renderer = await read('components/studio-published-landing.tsx');
  assert.match(builder, /actual\.setAttribute\("draggable", "true"\)/);
  assert.match(builder, /selected\.protected/);
  assert.match(renderer, /<CheckoutForm/);
  assert.match(renderer, /<ProfitSimulator/);
  assert.match(renderer, /<GoogleReviewsDynamic/);
});

test('Studio document is persisted as version 1.2 and free positioning remains blocked', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  const server = await read('lib/content-studio.ts');
  assert.match(builder, /version: "1\.2"/);
  assert.match(server, /version: "1\.2"/);
  const studioAllowed = server.slice(server.indexOf('const allowedStudioStyleKeys'), server.indexOf('function sanitizeStudioHtml'));
  assert.doesNotMatch(studioAllowed, /"position"/);
  assert.doesNotMatch(studioAllowed, /"left"/);
  assert.doesNotMatch(studioAllowed, /"top"/);
});
