import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);

test("favicon dourado mantém fundo transparente e emblema centralizado", async () => {
  for (const path of ["public/favicon.png", "public/favicon-32.png", "public/favicon-16.png"]) {
    const { data, info } = await sharp(fileURLToPath(new URL(path, root))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, info.height, `${path}: deve ser quadrado`);
    let left = info.width, top = info.height, right = -1, bottom = -1;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * info.channels + 3] < 24) continue;
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    assert.ok(right > left && bottom > top, `${path}: símbolo dourado visível`);
    assert.ok(data[3] === 0, `${path}: canto externo transparente`);
    assert.ok(Math.abs((left + right) / 2 - (info.width - 1) / 2) <= Math.max(2, info.width * 0.045), `${path}: ícone centralizado`);
    assert.ok((right - left + 1) / info.width >= 0.6, `${path}: marca grande o bastante para ler na aba`);
  }
});

test("ícones instaláveis do Android e Apple têm fundo preto com emblema dourado centralizado", async () => {
  for (const path of ["app/icon.png", "app/apple-icon.png", "public/brand/lordnutri-app-icon-512.png"]) {
    const { data, info } = await sharp(fileURLToPath(new URL(path, root))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 512);
    assert.equal(info.height, 512);
    assert.deepEqual([...data.subarray(0, 4)], [0, 0, 0, 255], `${path}: fundo externo preto opaco`);
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

test("metadados oferecem favicon PNG e ICO transparentes em vez do SVG legado", async () => {
  const metadata = await readFile(new URL("app/layout.tsx", root), "utf8");
  const ico = await readFile(new URL("public/favicon.ico", root));
  assert.match(metadata, /\/favicon-32\.png/);
  assert.match(metadata, /\/favicon\.ico/);
  assert.doesNotMatch(metadata, /\/favicon\.svg/);
  assert.equal(ico.subarray(0, 4).toString("hex"), "00000100");
});
