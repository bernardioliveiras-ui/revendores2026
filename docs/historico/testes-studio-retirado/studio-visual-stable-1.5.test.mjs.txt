import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('desktop and mobile overrides are isolated by real public breakpoints', async () => {
  const renderer = await read('components/studio-published-landing.tsx');
  assert.match(renderer, /@media\(min-width:701px\)/);
  assert.match(renderer, /@media\(max-width:700px\)/);
  assert.match(renderer, /studioBlockedLayoutProps/);
  assert.match(renderer, /vw\|vh\|vmin\|vmax/);
});

test('checkout has portal plus runtime fallback if the published slot does not mount', async () => {
  const renderer = await read('components/studio-published-landing.tsx');
  assert.match(renderer, /createPortal\(<CheckoutForm \/>/);
  assert.match(renderer, /querySelector\("form\.checkout-card"\)/);
  assert.match(renderer, /data-ln-runtime-recovery="checkout"/);
  assert.match(renderer, /Antes de pagar, você vê o valor dos produtos, o frete e as condições de parcelamento\./);
});

test('visual stabilization keeps the LP inside a single centered axis', async () => {
  const css = await read('app/landing.css');
  assert.match(css, /1\.5\.0 — VISUAL STABLE/);
  assert.match(css, /overflow-x:clip/);
  assert.match(css, /width:min\(1120px,calc\(100% - 48px\)\)!important/);
  assert.match(css, /animation:none!important/);
  assert.match(css, /lnr-opportunity-intro[\s\S]*grid-template-columns:minmax\(0,1\.05fr\)/);
  assert.match(css, /lnr-checkout-layout[\s\S]*grid-template-columns:minmax\(250px,\.72fr\)/);
});

test('Studio stores version 1.5 and blocks geometry that causes layout drift', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  const server = await read('lib/content-studio.ts');
  assert.match(builder, /version: "1\.5"/);
  assert.match(server, /version: "1\.5"/);
  assert.match(builder, /"minWidth", "height", "minHeight", "maxHeight"/);
  const allowed = server.slice(server.indexOf('const allowedStudioStyleKeys'), server.indexOf('function sanitizeStudioHtml'));
  assert.doesNotMatch(allowed, /"minWidth"/);
  assert.doesNotMatch(allowed, /"gridColumn"/);
  assert.doesNotMatch(allowed, /"order"/);
});
