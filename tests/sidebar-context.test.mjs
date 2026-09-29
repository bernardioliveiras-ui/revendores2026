import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../app/painel/portal-client.tsx', import.meta.url), 'utf8');

test('portal separa visão BKO da visão do revendedor pelo papel da sessão', () => {
  assert.match(source, /user\.role==="admin"/);
  assert.match(source, /BKO MIX10 PRO/);
  assert.match(source, /PortalHeader user=\{user\}/);
});
