import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../app/landing.css", import.meta.url), "utf8");
const runtime = fs.readFileSync(new URL("../components/content-runtime.tsx", import.meta.url), "utf8");

test("institutional copy typography is layout-owned", () => {
  assert.match(css, /lnr-brand-story-copy>p\{[\s\S]*font-family:Georgia/);
  assert.match(css, /lnr-brand-story-copy \.lnr-mix-name\{[\s\S]*Arial Black/);
});

test("brand renderer is case-insensitive and rebuilds brand spans", () => {
  assert.match(runtime, /LORD\\s\*NUTRI\|MIX10\\s\*PRO\)\/gi/);
  assert.match(runtime, /className = "lnr-mix-name"/);
  assert.match(runtime, /className = "lnr-lord-name"/);
});
