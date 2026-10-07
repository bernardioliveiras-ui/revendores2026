import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),"utf8");

test("0.5.2 gives the 30 plus label block a permanent group identity", async()=>{
  const page=await read("app/page.tsx");
  assert.match(page,/data-cms-group="product-fact-30"/);
  assert.match(page,/text:mix10pro:product-fact-30-number/);
  assert.match(page,/text:mix10pro:product-fact-30-label/);
});

test("0.5.2 discovers only explicit groups instead of guessing DOM containers", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  assert.match(runtime,/Boolean\(element\.dataset\.cmsGroup \|\| element\.dataset\.cmsGroupExplicitKey \|\| element\.dataset\.cmsGroupCloneId\)/);
  assert.match(runtime,/const explicitName = element\.dataset\.cmsGroup/);
  assert.doesNotMatch(runtime,/count >= 2 && count <= 18/);
});

test("0.5.2 uses pointer drag for element movement", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  assert.match(runtime,/drag\.addEventListener\("pointerdown"/);
  assert.match(runtime,/document\.elementFromPoint/);
  assert.match(runtime,/cms-drop-target-runtime/);
  assert.match(runtime,/root\.append\(toolbar\)/);
});

test("0.5.2 keeps responsive layout data and safe structured persistence", async()=>{
  const admin=await read("components/content-studio-admin.tsx");
  const studio=await read("lib/content-studio.ts");
  assert.match(admin,/responsiveLayoutOverrides/);
  assert.match(studio,/sanitizeResponsiveLayoutOverrides/);
  assert.match(studio,/groupClones/);
  assert.match(studio,/elementPlacements/);
});
