import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, generateTemporaryPassword } from '../lib/passwords.ts';

test('hash corrompido com digest vazio não autentica qualquer senha', async () => {
  const salt=Buffer.alloc(16,1).toString('base64url');
  assert.equal(await verifyPassword('qualquer senha',`scrypt$${salt}$!`),false);
});

test('senha é armazenada com scrypt e verificada sem plaintext', async () => {
  const encoded = await hashPassword('Senha@123');
  assert.match(encoded, /^scrypt\$/);
  assert.equal(encoded.includes('Senha@123'), false);
  assert.equal(await verifyPassword('Senha@123', encoded), true);
  assert.equal(await verifyPassword('errada', encoded), false);
});

test('senha temporária tem tamanho e diversidade mínimos', () => {
  const value = generateTemporaryPassword();
  assert.ok(value.length >= 12);
  assert.match(value, /[A-Z]/);
  assert.match(value, /[a-z]/);
  assert.match(value, /\d/);
});
