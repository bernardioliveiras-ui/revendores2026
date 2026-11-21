import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { isDirectUnitPurchase } from '../lib/purchase-segments.mjs';

const require=createRequire(import.meta.url);
function loadTsx(relative) {
  const source=readFileSync(new URL(`../${relative}`,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  new Function('require','exports',code)(id=>id==='@/lib/purchase-segments.mjs'?{isDirectUnitPurchase}:require(id),exports);
  return exports;
}

test('BKO Vendas avulsas mostra apenas compra unitária sem campanha, sem botão de liberação de login',()=>{
  const {BkoDirectSales}=loadTsx('components/bko-direct-sales.tsx');
  const rows=[
    {id:'direct',orderNumber:'MIX-DIRETO',name:'Cliente direto',kit:'mix10-unit',campaignId:null,paymentStatus:'paid',asaasVerifiedAt:'2026-11-21',totalCents:10990,productTotalCents:10990,createdAt:'2026-11-21T12:00:00.000Z',shippingStatus:'separating'},
    {id:'affiliate',orderNumber:'MIX-CAMPANHA',name:'Cliente de influenciador',kit:'mix10-unit',campaignId:'camp1',paymentStatus:'paid',totalCents:10990,createdAt:'2026-11-21T12:00:00.000Z'},
    {id:'kit',orderNumber:'MIX-KIT',name:'Revendedor',kit:'kit50',campaignId:null,paymentStatus:'paid',totalCents:300000,createdAt:'2026-11-21T12:00:00.000Z'},
  ];
  const html=renderToStaticMarkup(React.createElement(BkoDirectSales,{purchases:rows,onRefresh:()=>{}}));
  assert.match(html,/Vendas avulsas/);
  assert.match(html,/Cliente direto/);
  assert.doesNotMatch(html,/Cliente de influenciador|Revendedor|Liberar acesso/);
  assert.match(html,/R\$\s*109,90/);
});
