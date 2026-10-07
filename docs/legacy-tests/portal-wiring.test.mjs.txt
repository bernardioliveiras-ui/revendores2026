import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../app/painel/portal-client.tsx', import.meta.url), 'utf8');

test('navegação para áreas de revenda sem organização abre o cadastro em vez de botão morto', () => {
  assert.match(source, /shouldPromptResellerSetup/);
  assert.match(source, /setOnboardingOpen\(true\)/);
  assert.match(source, /function openView\(/);
});

test('ações de pedido, movimentação e indicação passam pelo guard de revenda', () => {
  assert.match(source, /openResellerDialog\(setOrderOpen\)/);
  assert.match(source, /openResellerDialog\(setMovementOpen\)/);
  assert.match(source, /openResellerDialog\(setReferralOpen\)/);
});
