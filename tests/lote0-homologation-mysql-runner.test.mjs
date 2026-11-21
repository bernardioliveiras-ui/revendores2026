import test from "node:test";
import assert from "node:assert/strict";
import { validateAuditRunnerGuard, runAuditMysqlMatrix } from "./lote0-homologation-mysql.mjs";

const safe = {
  DATABASE_HOST: "127.0.0.1", DATABASE_PORT: "13307",
  DATABASE_NAME: "hml_synthetic_only", DATABASE_USER: "hml_synthetic",
  DATABASE_PASSWORD: "synthetic-secret-not-real",
  ASAAS_ENVIRONMENT: "sandbox", HOMOLOGATION_TEST_ONLY: "yes",
  HOMOLOGATION_DATABASE: "hml_synthetic_only",
  HOMOLOGATION_EXCLUSIVE_DB_CONFIRMED: "yes",
  HOMOLOGATION_AUDIT_WRITE_CONSENT: "yes",
};

test("executor da auditoria recusa produção, banco não isolado e escrita sem autorização", async () => {
  for (const changed of [
    { HOMOLOGATION_TEST_ONLY: "no" },
    { HOMOLOGATION_DATABASE: "outro_banco" },
    { HOMOLOGATION_EXCLUSIVE_DB_CONFIRMED: "no" },
    { HOMOLOGATION_AUDIT_WRITE_CONSENT: "no" },
    { ASAAS_ENVIRONMENT: "production" },
    { ASAAS_ENVIRONMENT: "" },
  ]) {
    const env = { ...safe, ...changed };
    assert.throws(() => validateAuditRunnerGuard(env), /homologa|sandbox|exclusiv|consent|autoriz|DATABASE/i);
    let connections = 0;
    await assert.rejects(runAuditMysqlMatrix({ env, connect: () => { connections++; throw Error("NÃO CONECTAR"); } }));
    assert.equal(connections, 0, "o bloqueio deve acontecer antes de abrir qualquer sessão");
  }
});

test("executor exige confirmação expressa, mesmo com DATABASE_* preenchidas", () => {
  assert.equal(validateAuditRunnerGuard(safe).database, "hml_synthetic_only");
  assert.throws(() => validateAuditRunnerGuard({ ...safe, DATABASE_PASSWORD: "" }), /DATABASE_PASSWORD/);
});

test("executor força timezone UTC nos sockets de homologação", async () => {
  let options;
  await assert.rejects(runAuditMysqlMatrix({ env: safe, connect: config => {
    options = config;
    throw Error("synthetic no network");
  } }));
  assert.equal(options.timezone, "Z");
});

test("permite somente auditoria sintética no banco compartilhado autorizado", () => {
  const shared = {
    ...safe,
    DATABASE_NAME: "u922332919_revmix10",
    HOMOLOGATION_DATABASE: "u922332919_revmix10",
    HOMOLOGATION_EXCLUSIVE_DB_CONFIRMED: "no",
    HOMOLOGATION_SHARED_AUDIT_ONLY: "yes",
  };
  assert.equal(validateAuditRunnerGuard(shared).database, "u922332919_revmix10");
  assert.throws(() => validateAuditRunnerGuard({ ...shared, HOMOLOGATION_AUDIT_WRITE_CONSENT: "no" }), /autoriz|consent/i);
  assert.throws(() => validateAuditRunnerGuard({ ...shared, DATABASE_NAME: "outro_banco", HOMOLOGATION_DATABASE: "outro_banco" }), /compartilhad|banco/i);
  assert.throws(() => validateAuditRunnerGuard({ ...shared, ASAAS_ENVIRONMENT: "production" }), /production|sandbox/i);
});
