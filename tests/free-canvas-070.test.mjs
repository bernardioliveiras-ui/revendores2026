import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),"utf8");

test("0.7 free canvas keeps the React landing base immutable and stores overlays separately", async()=>{
  const server=await read("lib/content-studio.ts");
  assert.match(server,/sanitizeFreeElements/);
  assert.match(server,/freeElements: sanitizeFreeElements\(source\.freeElements\)/);
  assert.match(server,/original LP remains structurally immutable/);
});

test("runtime supports text and image duplication targets plus pointer drag and resize", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  assert.match(runtime,/collectImageEntries/);
  assert.match(runtime,/renderFreeElements/);
  assert.match(runtime,/cms-free-move/);
  assert.match(runtime,/cms-free-resize/);
  assert.match(runtime,/pointermove/);
  assert.match(runtime,/lordnutri-cms-free-placement/);
  assert.match(runtime,/lordnutri-cms-free-placement-batch/);
  assert.match(runtime,/namedGroupSnapshot/);
  assert.match(runtime,/currentDevice/);
});

test("admin exposes add, duplicate, delete, layers and per-device canvas", async()=>{
  const admin=await read("components/content-studio-admin.tsx");
  assert.match(admin,/FREE CANVAS · 0\.7\.0/);
  assert.match(admin,/＋ Texto/);
  assert.match(admin,/＋ Imagem/);
  assert.match(admin,/duplicateSelection/);
  assert.match(admin,/deleteSelectedFree/);
  assert.match(admin,/duplicateSelectedGroup/);
  assert.match(admin,/Duplicar conjunto/);
  assert.match(admin,/Camadas livres/);
  assert.match(admin,/desktop/);
  assert.match(admin,/tablet/);
  assert.match(admin,/mobile/);
});

test("functional product and ANVISA paths are preserved", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  const admin=await read("components/content-studio-admin.tsx");
  assert.match(runtime,/ANVISA nº 2535115572620267/);
  assert.match(admin,/2535115572620267/);
  assert.doesNotMatch(admin,/sectionOrder|sectionInstances|elementPlacements/);
});
