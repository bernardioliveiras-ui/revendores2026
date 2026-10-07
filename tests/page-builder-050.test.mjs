import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),"utf8");

test("0.5 builder exposes drag, duplicate, hide and block library", async()=>{
  const admin=await read("components/content-studio-admin.tsx");
  assert.match(admin,/duplicateSection/);
  assert.match(admin,/duplicateSelectedElement/);
  assert.match(admin,/moveElement/);
  assert.match(admin,/addCustomBlock/);
  assert.match(admin,/Camadas \/ seções/);
  assert.match(admin,/Adicionar bloco/);
  assert.match(admin,/Desfazer/);
  assert.match(admin,/Refazer/);
});

test("runtime materializes section and element clones and supports drag drop", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  assert.match(runtime,/materializeSections/);
  assert.match(runtime,/materializeElementClones/);
  assert.match(runtime,/materializeCustomBlocks/);
  assert.match(runtime,/applyElementPlacements/);
  assert.match(runtime,/cms-section-drag-runtime/);
  assert.match(runtime,/cms-element-drag-runtime/);
  assert.match(runtime,/lordnutri-cms-element-drop/);
});

test("server sanitizes page builder state", async()=>{
  const studio=await read("lib/content-studio.ts");
  assert.match(studio,/sanitizeSectionInstances/);
  assert.match(studio,/sanitizeElementClones/);
  assert.match(studio,/sanitizeElementPlacements/);
  assert.match(studio,/sanitizeCustomBlocks/);
  assert.match(studio,/hiddenElements/);
});

test("functional sections stay protected", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  assert.match(runtime,/duplicateBlockedSections = new Set\(\["simulador", "checkout"\]\)/);
});
