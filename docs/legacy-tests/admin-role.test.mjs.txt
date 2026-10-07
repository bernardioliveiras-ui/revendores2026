import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const auth = await readFile(new URL('../lib/auth.ts', import.meta.url), 'utf8');
const verify = await readFile(new URL('../app/api/auth/verify-code/route.ts', import.meta.url), 'utf8');

test('ADMIN_EMAILS é a fonte atual de permissão administrativa, sem admin residual no banco', () => {
  assert.doesNotMatch(auth, /session\.systemRole\s*===\s*["']admin["']\s*\|\|/);
  assert.match(auth, /systemRole:\s*isAdminEmail\(session\.email\)\s*\?\s*["']admin["']\s*:\s*["']member["']/s);
});

test('novo login também remove papel admin armazenado quando e-mail não está mais em ADMIN_EMAILS', () => {
  assert.match(verify, /systemRole:\s*admin\s*\?\s*["']admin["']\s*:\s*["']member["']/s);
  assert.doesNotMatch(verify, /systemRole:\s*admin\s*\?\s*["']admin["']\s*:\s*user\.systemRole/);
});
