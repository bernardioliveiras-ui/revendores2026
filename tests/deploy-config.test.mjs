import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('deploy alvo é Node/Hostinger e não executa Wrangler ou D1', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts.build, 'next build');
  assert.equal(pkg.scripts.start, 'node scripts/migrate.mjs && next start');
  assert.equal(pkg.scripts['start:app'], 'next start');
  assert.equal(pkg.engines.node, '22.x');
  const scripts = JSON.stringify(pkg.scripts);
  assert.doesNotMatch(scripts, /wrangler|d1/i);
});
