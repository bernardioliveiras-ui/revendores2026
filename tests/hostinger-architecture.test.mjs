import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
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
  assert.match(pkg.scripts.build, /next build/);
  assert.equal(pkg.scripts.start, 'next start');
  assert.ok(pkg.dependencies.mysql2);
  assert.ok(pkg.dependencies['drizzle-orm']);
  assert.equal(pkg.devDependencies?.wrangler, undefined);
  assert.equal(pkg.devDependencies?.vinext, undefined);
  for (const [file, source] of await productionSources()) {
    assert.doesNotMatch(source, /cloudflare:workers|drizzle-orm\/d1|sqlite-core|\bD1\b|cf-connecting-ip/i, file);
  }
});

test('pacote contém bootstrap MySQL e exemplo de ambiente Hostinger', async () => {
  await access(new URL('../database/schema.sql', import.meta.url));
  const env = await text('.env.example');
  for (const name of ['DATABASE_HOST','DATABASE_NAME','DATABASE_USER','DATABASE_PASSWORD','AUTH_SECRET','ADMIN_EMAILS','ADMIN_BOOTSTRAP_PASSWORD','ASAAS_API_KEY','NEXT_PUBLIC_APP_URL']) {
    assert.match(env, new RegExp(`^${name}=`, 'm'), name);
  }
  assert.doesNotMatch(env, /RESEND_API_KEY|EMAIL_FROM/);
  assert.doesNotMatch(env, /AKIA|sk_live|re_[A-Za-z0-9]{20,}|\$aact_/i);
});

test('schema SQL contém todas as tabelas funcionais do portal', async () => {
  const sql = await text('database/schema.sql');
  for (const table of ['users','auth_sessions','purchases','reseller_profiles','stock_movements','sales','affiliate_referrals','affiliate_clicks','asaas_events']) {
    assert.match(sql, new RegExp('CREATE TABLE IF NOT EXISTS `?' + table + '`?', 'i'), table);
  }
});

test('nenhuma query mantém APIs SQLite incompatíveis com MySQL', async () => {
  for (const [file, source] of await productionSources()) {
    assert.doesNotMatch(source, /\.onConflictDoNothing\(|\.onConflictDoUpdate\(|\.returning\(/, file);
  }
});
