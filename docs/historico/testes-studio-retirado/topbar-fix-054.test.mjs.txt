import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),"utf8");

test("0.5.4 exposes the gold announcement as a whole builder section", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  const page=await read("app/page.tsx");
  assert.match(page,/lnr-announce[^>]+data-cms-structural-block="announce"/);
  assert.match(runtime,/announce: "Faixa dourada do topo"/);
  assert.match(runtime,/child\.classList\.contains\("lnr-announce"\)/);
});

test("0.5.4 keeps announcement and header in the structural catalog and blocks accidental duplication", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  const page=await read("app/page.tsx");
  assert.match(page,/lnr-header[^>]+data-cms-structural-block="header"/);
  assert.match(runtime,/header: "Cabeçalho \/ menu"/);
  assert.match(runtime,/new Set\(\["announce", "header", "simulador", "checkout"\]\)/);
});

test("0.5.4 migrates newly discovered structural blocks into natural DOM order", async()=>{
  const runtime=await read("components/content-runtime.tsx");
  assert.match(runtime,/const catalogIndex = catalog\.findIndex/);
  assert.match(runtime,/result\.splice\(nextIndex, 0, \{ id: item\.id, sourceId: item\.id \}\)/);
});
