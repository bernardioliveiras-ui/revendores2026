import test from "node:test";
import assert from "node:assert/strict";
import { validatePreflightConfig, inspectHomologation } from "../scripts/homologation-preflight.mjs";

const safeEnv = {
  DATABASE_HOST: "homolog-db.invalid",
  DATABASE_PORT: "3306",
  DATABASE_NAME: "u_test_revmix10",
  DATABASE_USER: "homolog_user",
  DATABASE_PASSWORD: "fake-test-secret",
  DATABASE_SSL: "true",
  ASAAS_ENVIRONMENT: "sandbox",
  HOMOLOGATION_TEST_ONLY: "yes",
  HOMOLOGATION_DATABASE: "u_test_revmix10",
};

test("preflight recusa banco sem confirmação explícita de homologação", () => {
  assert.throws(() => validatePreflightConfig({ ...safeEnv, HOMOLOGATION_TEST_ONLY: "" }), /HOMOLOGATION_TEST_ONLY/);
  assert.throws(() => validatePreflightConfig({ ...safeEnv, HOMOLOGATION_DATABASE: "outro_banco" }), /HOMOLOGATION_DATABASE/);
  assert.throws(() => validatePreflightConfig({ ...safeEnv, DATABASE_NAME: "" }), /DATABASE_NAME/);
  assert.throws(() => validatePreflightConfig({ ...safeEnv, ASAAS_ENVIRONMENT: "production" }), /ASAAS_ENVIRONMENT/);
});

test("preflight usa duas conexões reais distintas por contrato e apenas consultas de metadados", async () => {
  const statements = [];
  const closed = [];
  let nextConnectionId = 1;
  const connect = async () => {
    const id = nextConnectionId++;
    return {
      async query(sql) {
        statements.push(sql);
        if (sql.includes("CONNECTION_ID()")) return [[{ databaseName: "u_test_revmix10", connectionId: id, serverVersion: "8.0.36" }]];
        if (sql.includes("@@autocommit")) return [[{ autocommit: 1 }]];
        if (sql.includes("information_schema.TABLES")) return [[{ TABLE_NAME: "purchases", ENGINE: "InnoDB" }]];
        if (sql.includes("information_schema.STATISTICS")) return [[{ TABLE_NAME: "purchases", INDEX_NAME: "PRIMARY", COLUMN_NAME: "id", NON_UNIQUE: 0 }]];
        return [[]];
      },
      async end() { closed.push(id); },
    };
  };
  const result = await inspectHomologation({ env: safeEnv, connect });
  assert.deepEqual(result.connectionIds, [1, 2]);
  assert.equal(result.database, "u_test_revmix10");
  assert.deepEqual(closed.sort(), [1, 2]);
  assert.ok(statements.some(sql => sql.includes("information_schema.STATISTICS")));
  assert.ok(statements.every(sql => /^\s*(SELECT|SHOW)\s/i.test(sql)), "somente leitura é permitida");
  assert.equal(JSON.stringify(result).includes("fake-test-secret"), false);
});

test("preflight falha com conexões idênticas e fecha as sessões", async () => {
  let closed = 0;
  const connect = async () => ({
    query: async sql => sql.includes("CONNECTION_ID()") ? [[{ databaseName: "u_test_revmix10", connectionId: 1, serverVersion: "8.0.36" }]] : [[]],
    end: async () => { closed++; },
  });
  await assert.rejects(inspectHomologation({ env: safeEnv, connect }), /conexões independentes/i);
  assert.equal(closed, 2);
});
