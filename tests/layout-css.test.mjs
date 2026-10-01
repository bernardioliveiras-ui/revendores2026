import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('layout do portal não cria corte horizontal que interfere no sticky', () => {
  assert.match(css, /body\s*\{[\s\S]*overflow-x:\s*clip;/);
  assert.match(css, /html\s*\{[^}]*overflow-x:\s*clip;/);
});

test('menu lateral mantém cabeçalho e saída visíveis e rola somente a navegação', () => {
  assert.match(css, /\.portal-sidebar\s*\{[^}]*overflow:\s*hidden;/);
  assert.match(css, /\.portal-sidebar\s+nav\s*\{[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/);
});
