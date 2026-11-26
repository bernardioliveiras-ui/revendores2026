import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import {posix} from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
export function component(path, mocks = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, root), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)((id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.endsWith('.css')) return {};
    if (id.startsWith('@/')||id.startsWith('.')) {
      const base = id.startsWith('@/')?id.slice(2):posix.normalize(posix.join(posix.dirname(path),id));
      if(base.endsWith('.json'))return {default:JSON.parse(readFileSync(new URL(base,root),'utf8'))};
      for (const ext of ['.tsx', '.ts']) {
        try { readFileSync(new URL(base + ext, root)); } catch { continue; }
        return component(base + ext, mocks);
      }
      throw new Error('Unknown local module ' + id);
    }
    return require(id);
  }, exports);
  return exports;
}

test('texto publicado aparece no título preservando as seções da LP',async()=>{
 const {default:Home}=component('app/page.tsx',{
  '@/lib/landing-texts-store':{readPublishedLandingTexts:async()=>({'inicio.title':'Título que eu editei no Studio'})},
  '@/components/checkout-form':{CheckoutForm:()=>React.createElement('form')},
  '@/components/profit-simulator':{ProfitSimulator:()=>React.createElement('div')},
 });
 const html=renderToStaticMarkup(await Home());
 assert.match(html,/Título que eu editei no Studio/);
 for(const id of ['inicio','lord-nutri','mix10pro','modelo','simulador','kits','duvidas','checkout'])assert.ok(html.includes(`id="${id}"`));
});

test('a notificação ANVISA editada no Studio aparece na LP e na prévia, sem o número fixo anterior',async()=>{
 const {default:Home}=component('app/page.tsx',{
  '@/lib/landing-texts-store':{readPublishedLandingTexts:async()=>({'mix10pro.007':'Processo de Notificação Anvisa Nº 25351.205227/2026-38'})},
 });
 const html=renderToStaticMarkup(await Home());
 assert.match(html,/Processo de Notificação/);
 assert.match(html,/25351\.205227\/2026-38/);
 assert.doesNotMatch(html,/25351155726202677/);
 assert.match(html,/aria-label="Processo de Notificação Anvisa Nº 25351\.205227\/2026-38"/);
});

test('texto livre da notificação é visível e escapado sem HTML injetado',async()=>{
 const {default:Home}=component('app/page.tsx',{
  '@/lib/landing-texts-store':{readPublishedLandingTexts:async()=>({'mix10pro.007':'Aviso atualizado <teste>'})},
 });
 const html=renderToStaticMarkup(await Home());
 assert.match(html,/Aviso atualizado &lt;teste&gt;/);
 assert.doesNotMatch(html,/<teste>/);
});

test('sem edições a LP mantém conteúdo, formulário e simulador originais, permitindo atualização da logo',async()=>{
 const {default:Home}=component('app/page.tsx',{'@/lib/landing-texts-store':{readPublishedLandingTexts:async()=>({})}});
 const canonical=(html)=>html.replace(/<img\b(?=[^>]*alt="(?:LORD NUTRI GROUP|Símbolo LORD NUTRI)")[^>]*>/g,'<img data-brand="LORD NUTRI"/>')
   .replace(/lordnutri-logo-(?:gold-v3|2026)\.png/g,'lordnutri-logo-current.png');
 assert.equal(canonical(renderToStaticMarkup(await Home())),canonical(readFileSync(new URL('tests/fixtures/landing-2026-11-21-original.html',root),'utf8')));
});

test('texto editado é escapado e não substitui elementos ou estilos',async()=>{
 const {default:Home}=component('app/page.tsx',{'@/lib/landing-texts-store':{readPublishedLandingTexts:async()=>({'inicio.title':'<img src=x onerror=alert(1)>'})}});
 const html=renderToStaticMarkup(await Home());assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);assert.doesNotMatch(html,/<img src=x/);
});

test('a landing preserva o briefing e não aceita o antigo HTML do Studio', async () => {
  let studioCalls = 0;
  const { default: Home } = component('app/page.tsx', {
    '@/lib/landing-texts-store': { readPublishedLandingTexts:async()=>({}) },
    '@/lib/content-studio': { getStudioDoc: async () => { studioCalls++; return { published: { studio: { enabled: true, html: '<p>CONTEUDO ANTIGO</p>' } } }; } },
    '@/components/content-runtime': { ContentRuntime: () => null },
    '@/components/studio-published-landing': { StudioPublishedLanding: () => React.createElement('p', null, 'CONTEUDO ANTIGO') },
    '@/components/checkout-form': { CheckoutForm: () => React.createElement('form', { 'data-test-checkout': '1' }) },
    '@/components/profit-simulator': { ProfitSimulator: () => React.createElement('div', { 'data-test-simulator': '1' }) },
  });
  const html = renderToStaticMarkup(await Home({ searchParams: Promise.resolve({}) }));
  assert.equal(studioCalls, 0, 'LP pública não deve depender do banco/CMS');
  assert.doesNotMatch(html, /CONTEUDO ANTIGO|data-studio-id|cms-free-layer/);
  assert.match(html, /Vem realizar seus sonhos/);
  assert.match(html, /QUERO CONHECER ESSA OPORTUNIDADE/);
  assert.equal((html.match(/data-test-checkout="1"/g) || []).length, 1);
  assert.equal((html.match(/data-test-simulator="1"/g) || []).length, 1);
  for (const id of ['inicio','lord-nutri','mix10pro','modelo','simulador','kits','duvidas','checkout']) assert.ok(html.includes(`id="${id}"`), id);
  const plain = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
  const briefing = JSON.parse(readFileSync(new URL('tests/fixtures/briefing-publicado-1.7.json', root), 'utf8'));
  for (const paragraph of briefing) {
    if (paragraph === "Processo de Notificação Anvisa N° 2535115572620267") {
      assert.ok(html.includes('aria-label="Processo de Notificação Anvisa Nº 25351.205227/2026-38"'));
    } else assert.ok(plain.includes(paragraph), `Briefing alterado: ${paragraph}`);
  }
  for (const value of ['25351.205227/2026-38', 'R$ 1.498,00', 'R$ 3.495,00']) assert.ok(plain.includes(value), value);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'IDs de seção únicos');
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), `Âncora sem destino: ${match[1]}`);
  const order = ['inicio','lord-nutri','mix10pro','modelo','simulador','kits','duvidas','checkout'];
  for (let i = 1; i < order.length; i++) assert.ok(ids.indexOf(order[i - 1]) < ids.indexOf(order[i]), 'Ordem comercial preservada');
});
