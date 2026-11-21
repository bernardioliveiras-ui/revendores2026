import test from 'node:test';
import assert from 'node:assert/strict';
import { load, memoryDb, operators, table } from './runtime-loader.mjs';
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

test('renomear campanha própria troca imediatamente o link e conserva o código de atribuição', async()=>{
  const code='d'.repeat(32);
  const indicatorCampaigns=table('id','indicatorUserId','name','publicSlug','publicCode','active','updatedAt');
  const state=memoryDb({indicatorCampaigns},{indicatorCampaigns:[{id:'c1',indicatorUserId:'u1',name:'Mix Sponda',publicSlug:'mix-sponda',publicCode:code,active:1}]});
  const {POST}=load('app/api/indicator/campaign/route.ts',{
    'drizzle-orm':operators,
    '@/db':{getDb:()=>state.db},'@/db/schema':{indicatorCampaigns},
    '@/lib/auth':{requireIndicator:async()=>({id:'u1'})},
    '@/lib/indicator-terms-store':{requireIndicatorTerms:async()=>{}},
    '@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},
    '@/lib/campaign-slug.mjs':{campaignSlug},
    '@/lib/indicator-security':{cleanText:v=>String(v||'').trim(),indicatedError:e=>Response.json({error:e.message},{status:500}),privateResponseHeaders:{}},
    '@/lib/asaas':{getAsaasConfig:()=>({environment:'sandbox'})},
    '@/lib/campaign-metrics.mjs':{summarizeCampaign:()=>({})},
  });
  const r=await POST(new Request('https://teste.local/api/indicator/campaign',{method:'POST',body:JSON.stringify({name:'Spondinha'})}));
  assert.equal(r.status,200);
  assert.deepEqual((await r.json()).salesPath,'/v/spondinha');
  assert.equal(state.rows.indicatorCampaigns[0].publicSlug,'spondinha');
  assert.equal(state.rows.indicatorCampaigns[0].publicCode,code);
});

test('renomear para nome já usado reserva sufixo e não muda campanha de outra pessoa', async()=>{
  const indicatorCampaigns=table('id','indicatorUserId','name','publicSlug','publicCode','active','updatedAt');
  const rows=[{id:'c1',indicatorUserId:'u1',name:'Minha camp',publicSlug:'minha-camp',publicCode:'1'.repeat(32),active:1},
    {id:'c2',indicatorUserId:'u2',name:'Promo',publicSlug:'promo',publicCode:'2'.repeat(32),active:1}];
  const state=memoryDb({indicatorCampaigns},{indicatorCampaigns:rows});
  const {POST}=load('app/api/indicator/campaign/route.ts',{
    'drizzle-orm':operators,'@/db':{getDb:()=>state.db},'@/db/schema':{indicatorCampaigns},
    '@/lib/auth':{requireIndicator:async()=>({id:'u1'})},'@/lib/indicator-terms-store':{requireIndicatorTerms:async()=>{}},
    '@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},'@/lib/campaign-slug.mjs':{campaignSlug},
    '@/lib/indicator-security':{cleanText:v=>String(v||'').trim(),indicatedError:e=>Response.json({error:e.message},{status:500}),privateResponseHeaders:{}},
    '@/lib/asaas':{getAsaasConfig:()=>({environment:'sandbox'})},'@/lib/campaign-metrics.mjs':{summarizeCampaign:()=>({})},
  });
  const result=await POST(new Request('https://teste.local/api/indicator/campaign',{method:'POST',body:JSON.stringify({name:'Promo'})}));
  assert.equal((await result.json()).salesPath,'/v/promo-2');
  assert.equal(state.rows.indicatorCampaigns[1].publicSlug,'promo');
});

test('BKO também altera o endereço amigável ao salvar nome da campanha',async()=>{
  const indicatorCampaigns=table('id','indicatorUserId','name','publicSlug','publicCode','active','updatedAt');
  const indicatorProfiles=table('userId','role','status','id');
  const users=table('id','role','status');
  const code='7'.repeat(32);
  const state=memoryDb({indicatorCampaigns,indicatorProfiles,users},{
    indicatorCampaigns:[{id:'c1',indicatorUserId:'u1',name:'Mix Sponda',publicSlug:'mix-sponda',publicCode:code,active:1}],
    indicatorProfiles:[{userId:'u1',id:'u1',role:'indicator',status:'active'}],
    users:[{id:'u1',role:'indicator',status:'active'}],
  });
  const select=state.db.select;
  state.db.select=(...args)=>({from:(tableRef)=>{const query=select(...args).from(tableRef);query.innerJoin=()=>query;return query;}});
  const {POST}=load('app/api/admin/indicators/campaign/route.ts',{
    'drizzle-orm':operators,'@/db':{getDb:()=>state.db},'@/db/schema':{indicatorCampaigns,indicatorProfiles,users},
    '@/lib/auth':{requireAdmin:async()=>({id:'admin'})},'@/lib/campaign-schema':{ensureCampaignSchema:async()=>{}},
    '@/lib/campaign-slug.mjs':{campaignSlug},'@/lib/indicator-cashback.mjs':{validCampaignCashback:()=>true},
    '@/lib/indicator-security':{cleanText:v=>String(v||'').trim(),indicatedError:e=>Response.json({error:e.message},{status:500}),privateResponseHeaders:{}},
  });
  const response=await POST(new Request('https://teste.local/api/admin/indicators/campaign',{method:'POST',body:JSON.stringify({indicatorUserId:'u1',name:'Spondinha'})}));
  assert.equal(response.status,200);
  const payload=await response.json();
  assert.equal(payload.salesPath,'/v/spondinha');
  assert.equal(payload.code,code);
  assert.equal(state.rows.indicatorCampaigns[0].publicSlug,'spondinha');
});
