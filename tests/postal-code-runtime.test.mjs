import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from './runtime-loader.mjs';
const pricing=load('lib/checkout/pricing.ts',{'@/lib/checkout/shipping-rates':load('lib/checkout/shipping-rates.ts'),'@/lib/checkout/shipping-additions':load('lib/checkout/shipping-additions.ts')});
const kits=load('lib/kits.ts');
const address={postalCode:'01001000',street:'Praça da Sé',district:'Sé',city:'São Paulo',state:'SP'};
function quote(lookup){return load('app/api/public/quote/route.ts',{'@/lib/kits':kits,'@/lib/checkout/pricing':pricing,'@/lib/postal-code':{lookupPostalCode:lookup}}).POST}
const req=(cep)=>new Request('https://example.test',{method:'POST',body:JSON.stringify({kit:'kit20',postalCode:cep})});
test('CEP inexistente não permite selecionar frete',async()=>{const r=await quote(async()=>null)(req('99999999'));assert.equal(r.status,422)});
test('consulta válida fornece endereço junto com frete',async()=>{const r=await quote(async()=>address)(req('01001-000'));const b=await r.json();assert.equal(r.status,200);assert.deepEqual(b.address,address);assert.equal(b.postalCode,'01001000');assert.equal(b.kit.productTotalCents,149800);assert.equal(b.shippingOptions[0].credit.length,6)});
test('falha temporária da consulta de CEP retorna erro recuperável',async()=>{const r=await quote(async()=>{throw Error('unavailable')})(req('01001000'));assert.equal(r.status,503)});
test('ViaCEP com erro true é tratado como CEP inexistente',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>({erro:true})});try{const {lookupPostalCode}=load('lib/postal-code.ts');assert.equal(await lookupPostalCode('99999999'),null)}finally{globalThis.fetch=original}});
test('ViaCEP retorna endereço normalizado para preenchimento',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>({logradouro:'Praça da Sé',bairro:'Sé',localidade:'São Paulo',uf:'SP'})});try{const {lookupPostalCode}=load('lib/postal-code.ts');assert.deepEqual(await lookupPostalCode('01001000'),address)}finally{globalThis.fetch=original}});
