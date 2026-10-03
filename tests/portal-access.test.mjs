import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldPromptResellerSetup, isResellerView } from '../lib/portal-access.ts';

test('admin sem revenda recebe cadastro ao tentar usar pedidos, vendas ou indicações', () => {
  for (const view of ['overview', 'orders', 'movements', 'referrals', 'team']) {
    assert.equal(isResellerView(view), true);
    assert.equal(shouldPromptResellerSetup({ hasOrganization: false, view }), true);
  }
});

test('admin sem revenda continua podendo abrir o administrativo e o manual', () => {
  assert.equal(shouldPromptResellerSetup({ hasOrganization: false, view: 'admin' }), false);
  assert.equal(shouldPromptResellerSetup({ hasOrganization: false, view: 'manual' }), false);
});

test('usuário com revenda não recebe bloqueio de cadastro', () => {
  assert.equal(shouldPromptResellerSetup({ hasOrganization: true, view: 'orders' }), false);
  assert.equal(shouldPromptResellerSetup({ hasOrganization: true, view: 'movements' }), false);
  assert.equal(shouldPromptResellerSetup({ hasOrganization: true, view: 'referrals' }), false);
});
