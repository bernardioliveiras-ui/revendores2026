import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("BKO disponibiliza gerenciamento de materiais por revendedor sem confundir com aprovação do pagamento", () => {
  const app = read("app/painel/portal-client.tsx");
  const control = read("components/manual-material-access-admin.tsx");
  assert.match(app, /<ManualMaterialAccessAdmin\s+userId=\{r\.id\}/);
  assert.match(control, /Liberar materiais manualmente/);
  assert.match(control, /Revogar liberação manual/);
  assert.match(control, /\/api\/admin\/resellers\/material-access/);
  assert.match(control, /Comprovante|comprovante/);
  assert.match(control, /window\.confirm/);
});

test("marca do BKO separa título e subtítulo mesmo com o botão do menu como último filho", () => {
  const css = read("app/portal-modern.css");
  assert.match(css, /\.lord-admin-brand\s*>\s*div:last-of-type\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/);
  assert.match(css, /\.lord-admin-brand strong\s*\{[^}]*display:\s*block;/);
});
