import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Studio 1.4 exposes only Computer and Mobile editing modes', async () => {
  const builder = await read('components/landing-studio-builder.tsx');
  assert.match(builder, /label: "Computador"/);
  assert.match(builder, /label: "Celular"/);
  const devicesBlock = builder.slice(builder.indexOf('const devices'), builder.indexOf('const textTags'));
  assert.doesNotMatch(devicesBlock, /Tablet/);
  assert.match(builder, /viewport: 1366/);
  assert.match(builder, /viewport: 390/);
  assert.match(builder, /ResizeObserver/);
});

test('published Studio uses same mobile breakpoint as the landing base', async () => {
  const renderer = await read('components/studio-published-landing.tsx');
  assert.match(renderer, /@media\(max-width:700px\)/);
  assert.doesNotMatch(renderer, /max-width:980px/);
  assert.doesNotMatch(renderer, /devices\.tablet/);
});

test('server sanitizer drops legacy tablet Studio overrides', async () => {
  const server = await read('lib/content-studio.ts');
  const block = server.slice(server.indexOf('function sanitizeStudioStyles'), server.indexOf('function sanitizeStudioConfig'));
  assert.match(block, /\["desktop", "mobile"\]/);
  assert.doesNotMatch(block, /tablet/);
  assert.match(server, /version: "1\.4"/);
});

test('BKO accepts welcome video and portal reads published media config', async () => {
  const admin = await read('components/content-studio-admin.tsx');
  const mediaRoute = await read('app/api/admin/media/route.ts');
  const portalPage = await read('app/painel/page.tsx');
  const video = await read('components/welcome-video.tsx');
  assert.match(admin, /Vídeo da aba Boas Vindas/);
  assert.match(admin, /Usar em Boas Vindas/);
  assert.match(mediaRoute, /video\/mp4/);
  assert.match(portalPage, /welcomeVideoUrl/);
  assert.match(portalPage, /getStudioDoc\("media"\)/);
  assert.match(video, /youtube-nocookie\.com\/embed/);
  assert.match(video, /player\.vimeo\.com\/video/);
});
