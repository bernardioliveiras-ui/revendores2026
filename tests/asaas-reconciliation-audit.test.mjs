import test from "node:test";
import assert from "node:assert/strict";
import { load, memoryDb, operators, table } from "./runtime-loader.mjs";

const schema = {
  purchases: table("id", "orderNumber"),
  asaasReconciliationAudit: table("recordId", "attemptId", "phase", "purchaseId"),
};
const purchase = {
  id: "order-synthetic-01", orderNumber: "HML-0001", kit: "kit20",
  asaasPaymentId: "pay_synthetic_01", asaasCustomerId: "cus_synthetic_01",
  asaasInvoiceUrl: "https://sandbox.asaas.com/i/test", asaasInstallmentId: null,
  installments: 1, installmentValueCents: 10990, totalCents: 10990,
  paymentStatus: "payment_pending", asaasVerifiedAt: null,
};

function fixture({ offline = false, remote = {}, flipEnvironment = false, startFails = false, finishFails = false, webhookFailure = false } = {}) {
  const state = memoryDb(schema, { purchases: [{ ...purchase }] });
  let asaasCalls = 0;
  let webhookCalls = 0;
  let configReads = 0;
  const insert = state.db.insert.bind(state.db);
  state.db.insert = (t) => {
    if (t !== schema.asaasReconciliationAudit) return insert(t);
    return { values: async (data) => {
      if ((startFails && data.phase === "started") || (finishFails && data.phase === "finished")) throw new Error("SYNTHETIC_AUDIT_FAILURE");
      return insert(t).values(data);
    } };
  };
  const audit = load("lib/asaas-reconciliation-audit.ts", {
    "@/db": { getDb: () => state.db }, "@/db/schema": schema,
  });
  class AsaasRequestError extends Error { constructor(message, status = 503) { super(message); this.status = status; } }
  const deps = {
    "drizzle-orm": operators,
    "@/db": { getDb: () => state.db }, "@/db/schema": schema,
    "@/lib/auth": { requireAdmin: async () => ({ id: "admin-synthetic", role: "admin" }) },
    "@/lib/env": { getOptionalEnv: (k) => k === "ASAAS_WEBHOOK_TOKEN" ? "synthetic-webhook-token" : undefined },
    "@/lib/campaign-schema": { ensureCampaignSchema: async () => {} },
    "@/lib/asaas-reconciliation-audit": audit,
    "@/lib/asaas": {
      AsaasRequestError,
      getAsaasConfig: () => {
        configReads++;
        const environment = flipEnvironment && configReads > 1 ? "production" : "sandbox";
        return { configured: true, apiKey: "synthetic-not-real-key", environment, baseUrl: `https://api-${environment}.invalid/v3` };
      },
      getPayment: async (id, config) => {
        asaasCalls++;
        assert.equal(id, "pay_synthetic_01");
        assert.equal(config?.environment, "sandbox", "o ambiente consultado deve vir da configuração congelada");
        if (offline) throw new AsaasRequestError("RAW_PROVIDER_SECRET_DO_NOT_LOG", 502);
        return { id, status: "CONFIRMED", value: 109.9, customer: "cus_synthetic_01", externalReference: "order-synthetic-01", ...remote };
      },
    },
    "@/lib/billing-webhook": { handleBillingWebhook: async () => {
      webhookCalls++;
      Object.assign(state.rows.purchases[0], { paymentStatus: "paid", asaasVerifiedAt: "2026-11-20T00:00:00.000Z" });
      return webhookFailure ? Response.json({ error: "Falha operacional temporária." }, { status: 503 }) : Response.json({ received: true });
    } },
  };
  const { POST } = load("app/api/admin/orders/sync/route.ts", deps);
  const { PATCH } = load("app/api/admin/orders/route.ts", {
    ...deps,
    "@/app/api/admin/orders/sync/route": { POST },
  });
  return {
    ...state, audit,
    call: (path = "/api/admin/orders/sync") => POST(new Request(`https://homolog.example.test${path}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purchaseId: purchase.id }),
    })),
    patch: () => PATCH(new Request("https://homolog.example.test/api/admin/orders", {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ purchaseId: purchase.id, status: "paid" }),
    })),
    get asaasCalls() { return asaasCalls; },
    get webhookCalls() { return webhookCalls; },
    get configReads() { return configReads; },
  };
}

test("auditoria grava started e finished com ambiente efetivo, operador e erro seguro", async () => {
  const f = fixture({ offline: true, flipEnvironment: true });
  const response = await f.call();
  assert.equal(response.status, 502);
  assert.equal(f.asaasCalls, 1);
  assert.equal(f.webhookCalls, 0);
  assert.equal(f.rows.purchases[0].paymentStatus, "payment_pending");
  assert.equal(f.rows.asaasReconciliationAudit.length, 2);
  const [started, finished] = f.rows.asaasReconciliationAudit;
  assert.equal(started.phase, "started");
  assert.equal(finished.phase, "finished");
  assert.equal(started.attemptId, finished.attemptId);
  assert.equal(started.requestId, finished.requestId);
  assert.equal(finished.actorId, "admin-synthetic");
  assert.equal(finished.paymentId, "pay_synthetic_01");
  assert.equal(finished.configuredEnvironment, "sandbox");
  assert.equal(finished.consultedEnvironment, "sandbox");
  assert.equal(finished.safeErrorCode, "ASAAS_UNAVAILABLE");
  assert.equal(finished.outcome, "provider_error");
  assert.equal(finished.httpStatus, 502);
  assert.equal(finished.providerConsulted, 1);
  const stored = JSON.stringify(f.rows.asaasReconciliationAudit);
  assert.doesNotMatch(stored, /RAW_PROVIDER_SECRET|synthetic-not-real-key|synthetic-webhook-token/);
  assert.doesNotMatch(await response.text(), /RAW_PROVIDER_SECRET|synthetic-not-real-key/);
});

test("pedido e pagamento confirmados registram aprovação antes de responder", async () => {
  const f = fixture();
  const response = await f.call();
  assert.equal(response.status, 200);
  assert.equal(f.webhookCalls, 1);
  assert.equal(f.rows.purchases[0].paymentStatus, "paid");
  assert.equal(f.rows.asaasReconciliationAudit.length, 2);
  assert.equal(f.rows.asaasReconciliationAudit[1].outcome, "approved");
  assert.equal(f.rows.asaasReconciliationAudit[1].httpStatus, 200);
});

test("ambiente divergente é auditado sem consultar o provedor", async () => {
  const f = fixture();
  f.rows.purchases[0].asaasInvoiceUrl = "https://www.asaas.com/i/test";
  const response = await f.call();
  assert.equal(response.status, 409);
  assert.equal(f.asaasCalls, 0);
  assert.equal(f.rows.asaasReconciliationAudit.length, 2);
  const finished = f.rows.asaasReconciliationAudit[1];
  assert.equal(finished.safeErrorCode, "ENVIRONMENT_MISMATCH");
  assert.equal(finished.consultedEnvironment, null);
  assert.equal(finished.providerConsulted, 0);
});

test("falha do INSERT started impede qualquer consulta e pagamento", async () => {
  const f = fixture({ startFails: true });
  const response = await f.call();
  assert.equal(response.status, 503);
  assert.equal(f.asaasCalls, 0);
  assert.equal(f.webhookCalls, 0);
  assert.equal(f.rows.purchases[0].paymentStatus, "payment_pending");
});

test("falha do INSERT finished não fabrica 502 auditado nem altera resposta para sucesso", async () => {
  const f = fixture({ offline: true, finishFails: true });
  const response = await f.call();
  assert.equal(response.status, 503);
  assert.equal(f.rows.asaasReconciliationAudit.length, 1);
  assert.equal(f.rows.asaasReconciliationAudit[0].phase, "started");
  assert.equal(f.rows.purchases[0].paymentStatus, "payment_pending");
});

test("PATCH legado registra uma tentativa com ação legada", async () => {
  const f = fixture();
  const response = await f.patch();
  assert.equal(response.status, 200);
  assert.equal(f.rows.asaasReconciliationAudit.length, 2);
  assert.equal(f.rows.asaasReconciliationAudit[0].endpointAction, "admin.orders.patch.legacy");
});

test("falha de auditoria após pagamento aplicado conserva paid para conciliação posterior", async () => {
  const f = fixture({ finishFails: true });
  const response = await f.call();
  assert.equal(response.status, 503);
  assert.equal(f.webhookCalls, 1);
  assert.equal(f.rows.purchases[0].paymentStatus, "paid", "não fabricar estorno por erro de auditoria");
  assert.equal(f.rows.asaasReconciliationAudit.length, 1, "started permite detectar tentativa inconclusa");
});

test("webhook com falha operacional após paid grava internal_error e não falso pagamento rejeitado", async () => {
  const f = fixture({ webhookFailure: true });
  const response = await f.call();
  assert.equal(response.status, 503);
  assert.equal(f.rows.purchases[0].paymentStatus, "paid");
  const finished = f.rows.asaasReconciliationAudit[1];
  assert.equal(finished.outcome, "internal_error");
  assert.equal(finished.safeErrorCode, "INTERNAL_ERROR");
});

test("cliente Asaas usa o ambiente congelado mesmo se configuração mudar depois", async () => {
  let environment = "sandbox";
  const { getAsaasConfig, getPayment } = load("lib/asaas.ts", {
    "@/lib/env": { getOptionalEnv: (name) => name === "ASAAS_ENVIRONMENT" ? environment : "synthetic-key" },
  });
  const frozen = getAsaasConfig();
  environment = "production";
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /^https:\/\/api-sandbox\.asaas\.com\/v3\/payments\/pay_synthetic_01$/);
    assert.equal(init.headers.access_token, "synthetic-key");
    return new Response(JSON.stringify({ id: "pay_synthetic_01", status: "CONFIRMED" }), { status: 200 });
  };
  try {
    const result = await getPayment("pay_synthetic_01", frozen);
    assert.equal(result.status, "CONFIRMED");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("timeout ou rede indisponível no cliente Asaas vira erro seguro de provedor", async () => {
  const { getPayment, AsaasRequestError } = load("lib/asaas.ts", {
    "@/lib/env": { getOptionalEnv: (name) => name === "ASAAS_ENVIRONMENT" ? "sandbox" : "synthetic-key" },
  });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("SYNTHETIC_NETWORK_SECRET_NEVER_EXPOSE"); };
  try {
    await assert.rejects(getPayment("pay_synthetic_01"), (error) => {
      assert.ok(error instanceof AsaasRequestError);
      assert.equal(error.status, 502);
      assert.doesNotMatch(error.message, /SYNTHETIC_NETWORK_SECRET/);
      return true;
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});
