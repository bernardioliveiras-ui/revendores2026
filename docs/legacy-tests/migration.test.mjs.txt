import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('migration estrutural é aditiva e preserva dados existentes', async () => {
  const migration = await read('database/migrations/2026-09-18-structural-update.sql');
  assert.match(migration, /ADD COLUMN\s+`?password_hash`?/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `initial_purchases`/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `access_provisioning`/i);
  assert.match(migration, /ADD COLUMN\s+`?order_type`?/i);
  assert.doesNotMatch(migration, /DROP\s+TABLE|TRUNCATE|DELETE\s+FROM/i);
});

test('guia BKO ensina aquisição automática e expedição sem rastreio obrigatório', async () => {
  const guide = await read('BKO-CADASTRO-E-EXPEDICAO.md');
  assert.match(guide, /Pagamento confirmado/i);
  assert.match(guide, /automaticamente/i);
  assert.match(guide, /Abrir WhatsApp/i);
  assert.match(guide, /rastreio.*opcional/i);
  assert.match(guide, /métricas/i);
});

test('erro de schema orienta a migration correta para banco existente', async () => {
  const currentUser = await read('lib/current-user.ts');
  assert.match(currentUser, /2026-09-18-structural-update\.sql/);
});
