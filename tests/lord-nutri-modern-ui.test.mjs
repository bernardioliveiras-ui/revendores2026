import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const portal = readFileSync(new URL("../app/painel/portal-client.tsx", import.meta.url), "utf8");
const indicator = readFileSync(new URL("../components/indicator-portal.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("BKO oferece oito módulos principais e mantém acesso às subáreas legadas", () => {
  for (const section of ["Visão Geral", "Influenciadores", "Revendedores", "Expedição", "Acessos e Pedidos", "Studio LP", "Materiais", "Configurações e Auditoria"]) {
    assert.ok(portal.includes(`\"${section}\"`), `Módulo ausente: ${section}`);
  }
  for (const id of ['"sales"', '"content"', '"maintenance"']) assert.ok(portal.includes(id));
  assert.match(portal, /lord-admin-sidebar/);
  assert.match(layout, /portal-modern\.css/);
});

test("revendedor recebe a marca original e rastreio com atualização identificada como CRM", () => {
  assert.match(portal, /PORTAL DO REVENDEDOR/);
  assert.match(portal, /BrandLogo compact mark/);
  assert.match(portal, /Última atualização registrada no CRM/);
  assert.doesNotMatch(portal, /\(R\$ 67,90\/unidade\)/);
});

test("influenciador apresenta campanha individual da API, sem TORREI global nem cashback V2 fictício", () => {
  assert.match(indicator, /campaign\.name/);
  assert.match(indicator, /campaign\.salesPath/);
  assert.match(indicator, /portal-influencer/);
  assert.doesNotMatch(indicator, /TORREI|R\$ 20,00 por caixa/);
});
