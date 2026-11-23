import test from "node:test";
import assert from "node:assert/strict";
import { fixtureDb, loadNative, operators, table } from "./native-runtime-loader.mjs";

const schema = { purchases: table("id", "userId", "kit", "paymentStatus", "asaasVerifiedAt", "accessReleasedAt"), resellerProfiles: table("id", "userId", "purchaseId", "initialKit") };
const staleOrder = { id: "old-paid", userId: "seller-jorge", kit: "kit50", paymentStatus: "paid", asaasVerifiedAt: null, accessReleasedAt: "2026-11-10" };
const session = { id: "seller-jorge", role: "reseller", mustChangePassword: false };
const orm = { ...operators, or: (...f) => row => f.some(check => check(row)), isNotNull: key => row => row[key] != null };

function setup({ grant = false, user = session } = {}) {
  const { db } = fixtureDb(schema, { purchases: [staleOrder], resellerProfiles: [{ id: "profile", userId: "seller-jorge", purchaseId: "old-paid", initialKit: "kit50" }] });
  const materialService = loadNative("lib/reseller-materials.ts", {
    "drizzle-orm": orm, "@/db": { getDb: () => db, getMysqlPool: () => ({}) }, "@/db/schema": schema,
    "@/lib/auth": { requireSession: async () => { if (!user) throw Error("UNAUTHORIZED"); return user; } },
    "@/lib/manual-material-access": { hasActiveManualMaterialGrant: async () => grant },
  }, ["authorizeMaterials", "hasManualResellerProfile", "hasManualOrGrantedMaterialsAccess"]);
  const { GET } = loadNative("app/api/reseller/manual/route.ts", {
    "node:fs/promises": { readFile: async () => Buffer.from("%PDF-1.7") }, "node:path": { join: (...parts) => parts.join("/") },
    "drizzle-orm": orm, "@/db": { getDb: () => db }, "@/db/schema": schema,
    "@/lib/auth": { requireSession: async () => { if (!user) throw Error("UNAUTHORIZED"); return user; } },
    "@/lib/content-studio": { getStudioDoc: async () => ({ published: { pages: [] } }) },
    "@/lib/reseller-materials": { getManualPdfOverride: async () => ({ file_name: "manual.pdf", file_bytes: Buffer.from("%PDF-1.7") }), hasManualOrGrantedMaterialsAccess: materialService.hasManualOrGrantedMaterialsAccess },
    "@/lib/simple-pdf": { buildManualPdf: () => Buffer.from("%PDF-1.7") },
  }, ["GET"]);
  return { GET, materialService };
}

test("comprador legado sem verificação Asaas recebe 403 sem concessão explícita", async () => {
  const t = setup();
  assert.equal((await t.GET(new Request("https://site.test/api/reseller/manual"))).status, 403);
  await assert.rejects(t.materialService.authorizeMaterials(new Request("https://site.test/api/reseller/materials")), { message: "FORBIDDEN" });
});

test("concessão administrativa habilita o PDF e materiais para o usuário existente", async () => {
  const t = setup({ grant: true });
  assert.equal((await t.GET(new Request("https://site.test/api/reseller/manual"))).status, 200);
  assert.equal((await t.materialService.authorizeMaterials(new Request("https://site.test/api/reseller/materials"))).id, "seller-jorge");
});

test("concessão não contorna autenticação nem troca obrigatória de senha", async () => {
  assert.equal((await setup({ grant: true, user: null }).GET(new Request("https://site.test/api/reseller/manual"))).status, 401);
  assert.equal((await setup({ grant: true, user: { ...session, mustChangePassword: true } }).GET(new Request("https://site.test/api/reseller/manual"))).status, 403);
  assert.equal((await setup({ grant: true, user: { ...session, role: "indicator" } }).GET(new Request("https://site.test/api/reseller/manual"))).status, 403);
});
