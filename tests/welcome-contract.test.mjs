import test from 'node:test';
import assert from 'node:assert/strict';
import { welcomeEndpoint, welcomeKey } from '../lib/welcome-contract.ts';
test('welcome requires HTTPS and rejects URL credentials',()=>{
 assert.equal(welcomeEndpoint('http://automation.test/hook'),null);
 assert.equal(welcomeEndpoint('https://user:pass@automation.test/hook'),null);
 assert.equal(welcomeEndpoint('https://automation.test/hook'),'https://automation.test/hook');
 assert.equal(welcomeEndpoint(''),null);
});
test('retries use stable welcome idempotency key per purchase',()=>{
 assert.equal(welcomeKey('order1'),welcomeKey('order1'));
 assert.notEqual(welcomeKey('order1'),welcomeKey('order2'));
});

test('password resets use a new welcome generation without duplicating a retry',()=>{
 assert.equal(welcomeKey('order1','iv1'),welcomeKey('order1','iv1'));
 assert.notEqual(welcomeKey('order1','iv1'),welcomeKey('order1','iv2'));
});
