import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.cwd());
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');

test('font-size control is proportional and bounded to preserve responsive briefing',()=>{
  const admin=read('components/content-studio-admin.tsx');
  const runtime=read('components/content-runtime.tsx');
  const server=read('lib/content-studio.ts');
  assert.match(admin,/Math\.min\(1\.4,Math\.max\(\.8/);
  assert.match(runtime,/Math\.min\(1\.4,Math\.max\(\.8/);
  assert.match(server,/Math\.min\(1\.4, Math\.max\(\.8/);
  assert.match(runtime,/getComputedStyle\(entry\.element\)\.fontSize/);
  assert.match(runtime,/window\.addEventListener\("resize", resizeHandler\)/);
});

test('font size is the only landing visual adjustment exposed in 0.6.1',()=>{
  const serverBlock=read('lib/content-studio.ts').slice(
    read('lib/content-studio.ts').indexOf('function sanitizeLandingDraft'),
    read('lib/content-studio.ts').indexOf('export async function getStudioDoc'),
  );
  assert.match(serverBlock,/fontScales/);
  assert.doesNotMatch(serverBlock,/layoutOverrides/);
  assert.doesNotMatch(serverBlock,/styleOverrides/);
  assert.doesNotMatch(serverBlock,/imageOverrides/);
  assert.doesNotMatch(serverBlock,/sectionOrder/);
});

test('reset removes both copy and size override for selected text',()=>{
  const source=read('components/content-studio-admin.tsx');
  const start=source.indexOf('function restoreSelected');
  const end=source.indexOf('function focusText',start);
  const block=source.slice(start,end);
  assert.match(block,/delete next\.overrides\[selection\.key\]/);
  assert.match(block,/delete next\.fontScales\[selection\.key\]/);
});
