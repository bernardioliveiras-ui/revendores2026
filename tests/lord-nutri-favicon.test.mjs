import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);

test("favicon 2026 tem ouro visível com fundo realmente transparente", async () => {
  for (const path of ["public/favicon.png", "public/favicon-32.png", "public/favicon-16.png"]) {
    const { data, info } = await sharp(fileURLToPath(new URL(path, root))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, info.height, `${path}: deve ser quadrado`);
    let left = info.width, top = info.height, right = -1, bottom = -1;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const i=(y * info.width + x) * info.channels;
        if (data[i] < 110 || data[i + 1] < 65 || data[i + 2] >= data[i]) continue;
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    assert.ok(right > left && bottom > top, `${path}: símbolo dourado visível`);
    assert.equal(data[3],0,`${path}: o canto deve ser transparente, nunca preto opaco`);
    assert.ok(Math.abs((left + right) / 2 - (info.width - 1) / 2) <= Math.max(2, info.width * 0.045), `${path}: ícone centralizado`);
    assert.ok((right - left + 1) / info.width >= 0.53, `${path}: marca grande o bastante para ler na aba`);
  }
});

test("todos os ícones de app, marca e legado preservam transparência", async () => {
  for (const path of ["app/icon.png", "app/apple-icon.png", "public/icon.png", "public/apple-icon.png", "public/brand/lordnutri-app-icon-2026.png", "public/brand/lordnutri-app-icon-512.png", "public/brand/lordnutri-maskable-icon-2026.png", "public/brand/lordnutri-mark-transparente-2026.png"]) {
    const { data, info } = await sharp(fileURLToPath(new URL(path, root))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 512);
    assert.equal(info.height, 512);
    assert.equal(data[3],0,`${path}: o canto externo não pode ter quadrado preto`);
    let left = 512, top = 512, right = -1, bottom = -1;
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const i = (y * 512 + x) * info.channels;
      if (data[i] < 110 || data[i + 1] < 65 || data[i + 2] >= data[i]) continue;
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
    assert.ok(right - left > 230 && bottom - top > 230, `${path}: marca grande e legível`);
    assert.ok(Math.abs((left + right) / 2 - 255.5) < 22, `${path}: emblema alinhado horizontalmente`);
    assert.ok(Math.abs((top + bottom) / 2 - 255.5) < 22, `${path}: emblema alinhado verticalmente`);
  }
});

test("metadados oferecem favicon novo e versão para evitar cache antigo", async () => {
  const metadata = await readFile(new URL("app/layout.tsx", root), "utf8");
  const ico = await readFile(new URL("public/favicon.ico", root));
  const svg = await readFile(new URL("public/favicon.svg", root), "utf8");
  assert.match(metadata, /\/favicon-32\.png/);
  assert.match(metadata, /\/favicon\.ico/);
  assert.match(metadata, /20261126-3/);
  assert.doesNotMatch(metadata, /\/favicon\.svg/);
  assert.equal(ico.subarray(0, 4).toString("hex"), "00000100");
  assert.match(svg,/data:image\/png;base64,/);
  assert.doesNotMatch(svg,/<rect\b/i);
});
