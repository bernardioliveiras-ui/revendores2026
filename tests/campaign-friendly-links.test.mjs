import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './runtime-loader.mjs';
import { campaignSlug, reserveCampaignSlugs } from '../lib/campaign-slug.mjs';

test('a URL legível usa o nome da campanha sem expor o identificador técnico', () => {
  assert.equal(campaignSlug('MIX-BERNARDO-NOVEMBRO'), 'mix-bernardo-novembro');
  assert.equal(campaignSlug('  Campanha São João!  '), 'campanha-sao-joao');
  assert.equal(campaignSlug('A & B / Promoção #1'), 'a-b-promocao-1');
});

test('campanhas repetidas recebem endereços únicos e os já publicados não mudam', () => {
  const existing = [
    { id:'a', name:'TORREI', publicSlug:'torrei' },
    { id:'b', name:'TORREI', publicSlug:null },
    { id:'c', name:'Mix Bernardo Novembro', publicSlug:null },
  ];
  assert.deepEqual(reserveCampaignSlugs(existing), [
    {id:'b',slug:'torrei-2'}, {id:'c',slug:'mix-bernardo-novembro'},
  ]);
  assert.deepEqual(reserveCampaignSlugs(existing.filter(row => row.publicSlug)), []);
});

test('link amigável de venda credita o mesmo código interno que o link antigo', async () => {
  const oldCode='f'.repeat(32);
  const updates=[];
  const { GET } = load('app/v/[code]/route.ts', {
    'drizzle-orm': { eq: (column, value) => [column,value], sql:()=>({}) },
    '@/db': { getDb: () => ({update:()=>({set:()=>({where:async (...args)=>updates.push(args)})})}) },
    '@/db/schema': { indicatorCampaigns:{id:'id'} },
    '@/lib/campaigns': {resolveCampaign: async slug => ['mix-bernardo-novembro',oldCode].includes(slug)
      ? {id:'camp-id',code:oldCode,name:'Mix Bernardo Novembro'} : null},
  });
  for (const path of ['mix-bernardo-novembro', oldCode]) {
    const response = await GET(new Request(`https://example.test/v/${path}?utm_source=instagram`),{params:Promise.resolve({code:path})});
    assert.equal(response.status,302);
    assert.equal(response.headers.get('location'),`/comprar?venda=${oldCode}&utm_source=instagram`);
  }
  assert.equal(updates.length,2);
  assert.equal((await GET(new Request('https://example.test/v/desconhecida'),{params:Promise.resolve({code:'desconhecida'})})).status,404);
});

test('redirecionamento legado do link /c também preserva o cookie técnico',async()=>{
  const code='e'.repeat(32);
  const {GET}=load('app/c/[code]/route.ts',{
    'drizzle-orm': { eq:()=>null,sql:()=>null },
    '@/db':{getDb:()=>({update:()=>({set:()=>({where:async()=>{}})})})},
    '@/db/schema':{indicatorCampaigns:{}},
    '@/lib/campaigns':{CAMPAIGN_COOKIE:'ln_campaign',resolveCampaign:async()=>({id:'camp',code})},
    '@/lib/indicator-security':{INDICATOR_PURCHASE_URL:'https://example.test/comprar'},
  });
  const res=await GET(new Request('https://example.test/c/mix-bernardo-novembro'),{params:Promise.resolve({code:'mix-bernardo-novembro'})});
  assert.equal(res.status,302);
  assert.equal(new URL(res.headers.get('location')).searchParams.get('campanha'),code);
  assert.match(res.headers.get('set-cookie'),new RegExp(`ln_campaign=${code}`));
});
