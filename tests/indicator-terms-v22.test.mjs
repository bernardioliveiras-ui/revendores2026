import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {INDICATOR_TERMS, INDICATOR_TERMS_VERSION, INDICATOR_CASHBACK_NOTICE, indicatorTermsPlainText} from '../lib/indicator-terms.ts';
const read=(f)=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
test('Termos têm versão, texto integral, autonomia e privacidade',()=>{
 assert.match(INDICATOR_TERMS_VERSION,/^\d{4}-\d{2}-\d{2}\.\d+$/);
 assert.equal(INDICATOR_TERMS.length,12);
 assert.match(indicatorTermsPlainText(),/sem exclusividade/);
 assert.match(indicatorTermsPlainText(),/vínculo depende da realidade/);
 assert.match(indicatorTermsPlainText(),/endereço IP/);
 assert.match(indicatorTermsPlainText(),/sextas-feiras/);
 assert.match(indicatorTermsPlainText(),/sem frete e juros/);
 assert.match(INDICATOR_CASHBACK_NOTICE,/R\$ 100,00/);
});
test('Nenhum aceite por omissão ou checkbox pré-marcado',()=>{
 const form=read('components/indicator-portal.tsx');
 assert.match(form,/useState\(false\),\[termsBusy/);
 assert.match(form,/disabled=\{!termsCheck\|\|termsBusy\}/);
 assert.match(form,/checked=\{termsCheck\}/);
 assert.match(form,/t\.accepted/);
});
test('API guarda versão, hash, snapshot e mantém aceite por usuário único',()=>{
 const api=read('app/api/indicator/terms/route.ts');
 const store=read('lib/indicator-terms-store.ts');
 const schema=read('database/schema.sql');
 assert.match(api,/body\?\.accepted!==true/);
 assert.match(api,/body\?\.sha256!==currentTermsHash/);
 assert.match(api,/request\.headers\.get\("origin"\)/);
 assert.match(store,/createHash\("sha256"\)/);
 for(const f of [api,store,schema])assert.match(f,/indicator_terms_acceptances/);
 assert.match(schema,/UNIQUE KEY `idx_indicator_terms_once`/);
 for(const column of ['terms_version','terms_snapshot','terms_sha256','accepted_at','ip_address','user_agent'])assert.ok(schema.includes(column));
});
test('Campanha e APIs legadas do indicador exigem aceite',()=>{
 for(const f of ['app/api/indicator/campaign/route.ts','app/api/indicator/leads/route.ts','app/api/indicator/leads/share/route.ts','app/api/indicator/receipt/route.ts'])assert.match(read(f),/requireIndicatorTerms\(user\.id\)/,f);
});
test('BKO restringe auditoria à conta admin e reset de testes limpa evidências de testes',()=>{
 const admin=read('app/api/admin/indicators/terms/route.ts');
 assert.match(admin,/requireAdmin\(request\)/);
 assert.match(read('scripts/reset-test-data.mjs'),/"indicator_terms_acceptances"/);
});
