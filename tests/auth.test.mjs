import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFile(join(root, p), 'utf8');

test('auth uses email plus password with forced first password change', async () => {
  const login = await read('app/api/auth/login/route.ts');
  assert.match(login, /ADMIN_BOOTSTRAP_PASSWORD/);
  assert.match(login, /mustChangePassword/);
  assert.match(login, /MAX_ATTEMPTS\s*=\s*5/);
  assert.match(login, /LOCK_MINUTES\s*=\s*15/);
  assert.doesNotMatch(login, /request-code|verify-code|Resend|otp/i);
});

test('password module stores scrypt hashes and can generate temporary credentials', async () => {
  const source = await read('lib/passwords.ts');
  assert.match(source, /scrypt/);
  assert.match(source, /generateTemporaryPassword/);
  assert.doesNotMatch(source, /bcrypt|plaintext/i);
});

test('login UI is Bern-style email and password without OTP', async () => {
  const form = await read('app/entrar/login-form.tsx');
  assert.match(form, /type="email"/);
  assert.match(form, /type="password"/);
  assert.doesNotMatch(form, /código|otp|resend/i);
});
