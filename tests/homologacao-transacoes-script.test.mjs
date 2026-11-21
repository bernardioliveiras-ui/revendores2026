import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const target = new URL("../scripts/homologacao-transacoes-mariadb.php", import.meta.url);

test("homologação de linhas é CLI-only, exige banco autorizado e senha transitória", () => {
  const source = readFileSync(target, "utf8");
  assert.match(source, /PHP_SAPI\s*!==\s*'cli'/);
  assert.match(source, /const HOMOLOG_DB\s*=\s*'u922332919_revmix10'/);
  assert.match(source, /AUTORIZO_TABELA/);
  assert.match(source, /--senha-stdin/);
  assert.doesNotMatch(source, /getenv\s*\(\s*['"](?:PASS|PASSWORD|DATABASE_PASSWORD)/i);
});

test("homologação só modifica uma tabela sintética com limpeza explícita", () => {
  const source = readFileSync(target, "utf8");
  assert.match(source, /lordnutri_hml_tx_/);
  assert.match(source, /ENGINE=InnoDB/i);
  assert.match(source, /CREATE TABLE/);
  assert.match(source, /DROP TABLE/);
  assert.match(source, /finally\s*\{/);
  assert.doesNotMatch(source, /\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|DROP\s+TABLE|ALTER\s+TABLE)\s+`?(?:users|purchases|reseller_profiles|stock_movements|asaas_events)\b/i);
});

test("homologação exercita lock InnoDB, timeout, rollback e unicidade", () => {
  const source = readFileSync(target, "utf8");
  assert.match(source, /innodb_lock_wait_timeout/);
  assert.match(source, /begin_transaction\s*\(/);
  assert.match(source, /rollback\s*\(/);
  assert.match(source, /commit\s*\(/);
  assert.match(source, /1205/);
  assert.match(source, /1062/);
});
