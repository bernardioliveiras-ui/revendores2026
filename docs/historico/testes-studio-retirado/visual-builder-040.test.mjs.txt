import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),"utf8");

test("visual builder supports undo redo, style copy and live preview", async()=>{
  const admin=await read("components/content-studio-admin.tsx");
  assert.match(admin,/Desfazer/);
  assert.match(admin,/Refazer/);
  assert.match(admin,/Copiar estilo/);
  assert.match(admin,/Colar estilo/);
  assert.match(admin,/lordnutri-cms-live/);
});

test("brand tokens render in any editable text", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  assert.match(runtime,/copiar\/colar "MIX10 PRO"/);
  assert.match(runtime,/appendBrandTokens/);
  assert.match(runtime,/renderText\(entry\.element/);
});

test("landing draft stores safe typography and section order", async()=>{
  const studio=await read("lib/content-studio.ts");
  assert.match(studio,/styleOverrides/);
  assert.match(studio,/sectionOrder/);
  assert.match(studio,/allowedStyleKeys/);
  assert.match(studio,/sanitizeSectionOrder/);
});

test("sections can be reordered like slides", async()=>{
  const admin=await read("components/content-studio-admin.tsx");
  const runtime=await read("components/content-runtime.tsx");
  assert.match(admin,/Seções \/ slides/);
  assert.match(admin,/draggable/);
  assert.match(runtime,/applySectionOrder/);
});
