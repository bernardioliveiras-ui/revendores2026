import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=(p)=>readFileSync(resolve(root,p),'utf8');

test('preço padrão é R$109,90 e BKO valida novas configurações',async()=>{
 const {DEFAULT_RESELLER_SALE_PRICE_CENTS,validateResellerSalePrice}=await import('../lib/reseller-sale-price.mjs');
 assert.equal(DEFAULT_RESELLER_SALE_PRICE_CENTS,10990);
 assert.equal(validateResellerSalePrice({priceCents:11990,reason:'Atualização comercial'}).priceCents,11990);
 assert.throws(()=>validateResellerSalePrice({priceCents:0,reason:'x'}));
 assert.throws(()=>validateResellerSalePrice({priceCents:109.9,reason:'x'}));
 assert.match(source('app/api/admin/reseller-sale-price/route.ts'),/requireAdmin\(request\)/);
});

test('vendas de revendedores não confiam em unitValue vindo do navegador',()=>{
 const route=source('app/api/sales/route.ts');
 assert.doesNotMatch(route,/Number\(body\.unitValue\)/);
 assert.match(route,/resellerSalePriceSettings/);
 assert.match(route,/clientRequestId/);
 assert.match(route,/FOR UPDATE/);
 assert.match(source('lib/runtime-schema.ts'),/client_request_id/);
});

test('prévia da venda calcula total e saldo com preço fixo',async()=>{
 const {salePreview}=await import('../lib/reseller-sale-calculation.mjs');
 assert.deepEqual(salePreview({available:50,boxes:3,unitPriceCents:10990}),{valid:true,remaining:47,totalCents:32970});
 assert.equal(salePreview({available:2,boxes:3,unitPriceCents:10990}).valid,false);
 assert.equal(salePreview({available:5,boxes:0,unitPriceCents:10990}).valid,false);
 const ui=source('components/reseller-quick-sale.tsx');
 assert.doesNotMatch(ui,/name="unitValue"/);
 assert.match(ui,/Saldo após a venda/);
});

test('bio tem limite e fotos aceitam somente imagem real de tamanho limitado',async()=>{
 const {validateBio,identifyAvatar}=await import('../lib/user-profile-validation.mjs');
 assert.equal(validateBio('  Olá!  '),'Olá!');
 assert.throws(()=>validateBio('a'.repeat(161)));
 assert.equal(identifyAvatar(Buffer.from([0xff,0xd8,0xff,0xe0]),'image/jpeg',4),'image/jpeg');
 assert.throws(()=>identifyAvatar(Buffer.from('<svg>'), 'image/svg+xml', 5));
 assert.throws(()=>identifyAvatar(Buffer.alloc(2*1024*1024+1), 'image/png', 2*1024*1024+1));
 assert.match(source('app/api/profile/avatar/route.ts'),/requireSession\(request\)/);
});

test('menus de revendedores sem Indicações e identidade nítida, preservando API antiga',()=>{
 const portal=source('app/painel/portal-client.tsx');
 assert.doesNotMatch(portal,/\["referrals","Indicações"\]/);
 assert.match(portal,/"profile","Meu Perfil"/);
 assert.equal(existsSync(resolve(root,'app/api/referrals/route.ts')),true);
 assert.match(source('components/brand-logo.tsx'),/lordnutri-logo-2026\.png/);
 assert.equal(existsSync(resolve(root,'public/brand/lordnutri-logo-2026.png')),true);
});
