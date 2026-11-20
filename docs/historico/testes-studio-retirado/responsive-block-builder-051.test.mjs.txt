import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),"utf8");

test("0.5.1 duplicates composite groups such as number plus label", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  const admin=await read("components/content-studio-admin.tsx");
  assert.match(runtime,/materializeGroupClones/);
  assert.match(runtime,/nearestGroup/);
  assert.match(runtime,/▦ conjunto/);
  assert.match(admin,/groupClones/);
  assert.match(admin,/Conjunto duplicado com número, texto e formatação/);
});

test("0.5.1 allows cross-section drag and free movement", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  assert.match(runtime,/targetSectionId/);
  assert.match(runtime,/position:"append"/);
  assert.match(runtime,/lordnutri-cms-free-move/);
  assert.match(runtime,/cms-element-free-runtime/);
});

test("0.5.1 stores separate responsive layout for desktop tablet and mobile", async()=>{
  const admin=await read("components/content-studio-admin.tsx");
  const runtime=await read("components/content-runtime.tsx");
  const studio=await read("lib/content-studio.ts");
  assert.match(admin,/responsiveLayoutOverrides/);
  assert.match(admin,/Posição responsiva/);
  assert.match(runtime,/mergedResponsiveLayout/);
  assert.match(runtime,/cms_device/);
  assert.match(studio,/sanitizeResponsiveLayoutOverrides/);
});

test("group state stays sanitized instead of persisting arbitrary html", async()=>{
  const studio=await read("lib/content-studio.ts");
  assert.match(studio,/sanitizeGroupClones/);
  assert.match(studio,/\^\(text\|rich\|image\|group\):/);
  assert.doesNotMatch(studio,/dangerouslySetInnerHTML/);
});
