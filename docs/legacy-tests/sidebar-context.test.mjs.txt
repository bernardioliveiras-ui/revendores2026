import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../app/painel/portal-client.tsx', import.meta.url), 'utf8');

test('conta administrativa sem revenda não é rotulada falsamente como revenda ativa', () => {
  assert.match(source, /organization\s*\?\s*["']Revenda ativa["']\s*:\s*["']Modo administrativo["']/);
});
