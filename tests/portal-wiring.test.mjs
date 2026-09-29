import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../app/painel/portal-client.tsx', import.meta.url), 'utf8');

test('portal do revendedor carrega estoque e indicações por sessão', () => {
  assert.match(source, /fetch\("\/api\/stock"/);
  assert.match(source, /fetch\("\/api\/referrals"/);
  assert.match(source, /location\.href="\/entrar"/);
});

test('ações principais usam endpoints atuais do portal simples', () => {
  assert.match(source, /fetch\("\/api\/sales"/);
  assert.match(source, /fetch\("\/api\/referrals",\{method:"POST"/);
  assert.match(source, /Registrar venda/);
  assert.match(source, /Gerar link de indicação/);
});
