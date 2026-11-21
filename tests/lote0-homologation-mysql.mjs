/**
 * LORD NUTRI — auditoria SQL real, sem modificar dados financeiros.
 *
 * Invocação MANUAL (Node 22, DATABASE_* definidos somente no ambiente seguro):
 *   HOMOLOGATION_TEST_ONLY=yes \
 *   HOMOLOGATION_DATABASE=<mesmo DATABASE_NAME> \
 *   HOMOLOGATION_EXCLUSIVE_DB_CONFIRMED=yes \
 *   HOMOLOGATION_AUDIT_WRITE_CONSENT=yes \
 *   ASAAS_ENVIRONMENT=sandbox \
 *   node tests/lote0-homologation-mysql.mjs --execute
 *
 * Exceção expressa para a base compartilhada u922332919_revmix10:
 *   HOMOLOGATION_EXCLUSIVE_DB_CONFIRMED=no
 *   HOMOLOGATION_SHARED_AUDIT_ONLY=yes
 * (apenas logs de auditoria sintéticos, nunca testes com pedidos ou estoque).
 *
 * Duas sessões MySQL reais; não importa routes, não abre HTTP e não cria
 * cobrança, acesso, pedido, estoque ou migration. Quatro registros
 * SINTÉTICOS ficam para sempre na tabela append-only de auditoria.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { validatePreflightConfig } from "../scripts/homologation-preflight.mjs";
import { load } from "./runtime-loader.mjs";

export function validateAuditRunnerGuard(env = process.env) {
  const config = validatePreflightConfig(env);
  if (env.ASAAS_ENVIRONMENT !== "sandbox") throw new Error("Use somente ASAAS_ENVIRONMENT=sandbox na homologação.");
  if (env.HOMOLOGATION_SHARED_AUDIT_ONLY === "yes") {
    if (config.database !== "u922332919_revmix10" || env.HOMOLOGATION_EXCLUSIVE_DB_CONFIRMED !== "no")
      throw new Error("Modo compartilhado de auditoria permitido apenas para o banco expressamente autorizado.");
  } else if (env.HOMOLOGATION_EXCLUSIVE_DB_CONFIRMED !== "yes") {
    throw new Error("Confirme que o banco é exclusivamente de homologação e não atende ao site online.");
  }
  if (env.HOMOLOGATION_AUDIT_WRITE_CONSENT !== "yes") throw new Error("Falta autorização explícita para gravar linhas sintéticas na auditoria persistente.");
  return config;
}

function sqlCode(error) {
  let candidate = error;
  for (let i = 0; i < 4 && candidate; i++) {
    if (candidate.code === "ER_DUP_ENTRY" || candidate.errno === 1062) return "DUPLICATE";
    candidate = candidate.cause;
  }
  return "OTHER";
}

export async function runAuditMysqlMatrix({ env = process.env, connect = options => mysql.createConnection(options) } = {}) {
  // O gate deve executar antes de qualquer abertura de conexão.
  const config = validateAuditRunnerGuard(env);
  let a;
  let b;
  try {
    // Datas da auditoria têm semântica UTC, independentemente do fuso do PC.
    const connectionOptions = { ...config, timezone: "Z" };
    a = await connect(connectionOptions);
    b = await connect(connectionOptions);
    const [[idA], [idB]] = await Promise.all([
      a.query("SELECT DATABASE() AS db, CONNECTION_ID() AS sessionId"),
      b.query("SELECT DATABASE() AS db, CONNECTION_ID() AS sessionId"),
    ]);
    const left = idA[0];
    const right = idB[0];
    assert.equal(left?.db, config.database, "conexão A apontou para outro banco");
    assert.equal(right?.db, config.database, "conexão B apontou para outro banco");
    assert.ok(left?.sessionId && right?.sessionId && left.sessionId !== right.sessionId, "faltam duas sessões SQL independentes");

    const [[metadata]] = await a.query(`SELECT t.ENGINE AS engine,
      (SELECT COUNT(*) FROM information_schema.COLUMNS c WHERE c.TABLE_SCHEMA = DATABASE() AND c.TABLE_NAME = t.TABLE_NAME) AS columnsCount
      FROM information_schema.TABLES t WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_NAME = 'asaas_reconciliation_audit'`);
    assert.equal(metadata[0]?.engine?.toUpperCase(), "INNODB", "a tabela de auditoria precisa ser InnoDB");
    assert.equal(Number(metadata[0]?.columnsCount), 16, "schema da auditoria não corresponde ao aprovado");

    // Executa o serviço TypeScript real com Drizzle/mysql2; só o provedor é
    // simulado. Jamais carrega webhook, provisão de acesso ou Asaas real.
    const schema = load("db/schema.ts");
    const makeAuditService = connection => load("lib/asaas-reconciliation-audit.ts", {
      "@/db": { getDb: () => drizzle({ client: connection, schema, mode: "default" }) },
      "@/db/schema": schema,
    });
    const auditA = makeAuditService(a);
    const auditB = makeAuditService(b);
    const syntheticPurchaseId = `hml-l0-audit-${randomUUID()}`;
    const [attemptA, attemptB] = await Promise.all([
      auditA.beginReconciliationAudit({ actorId: "hml-actor-a", purchaseId: syntheticPurchaseId, paymentId: "hml-mock-payment-a", configuredEnvironment: "sandbox", endpointAction: "admin.orders.sync" }),
      auditB.beginReconciliationAudit({ actorId: "hml-actor-b", purchaseId: syntheticPurchaseId, paymentId: "hml-mock-payment-b", configuredEnvironment: "sandbox", endpointAction: "admin.orders.patch.legacy" }),
    ]);

    // Consulta controlada a um provedor em memória. Não há fetch nem Asaas real.
    let syntheticProviderCalls = 0;
    const sandboxMock = async environment => {
      assert.equal(environment, "sandbox");
      syntheticProviderCalls++;
      throw new Error("SYNTHETIC_ASAAS_UNAVAILABLE");
    };
    let syntheticProviderUnavailable = false;
    try {
      await sandboxMock("sandbox");
    } catch {
      syntheticProviderUnavailable = true;
    }
    assert.equal(syntheticProviderCalls, 1);
    assert.equal(syntheticProviderUnavailable, true);
    await Promise.all([
      auditA.finishReconciliationAudit(attemptA, { outcome: "provider_error", httpStatus: 502, safeErrorCode: "ASAAS_UNAVAILABLE", consultedEnvironment: "sandbox", providerConsulted: true }),
      auditB.finishReconciliationAudit(attemptB, { outcome: "rejected", httpStatus: 409, safeErrorCode: "ENVIRONMENT_MISMATCH", consultedEnvironment: null, providerConsulted: false }),
    ]);

    // O índice UNIQUE (attempt_id, phase) deve rejeitar nova finalização.
    let duplicateBlocked = false;
    try {
      await auditA.finishReconciliationAudit(attemptA, { outcome: "provider_error", httpStatus: 502, safeErrorCode: "ASAAS_UNAVAILABLE", consultedEnvironment: "sandbox", providerConsulted: true });
    } catch (error) {
      if (sqlCode(error) !== "DUPLICATE") throw error;
      duplicateBlocked = true;
    }
    assert.equal(duplicateBlocked, true, "o índice único não rejeitou a duplicação da auditoria");

    const [rows] = await b.execute(`SELECT attempt_id AS attemptId, phase, configured_environment AS configuredEnvironment,
      consulted_environment AS consultedEnvironment, safe_error_code AS safeErrorCode,
      http_status AS httpStatus, outcome, provider_consulted AS providerConsulted
      FROM asaas_reconciliation_audit WHERE purchase_id = ? ORDER BY attempt_id, phase`, [syntheticPurchaseId]);
    assert.equal(rows.length, 4, "cada uma das duas tentativas deve criar started e finished");
    for (const attempt of [attemptA, attemptB]) {
      const entries = rows.filter(r => r.attemptId === attempt.attemptId);
      assert.deepEqual(entries.map(r => r.phase).sort(), ["finished", "started"]);
    }
    const unavailable = rows.find(r => r.safeErrorCode === "ASAAS_UNAVAILABLE");
    assert.equal(unavailable?.httpStatus, 502);
    assert.equal(unavailable?.consultedEnvironment, "sandbox");
    assert.equal(unavailable?.configuredEnvironment, "sandbox");
    assert.equal(Number(unavailable?.providerConsulted), 1);
    const blocked = rows.find(r => r.safeErrorCode === "ENVIRONMENT_MISMATCH");
    assert.equal(blocked?.consultedEnvironment, null);
    assert.equal(Number(blocked?.providerConsulted), 0);

    return {
      outcome: "AUDITORIA_SQL_APROVADA",
      database: config.database,
      sessions: [left.sessionId, right.sessionId],
      syntheticPurchaseId,
      persistedRecords: rows.length,
      attempts: 2,
      duplicateBlocked,
      provider: "Asaas mock em memória, uma tentativa simulada; nenhuma chamada externa",
      otherTablesWritten: false,
      remaining: "Não comprova handlers reais, provisionamento ou idempotência financeira concorrente.",
    };
  } finally {
    await Promise.allSettled([a?.end(), b?.end()].filter(Boolean));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 3 || process.argv[2] !== "--execute") {
    process.stderr.write("Uso: node tests/lote0-homologation-mysql.mjs --execute (somente banco isolado autorizado).\n");
    process.exitCode = 2;
  } else {
    runAuditMysqlMatrix().then(result => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    }).catch(() => {
      process.stderr.write("NÃO APROVADO: gate de segurança, auditoria, conexão ou constraint falhou; detalhes internos omitidos.\n");
      process.exitCode = 1;
    });
  }
}
