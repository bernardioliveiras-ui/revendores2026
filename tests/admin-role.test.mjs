import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const auth = await readFile(new URL('../lib/auth.ts', import.meta.url), 'utf8');
const login = await readFile(new URL('../app/api/auth/login/route.ts', import.meta.url), 'utf8');
const verify = await readFile(new URL('../app/api/auth/verify-code/route.ts', import.meta.url), 'utf8');

test('ADMIN_EMAILS controla bootstrap administrativo no login por senha', () => {
  assert.match(auth, /role:\s*users\.role/);
  assert.match(auth, /user\.role\s*!==\s*"admin"/);
  assert.match(login, /isAdminEmail\(email\)/);
  assert.match(login, /role:\s*"admin"/);
});

test('login por código legado permanece desativado', () => {
  assert.match(verify, /substituído por e-mail e senha/);
  assert.match(verify, /status:\s*410/);
  assert.doesNotMatch(verify, /systemRole/);
});
