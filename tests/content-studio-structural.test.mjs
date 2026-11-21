import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

test('BKO keeps draft and publication for manual, products and media', async()=>{
  const portal=await read('app/painel/portal-client.tsx');
  const studio=await read('components/content-studio-admin.tsx');
  const api=await read('app/api/admin/cms/[type]/route.ts');
  assert.match(portal,/Conteúdo/);
  for(const word of ['Manual','Produtos','Mídia','Salvar rascunho','Publicar']) assert.match(studio,new RegExp(word));
  assert.match(api,/publishStudioDoc/);
});


test('manual source has 22 editable pages and dynamic published PDF route', async()=>{
  const raw=JSON.parse(await read('data/manual-fields.json'));
  const route=await read('app/api/reseller/manual/route.ts');
  assert.equal(raw.pages.length,22);
  assert.ok(raw.fieldCount>400);
  assert.match(route,/buildManualPdf/);
  assert.match(route,/getStudioDoc\("manual"\)/);
});

test('BKO accepts welcome video and portal reads published media config', async () => {
  const admin = await read('components/content-studio-admin.tsx');
  const mediaRoute = await read('app/api/admin/media/route.ts');
  const portalPage = await read('components/member-dashboard.tsx');
  const video = await read('components/welcome-video.tsx');
  assert.match(admin, /Vídeo da aba Boas Vindas/);
  assert.match(admin, /Usar em Boas Vindas/);
  assert.match(mediaRoute, /video\/mp4/);
  assert.match(portalPage, /welcomeVideoUrl/);
  assert.match(portalPage, /getStudioDoc\("media"\)/);
  assert.match(video, /youtube-nocookie\.com\/embed/);
  assert.match(video, /player\.vimeo\.com\/video/);
});
