import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const manifestFile = new URL("../app/manifest.ts", import.meta.url);
function getManifest() {
  const source = stripTypeScriptTypes(readFileSync(manifestFile, "utf8"), { mode: "strip" });
  return new Function(`${source.replace("export default function manifest()", "function manifest()")}; return manifest();`)();
}

function imageInfo(relativePath) {
  const png = readFileSync(new URL("../" + relativePath, import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20), colorType: png[25] };
}

test("PWA instala com fundo preto e ícone maskable apropriado à tela inicial", () => {
  const manifest = getManifest();
  assert.equal(manifest.background_color, "#000000");
  assert.equal(manifest.theme_color, "#000000");
  assert.equal(manifest.short_name, "LORD NUTRI");
  assert.ok(manifest.icons.some(icon => icon.purpose === "maskable" && icon.src.startsWith("/brand/lordnutri-maskable-icon-2026.png")));
  assert.ok(manifest.icons.some(icon => icon.purpose === "any" && icon.src.startsWith("/brand/lordnutri-app-icon-2026.png")));
});

test("ícones do Android e da Apple são quadrados e opacos para não criar fundo branco do sistema", () => {
  for (const path of ["public/brand/lordnutri-app-icon-512.png", "app/icon.png", "app/apple-icon.png"]) {
    assert.deepEqual(imageInfo(path), { width: 512, height: 512, colorType: 2 });
  }
});
