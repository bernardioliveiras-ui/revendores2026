import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.cwd());
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');

test('landing CMS persists text overrides only',()=>{
  const source=read('lib/content-studio.ts');
  assert.match(source,/TEXT-SAFE 0\.6\.0/);
  assert.match(source,/return \{ overrides \};/);
  const block=source.slice(source.indexOf('function sanitizeLandingDraft'),source.indexOf('export async function getStudioDoc'));
  assert.doesNotMatch(block,/styleOverrides:/);
  assert.doesNotMatch(block,/layoutOverrides:/);
  assert.doesNotMatch(block,/sectionInstances:/);
  assert.doesNotMatch(block,/elementClones:/);
});

test('runtime applies copy only and does not run visual-builder mutations',()=>{
  const source=read('components/content-runtime.tsx');
  assert.match(source,/type LandingContent = \{ overrides\?: Record<string, string> \}/);
  assert.doesNotMatch(source,/materializeSections\(/);
  assert.doesNotMatch(source,/applyEditableLayout\(/);
  assert.doesNotMatch(source,/installSectionToolbars\(/);
  assert.doesNotMatch(source,/dragstart/);
  assert.match(source,/clipboardData\?\.getData\("text\/plain"\)/);
});

test('brand tokens are reconstructed after plain text editing',()=>{
  const source=read('components/content-runtime.tsx');
  assert.match(source,/LORD\\s\*NUTRI\|MIX10\\s\*PRO/);
  assert.match(source,/className = "lnr-lord-name"/);
  assert.match(source,/className = "lnr-mix-name"/);
});

test('admin exposes text-safe editing instead of layout builder controls',()=>{
  const source=read('components/content-studio-admin.tsx');
  assert.match(source,/Editor de texto seguro/);
  assert.match(source,/Não existem mais controles de arrastar, duplicar, fonte, imagem ou posição/);
  assert.doesNotMatch(source,/Posição responsiva/);
  assert.doesNotMatch(source,/Duplicar seção/);
  assert.doesNotMatch(source,/Copiar estilo/);
});

test('top announcement bar is removed from the fixed briefing layout',()=>{
  const source=read('app/page.tsx');
  assert.doesNotMatch(source,/className="lnr-announce"/);
});

test('dynamic functional widgets are protected while static review copy stays editable',()=>{
  assert.match(read('components/checkout-form.tsx'),/data-cms-text-protected="1"/);
  assert.match(read('components/profit-simulator.tsx'),/data-cms-text-protected="1"/);
  const reviews=read('components/google-reviews.tsx');
  assert.match(reviews,/ln-google-score[\s\S]*data-cms-text-protected|data-cms-text-protected="1"[\s\S]*ln-google-score/);
  assert.match(reviews,/ln-review-grid" data-cms-text-protected="1"/);
  assert.match(reviews,/data-cms-explicit-key="text:avaliacoes:title"/);
  assert.match(reviews,/data-cms-explicit-key="text:avaliacoes:cta-product"/);
});
