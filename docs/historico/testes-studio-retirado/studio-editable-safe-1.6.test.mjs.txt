import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('checkout is forced visible after user Studio styles and a missing slot is recreated', async () => {
  const renderer = await read('components/studio-published-landing.tsx');
  assert.match(renderer, /criticalSafetyCss/);
  assert.match(renderer, /display:block!important;visibility:visible!important;opacity:1!important/);
  assert.match(renderer, /function makeProtectedTarget/);
  assert.match(renderer, /if \(!section\) \{/);
  assert.match(renderer, /root\.insertBefore\(section, footer\)/);
  assert.match(renderer, /createPortal\(<CheckoutForm \/>/);
});

test('containers containing protected slots can still receive normal editable content', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /if \(parent\.closest\("\[data-ln-protected\]"\)\) return false/);
  assert.doesNotMatch(builder, /parent\.closest\("\[data-ln-protected\]"\) \|\| isStructureLocked\(parent\)/);
  assert.match(builder, /selected\.isContainer && !selected\.protected/);
});

test('editor can clear and rebuild a section while preserving protected functions', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /const clearEditableContents/);
  assert.match(builder, /if \(childEl\.hasAttribute\("data-ln-protected"\)\) continue/);
  assert.match(builder, /Limpar conteúdo editável deste bloco/);
  assert.match(builder, /\+ Título/);
});

test('common rich text with inline emphasis and line breaks remains editable', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /inlineSafeTags/);
  assert.match(builder, /"BR", "SPAN", "STRONG", "EM"/);
});

test('version is bumped to 1.6.0', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  const server = await read('lib/content-studio.ts');
  const pkg = JSON.parse(await read('package.json'));
  assert.match(builder, /version: "1\.6"/);
  assert.match(server, /version: "1\.6"/);
  assert.equal(pkg.version, '1.6.0');
});
