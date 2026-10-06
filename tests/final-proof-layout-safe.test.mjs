import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

test('landing includes Google proof and institutional single-unit path', async()=>{
  const page=await read('app/page.tsx');
  const reviews=await read('components/google-reviews.tsx');
  assert.match(page,/GoogleReviews/);
  assert.match(page,/avaliacoes/);
  assert.match(reviews,/https:\/\/share\.google\/TfuQVPuf9zfS1dzj7/);
  assert.match(reviews,/https:\/\/mix10pro\.com\.br\/lp-v2/);
  assert.match(reviews,/Sueli/);
  assert.match(reviews,/Henrique Jose Freitas/i);
});

test('people photos are composited without rectangular cards', async()=>{
  const css=await read('app/landing.css');
  assert.match(css,/0\.3\.3 — pessoas integradas/);
  assert.match(css,/\.lnr-page \.lnr-people-visual\{[^}]*overflow:hidden/i);
  assert.match(css,/\.lnr-page \.lnr-people-visual img\{[^}]*border-radius:0!important/i);
  assert.match(css,/\.lnr-page \.lnr-care-band\{[^}]*border:0!important/i);
});

test('CMS exposes only layout-safe text leaves while keeping saved overrides compatible', async()=>{
  const runtime=await read('components/content-runtime.tsx');
  const studio=await read('components/content-studio-admin.tsx');
  assert.match(runtime,/isTextLeaf/);
  assert.match(runtime,/ownTextNodes\[0\]\.textContent = overrides\[key\]/);
  assert.match(runtime,/cmsLayoutSafe/);
  assert.match(runtime,/renderBrandRichText/);
  assert.match(runtime,/rich:/);
  assert.match(studio,/preserva classes, ícones, cores, espaçamentos/);
  assert.match(studio,/previewVersion/);
});
