import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('layout do portal não cria corte horizontal que interfere no sticky', () => {
  assert.match(css, /html\s*\{[^}]*scroll-behavior:\s*smooth/);
  assert.match(css, /body\s*\{[^}]*margin:\s*0/);
});

test('menu lateral do portal mantém navegação compacta e estados ativos', () => {
  assert.match(css, /\.portal-layout\s*\{[^}]*grid-template-columns:\s*220px 1fr/);
  assert.match(css, /\.portal-sidebar\s*\{[^}]*display:\s*flex/);
  assert.match(css, /\.portal-sidebar button\.active/);
});
