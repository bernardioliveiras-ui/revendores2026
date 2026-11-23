import test from "node:test";
import assert from "node:assert/strict";
import { loadNative } from "./native-runtime-loader.mjs";

function setup({ admin = true, role = "reseller", status = "active", email = "jorge@example.test" } = {}) {
  const events = [];
  const user = { id: "seller-jorge", role, status, email };
  let created = 0;
  const execute = async (sql, args = []) => {
    if (/SELECT id,email,role,status FROM users/.test(sql)) return [[user]];
    if (/SELECT action,.*FROM reseller_material_access_events/s.test(sql)) {
      const history = events.filter(event => event.userId === args[0]);
      return [[history.at(-1) || undefined].filter(Boolean)];
    }
    if (/INSERT INTO reseller_material_access_events/.test(sql)) {
      const [userId, action, actorId, reason, proofReference, createdAt] = args;
      events.push({ userId, action, actorId, reason, proofReference, createdAt });
      return [{ affectedRows: 1 }];
    }
    throw Error("Unexpected SQL: " + sql);
  };
  const pool = { query: async sql => { assert.match(sql, /CREATE TABLE IF NOT EXISTS reseller_material_access_events/); created++; return [[]]; }, execute, getConnection: async () => ({ beginTransaction: async () => {}, execute, commit: async () => {}, rollback: async () => {}, release() {} }) };
  const service = loadNative("lib/manual-material-access.ts", { "@/db": { getMysqlPool: () => pool } }, ["hasActiveManualMaterialGrant", "getManualMaterialDecision", "appendManualMaterialDecision", "ensureManualMaterialAccessTable"]);
  const { GET, POST } = loadNative("app/api/admin/resellers/material-access/route.ts", {
    "@/db": { getMysqlPool: () => pool },
    "@/lib/auth": { requireAdmin: async () => { if (!admin) throw Error("FORBIDDEN"); return { id: "bko-admin" }; } },
    "@/lib/manual-material-access": service,
  }, ["GET", "POST"]);
  const post = (body, origin = "https://bko.test") => POST(new Request("https://bko.test/api/admin/resellers/material-access", { method: "POST", headers: { origin, host: "bko.test", "content-type": "application/json" }, body: JSON.stringify(body) }));
  const get = userId => GET(new Request(`https://bko.test/api/admin/resellers/material-access?userId=${userId}`));
  return { events, get created() { return created; }, service, post, get, user };
}

const grant = { userId: "seller-jorge", email: "jorge@example.test", action: "grant", reason: "Pagamento externo conferido no comprovante bancário.", proofReference: "TED 2026-11-09 comprovante 123", confirm: "LIBERAR" };

test("admin libera PDF por comprovante externo e registra auditoria sem modificar compra", async () => {
  const t = setup();
  assert.equal(await t.service.hasActiveManualMaterialGrant("seller-jorge"), false);
  const response = await t.post(grant);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).active, true);
  assert.equal(await t.service.hasActiveManualMaterialGrant("seller-jorge"), true);
  assert.equal(t.events.length, 1);
  assert.equal(t.events[0].actorId, "bko-admin");
  assert.equal(t.events[0].proofReference, "TED 2026-11-09 comprovante 123");
  assert.equal((await (await t.get("seller-jorge")).json()).active, true);
});

test("admin revoga permissão sem apagar evento original; nova tentativa de revogação não duplica auditoria", async () => {
  const t = setup();
  assert.equal((await t.post(grant)).status, 200);
  const revoke = { ...grant, action: "revoke", reason: "Comprovante revisto e autorização retirada.", proofReference: "", confirm: "REVOGAR" };
  assert.equal((await t.post(revoke)).status, 200);
  assert.equal(await t.service.hasActiveManualMaterialGrant("seller-jorge"), false);
  assert.deepEqual(t.events.map(e => e.action), ["grant", "revoke"]);
  assert.equal((await t.post(revoke)).status, 409);
  assert.equal(t.events.length, 2);
});

test("mutação exige admin, origem confiável, e-mail, motivo, comprovante e confirmação", async () => {
  const t = setup();
  assert.equal((await t.post(grant, "https://outro.test")).status, 403);
  assert.equal((await t.post({ ...grant, email: "outra@example.test" })).status, 409);
  assert.equal((await t.post({ ...grant, confirm: "" })).status, 400);
  assert.equal((await t.post({ ...grant, proofReference: "" })).status, 400);
  assert.equal((await t.post({ ...grant, reason: "ok" })).status, 400);
  assert.equal((await setup({ admin: false }).post(grant)).status, 403);
  assert.equal(t.events.length, 0);
});

test("conta inativa ou de outro papel não ganha acesso", async () => {
  assert.equal((await setup({ status: "inactive" }).post(grant)).status, 409);
  assert.equal((await setup({ role: "indicator" }).post(grant)).status, 409);
});
