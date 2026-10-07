import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const runtime = await readFile(new URL('../components/content-runtime.tsx', import.meta.url), 'utf8');
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const admin = await readFile(new URL('../components/content-studio-admin.tsx', import.meta.url), 'utf8');
test('group children use stable semantic identity instead of section position',()=>{
  assert.match(runtime,/closest<HTMLElement>\("\[data-cms-group\]"\)/);
  assert.match(runtime,/groupName/);
  assert.match(runtime,/domPath\(element, namedGroup\)/);
});
test('landing exposes named groups and dropzones across editable commercial blocks',()=>{
  for (const token of ['product-facts','benefit-grid','model-facts','steps','scenarios','kit-grid','faq-list']) assert.match(page,new RegExp(`data-cms-dropzone="${token}"`));
  for (const token of ['product-fact-30','care-band','kit20-card','kit50-card']) assert.match(page,new RegExp(`data-cms-group="${token}"`));
});
test('builder keeps undo redo duplicate hide and responsive layout controls',()=>{
  for (const token of ['Desfazer','Refazer','Duplicar','Ocultar','Posição responsiva']) assert.match(admin,new RegExp(token));
  assert.match(admin,/desktop/); assert.match(admin,/tablet/); assert.match(admin,/mobile/);
});
