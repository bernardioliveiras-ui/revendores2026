import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("institutional LORD NUTRI copy is corrected", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /E QUEM ESTÁ POR TRÁS DE TUDO ISSO\?/);
  assert.match(page, /A marca por trás do programa de revendedores MIX10 PRO\./);
  assert.doesNotMatch(page, /por atrás/i);
});

test("people are background ambience rather than animated cards", async () => {
  const css = await read("app/landing.css");
  assert.match(css, /\.lnr-page \.lnr-people-visual\{[^}]*position:absolute!important/);
  assert.match(css, /\.lnr-page \.lnr-people-visual img\{[^}]*opacity:\.52/);
  assert.match(css, /\.lnr-page \.lnr-care-band img\{[^}]*opacity:\.46/);
  assert.match(css, /animation:none!important/);
});

test("CMS applies only layout-safe text and section-scoped stable keys", async () => {
  const runtime = await read("components/content-runtime.tsx");
  const studio = await read("lib/content-studio.ts");
  assert.match(runtime, /stableKey\(kind, html, root\)/);
  assert.match(runtime, /if \(!textLeaf && !brandRichText && !lineBreakRichText\) continue;/);
  assert.match(runtime, /scopeName\(scope, root\) === "lord-nutri"/);
  assert.match(studio, /O CMS nunca persiste classes, HTML, estilos ou estrutura/);
  assert.match(studio, /sanitizeLandingDraft/);
});

test("brand internals are not exposed as separate CMS fields", async () => {
  const runtime = await read("components/content-runtime.tsx");
  assert.match(runtime, /html\.matches\("\.lnr-lord-name, \.lnr-mix-name, \.lnr-mix-name \*"\)/);
});
