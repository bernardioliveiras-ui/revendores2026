import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

async function read(path) { return readFile(new URL(`../${path}`, import.meta.url), 'utf8'); }

test('portal possui termos, privacidade, cookies e reembolso/devolução', async () => {
  for (const path of ['app/termos-de-uso/page.tsx','app/politica-de-privacidade/page.tsx','app/cookies/page.tsx','app/reembolso-e-devolucao/page.tsx']) {
    await access(new URL(`../${path}`, import.meta.url));
  }
  const footer = await read('components/legal-footer.tsx');
  assert.match(footer, /\/termos-de-uso/);
  assert.match(footer, /\/politica-de-privacidade/);
  assert.match(footer, /\/cookies/);
  assert.match(footer, /\/reembolso-e-devolucao/);
});

test('entrada usa login por senha e não código por e-mail', async () => {
  const login = await read('app/entrar/login-form.tsx');
  assert.match(login, /\/api\/auth\/login/);
  assert.match(login, /password/i);
  assert.doesNotMatch(login, /código de 6 dígitos|solicitar código/i);
});

test('produção não expõe equipe nem descreve Resend como operador ativo', async () => {
  const portal = await read('app/painel/portal-client.tsx');
  const privacy = await read('app/politica-de-privacidade/page.tsx');
  const terms = await read('app/termos-de-uso/page.tsx');
  assert.doesNotMatch(portal, /\["team",\s*"Minha equipe"/);
  assert.doesNotMatch(portal, /Minha equipe|Convidar usuário|Convidar para a equipe/);
  assert.doesNotMatch(privacy, /Resend/i);
  assert.doesNotMatch(terms, /código de 6 dígitos/i);
});
