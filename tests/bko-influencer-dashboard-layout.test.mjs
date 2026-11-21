import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);

function renderInfluencerAdmin() {
  const source = readFileSync(new URL('../components/indicator-admin.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const replacements = {
    '@/components/payment-sync': { PaymentSync: () => null },
    '@/components/checkout-funnel': { CheckoutFunnel: () => React.createElement('div', { 'data-checkout-funnel': 'true' }, 'FUNIL_OPERACIONAL') },
    '@/lib/indicator-search.mjs': { campaignCodeFromSearch: () => null, matchesIndicatorSearch: () => true },
    '@/lib/campaign-metrics.mjs': { summarizeCampaign: () => ({}), isVerifiedPaid: () => false, isPendingPix: () => false, isRecoveryOpportunity: () => false },
    'lucide-react': { Search: () => React.createElement('svg', { 'aria-hidden': true }) },
  };
  const exports = {};
  new Function('require', 'exports', compiled)(id => replacements[id] ?? require(id), exports);
  return renderToStaticMarkup(React.createElement(exports.IndicatorAdmin));
}

test('BKO abre influenciadores com indicadores e campanhas em destaque; funil operacional fica recolhido ao final', () => {
  const html = renderInfluencerAdmin();
  const card = html.indexOf('Campanhas e links');
  const funnel = html.indexOf('FUNIL_OPERACIONAL');
  assert.ok(card >= 0, 'Gestão de campanhas deve estar visível');
  assert.ok(html.indexOf('Influenciadores ativos') > -1, 'Deve haver indicador de influenciadores ativos');
  assert.ok(html.indexOf('Cashback apurado') > -1, 'Deve haver indicador financeiro exclusivo do canal');
  assert.ok(funnel > card, 'Funil de checkout não deve ocupar o topo dos influenciadores');
  assert.match(html, /<details[^>]*class="indicator-admin-technical"[^>]*>[\s\S]*FUNIL_OPERACIONAL[\s\S]*<\/details>/);
  assert.doesNotMatch(html, /<details[^>]*class="indicator-admin-technical"[^>]*open=/);
});
