import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

async function text(path) { return readFile(new URL(`../${path}`, import.meta.url), 'utf8'); }

const productionGlobs = ['app/**/*.ts','app/**/*.tsx','lib/**/*.ts','db/**/*.ts'];

async function productionSources() {
  const items = [];
  for (const pattern of productionGlobs) {
    for await (const file of glob(pattern, { cwd: fileURLToPath(new URL('..', import.meta.url)) })) {
      items.push([file, await readFile(new URL(`../${file}`, import.meta.url), 'utf8')]);
    }
  }
  return items;
}

test('produção usa Next Node e MySQL sem runtime Cloudflare/D1', async () => {
  const pkg = JSON.parse(await text('package.json'));
  assert.equal(pkg.scripts.dev, 'next dev');
  assert.equal(pkg.scripts.build, 'next build --webpack');
  assert.equal(pkg.scripts.start, 'node scripts/migrate.mjs && next start');
  assert.ok(pkg.dependencies.mysql2);
  assert.ok(pkg.dependencies['drizzle-orm']);
  assert.equal(pkg.devDependencies?.wrangler, undefined);
  assert.equal(pkg.devDependencies?.vinext, undefined);
  for (const [file, source] of await productionSources()) {
    assert.doesNotMatch(source, /cloudflare:workers|drizzle-orm\/d1|sqlite-core|\bD1\b|cf-connecting-ip/i, file);
  }
});

test('nenhuma query mantém APIs SQLite incompatíveis com MySQL', async () => {
  for (const [file, source] of await productionSources()) {
    assert.doesNotMatch(source, /\.onConflictDoNothing\(|\.onConflictDoUpdate\(|\.returning\(/, file);
  }
});
