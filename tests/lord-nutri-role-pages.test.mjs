import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('influenciador usa cinco páginas exclusivas, com navegação por botões e sem âncoras de rolagem', async () => {
  const source = await readFile(new URL('../components/indicator-portal.tsx',import.meta.url),'utf8');
  assert.match(source,/type InfluencerPage = "overview"\|"campaigns"\|"cashback"\|"materials"\|"profile"/);
  assert.match(source,/const \[activePage,setActivePage\]/);
  for(const page of ['overview','campaigns','cashback','materials','profile']){
    assert.match(source,new RegExp(`activePage==="${page}"`));
  }
  assert.doesNotMatch(source,/<a href="#influencer-(overview|campaign|cashback|materials|profile)"/);
});

test('revendedor tem Meu Perfil e Venda Rápida sem tela de Indicações', async () => {
  const source = await readFile(new URL('../app/painel/portal-client.tsx',import.meta.url),'utf8');
  assert.match(source,/\["profile","Meu Perfil"\]/);
  assert.match(source,/ResellerQuickSale/);
  assert.doesNotMatch(source,/\["referrals","Indicações"\]/);
  assert.match(source,/user\.role === "indicator"/);
});

test('BKO mostra cartões independentes por campanha real e seus links próprios', async () => {
  const source = await readFile(new URL('../components/indicator-admin.tsx',import.meta.url),'utf8');
  assert.match(source,/className="lord-admin-campaign-grid"/);
  assert.match(source,/campaigns\.map\(c=>/);
  assert.match(source,/c\.publicCode/);
  assert.match(source,/indicators\.find\(i=>i\.userId===c\.indicatorUserId\)/);
  assert.doesNotMatch(source,/exemplo\.test/);
});
