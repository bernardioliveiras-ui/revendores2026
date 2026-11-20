import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const published = fs.readFileSync('components/studio-published-landing.tsx','utf8');
const css = fs.readFileSync('app/landing.css','utf8');
const page = fs.readFileSync('app/page.tsx','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));

test('1.7 publica checkout fora do HTML editável do Studio', () => {
  assert.match(published, /checkout sai definitivamente do HTML editável do Studio/);
  assert.match(published, /<CheckoutForm \/>/);
  assert.match(published, /querySelectorAll\("script,style,noscript,\.lnr-proof-section,#checkout"\)/);
});

test('1.7 não injeta styles do Studio na página publicada', () => {
  assert.doesNotMatch(published, /useMemo\(\(\) => buildStudioCss/);
  assert.match(published, /styles: _styles/);
});

test('layout recovery tem regras para desktop e celular', () => {
  assert.match(css, /1\.7\.0 — LAYOUT RECOVERY/);
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(css, /#checkout \.lnr-checkout-layout/);
});

test('navegação não aponta para seção de avaliações removida', () => {
  assert.doesNotMatch(page, /href="#avaliacoes"/);
});

test('versão é 1.7.0', () => {
  assert.equal(pkg.version, '1.7.0');
});
