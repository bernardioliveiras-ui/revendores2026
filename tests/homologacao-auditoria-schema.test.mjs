import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const file = new URL("../scripts/homologacao-criar-auditoria.php", import.meta.url);

test("criação da auditoria é manual, restrita a CLI e banco de homologação", () => {
  const code = readFileSync(file, "utf8");
  assert.match(code, /PHP_SAPI\s*!==\s*'cli'/);
  assert.match(code, /HOMOLOG_DB\s*=\s*'u922332919_revmix10'/);
  assert.match(code, /AUTORIZO_AUDITORIA_PERSISTENTE/);
  assert.match(code, /--senha-stdin/);
  assert.doesNotMatch(code, /\b(?:DROP|DELETE|UPDATE|INSERT|TRUNCATE|ALTER)\s+(?:TABLE\s+)?(?:`?[\w.]+`?)/i);
});

test("schema de auditoria registra a tentativa, ator, ambiente efetivo e erro seguro", () => {
  const code = readFileSync(file, "utf8");
  assert.match(code, /CREATE TABLE asaas_reconciliation_audit/);
  for (const field of ["attempt_id", "request_id", "actor_id", "purchase_id", "payment_id", "configured_environment", "consulted_environment", "endpoint_action", "safe_error_code", "http_status", "reason_summary", "outcome", "attempted_at"]) {
    assert.match(code, new RegExp(`\\b${field}\\b`), `campo obrigatório: ${field}`);
  }
  assert.match(code, /ENGINE=InnoDB/);
  assert.match(code, /UNIQUE INDEX uq_ara_attempt_phase/);
});
