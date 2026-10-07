import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

test('BKO exposes draft/publish studio for landing, manual, products and media', async()=>{
  const portal=await read('app/painel/portal-client.tsx');
  const studio=await read('components/content-studio-admin.tsx');
  const api=await read('app/api/admin/cms/[type]/route.ts');
  assert.match(portal,/Conteúdo/);
  for(const word of ['Landing Page','Manual','Produtos','Mídia','Salvar rascunho','Publicar']) assert.match(studio,new RegExp(word));
  assert.match(api,/publishStudioDoc/);
});

test('landing has runtime editable text/images and locked ANVISA process', async()=>{
  const runtime=await read('components/content-runtime.tsx');
  const page=await read('app/page.tsx');
  assert.match(runtime,/data\.cmsKey|dataset\.cmsKey/);
  assert.match(runtime,/imageOverrides/);
  assert.match(runtime,/2535115572620267/);
  assert.match(page,/2535115572620267/);
});

test('manual source has 22 editable pages and dynamic published PDF route', async()=>{
  const raw=JSON.parse(await read('data/manual-fields.json'));
  const route=await read('app/api/reseller/manual/route.ts');
  assert.equal(raw.pages.length,22);
  assert.ok(raw.fieldCount>400);
  assert.match(route,/buildManualPdf/);
  assert.match(route,/getStudioDoc\("manual"\)/);
});
