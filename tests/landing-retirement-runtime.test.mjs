import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './runtime-loader.mjs';

function routes(authError) {
  const calls = [];
  const cms = {
    isStudioDocType: type => ['landing', 'manual', 'products', 'media'].includes(type),
    getStudioDoc: async type => { calls.push(type); return { type, published: { text: 'Atual' } }; },
    saveStudioDraft: async type => { calls.push(type); return { type }; },
    publishStudioDoc: async type => { calls.push(type); return { type }; },
  };
  const auth = { requireAdmin: async () => { if (authError) throw Error(authError); }, getSessionUser: async () => null };
  const mocks = { '@/lib/auth': auth, '@/lib/content-studio': cms };
  return { admin: load('app/api/admin/cms/[type]/route.ts', mocks), public: load('app/api/public/cms/[type]/route.ts', mocks), calls };
}
const context = type => ({ params: Promise.resolve({ type }) });
const request = method => new Request('https://example.test/api/admin/cms/landing', { method });

test('LP antiga retorna 410 e não lê nem grava documentos no CMS', async () => {
  const r = routes();
  for (const method of ['GET', 'PATCH', 'POST']) assert.equal((await r.admin[method](request(method), context('landing'))).status, 410);
  assert.equal((await r.public.GET(request('GET'), context('landing'))).status, 410);
  assert.deepEqual(r.calls, []);
});
test('retirada do Studio preserva a autorização do BKO e o conteúdo restante', async () => {
  for (const [error, status] of [['UNAUTHORIZED', 401], ['FORBIDDEN', 403]]) {
    const r = routes(error);
    for (const method of ['GET', 'PATCH', 'POST']) assert.equal((await r.admin[method](request(method), context('landing'))).status, status);
    assert.deepEqual(r.calls, []);
  }
  const r = routes();
  for (const type of ['manual', 'products', 'media']) assert.equal((await r.admin.GET(request('GET'), context(type))).status, 200);
  assert.deepEqual(r.calls, ['manual', 'products', 'media']);
});
test('endpoint público antigo nunca expõe o conteúdo do manual privado', async () => {
  const r = routes();
  for (const suffix of ['', '?preview=draft']) {
    const response = await r.public.GET(new Request('https://example.test/api/public/cms/manual' + suffix), context('manual'));
    assert.equal(response.status, 410);
    assert.doesNotMatch(await response.text(), /Atual|published|draft/);
  }
  assert.deepEqual(r.calls, []);
  for (const type of ['products', 'media']) assert.equal((await r.public.GET(request('GET'), context(type))).status, 200);
});
