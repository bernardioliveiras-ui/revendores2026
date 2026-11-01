import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('Studio Builder is wired into the BKO', async () => {
  const portal = await read('app/painel/portal-client.tsx');
  assert.match(portal, /Studio LP/);
  assert.match(portal, /<LandingStudioBuilder/);
});

test('landing studio document is sanitized and persisted', async () => {
  const studio = await read('lib/content-studio.ts');
  assert.match(studio, /sanitizeStudioHtml/);
  assert.match(studio, /sanitizeStudioStyles/);
  assert.match(studio, /studio = sanitizeStudioConfig/);
  assert.match(studio, /javascript:/i);
});

test('public landing can switch to the published Studio document', async () => {
  const page = await read('app/page.tsx');
  assert.match(page, /studio_source === "base"/);
  assert.match(page, /StudioPublishedLanding/);
  assert.match(page, /published\?\.studio\?\.enabled/);
});

test('protected business components remain React components', async () => {
  const renderer = await read('components/studio-published-landing.tsx');
  assert.match(renderer, /<CheckoutForm/);
  assert.match(renderer, /<ProfitSimulator/);
  assert.match(renderer, /<GoogleReviewsDynamic/);
});

test('Google reviews section has only the Google CTA', async () => {
  const reviews = await read('components/google-reviews.tsx');
  assert.match(reviews, /VER AVALIAÇÕES NO GOOGLE/);
  assert.doesNotMatch(reviews, /mix10pro\.com\.br\/lp-v2/);
  assert.doesNotMatch(reviews, /QUERO CONHECER 1 UNIDADE PRIMEIRO/);
});

test('commercial and regulatory constants were preserved', async () => {
  const page = await read('app/page.tsx');
  assert.match(page, /2535115572620267/);
  assert.match(page, /R\$ 1\.498,00/);
  assert.match(page, /R\$ 3\.495,00/);
});

test('Studio supports full visual operations without DOM-path identity', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /data-studio-id/);
  assert.match(builder, /\+ Texto/);
  assert.match(builder, /\+ Imagem/);
  assert.match(builder, /Duplicar/);
  assert.match(builder, /Estrutura da LP/);
  assert.match(builder, /fluxo responsivo/i);
  assert.doesNotMatch(builder, /Ativar posição livre/);
  assert.match(builder, /Desktop/);
  assert.match(builder, /Tablet/);
  assert.match(builder, /Celular/);
  assert.doesNotMatch(builder, /domPath\s*\(/);
});
