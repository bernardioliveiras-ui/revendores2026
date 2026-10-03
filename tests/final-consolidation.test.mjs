import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
const root=new URL('..',import.meta.url).pathname;const read=(p)=>readFile(join(root,p),'utf8');

test('LP places LORD NUTRI proof and model before MIX10 product and keeps Google reviews with brand proof', async()=>{
  const src=await read('app/page.tsx');
  const proof=src.indexOf('id="lord-nutri"');
  const reviews=src.indexOf('<GoogleReviews');
  const product=src.indexOf('id="mix10pro"');
  assert.ok(proof>=0 && reviews>proof && product>reviews);
  assert.match(src,/Transforme sua rede de contatos em uma nova fonte de renda\./);
  assert.match(src,/Conheça o MIX10 PRO\./);
});

test('favicon is the LORDNUTRI mark and the reseller manual is embedded', async()=>{
  await access(join(root,'app/icon.png'));
  await access(join(root,'public/brand/lordnutri-mark.png'));
  await access(join(root,'public/manual/MANUAL-DO-REVENDEDOR-LORDNUTRI-MIX10PRO.pdf'));
  const portal=await read('app/painel/portal-client.tsx');
  assert.match(portal,/MANUAL-DO-REVENDEDOR-LORDNUTRI-MIX10PRO\.pdf/);
  assert.match(portal,/<iframe/);
});

test('reseller replenishment creates an Asaas payment and paid webhook provisions stock', async()=>{
  const route=await read('app/api/replenishment/route.ts');
  const webhook=await read('app/api/billing/webhook/route.ts');
  const provision=await read('lib/access-provisioning.ts');
  assert.match(route,/createPayment/);
  assert.match(route,/welcomeStatus:\s*"not_required"/);
  assert.match(route,/paymentStatus:\s*"payment_pending"/);
  assert.match(webhook,/PAYMENT_CONFIRMED/);
  assert.match(webhook,/provisionPaidPurchase/);
  assert.match(provision,/replenishment_purchase/);
  assert.match(provision,/referenceId:\s*p\.id/);
});

test('reseller navigation uses the requested order and sales allow direct quantity entry', async()=>{
  const src=await read('app/painel/portal-client.tsx');
  assert.match(src, /\[\s*\["welcome","Boas Vindas"\], \["overview","Visão Geral"\], \["manual","Manual do Revendedor"\], \["stock","Estoque"\], \["sales","Vendas"\], \["delivery","Acompanhe seu Pedido"\]\s*\]/);
  assert.match(src,/inputMode="numeric"/);
  assert.match(src,/Digite a quantidade/);
  assert.match(src,/Repor estoque e ir para o Asaas/);
});

test('welcome and shipping notification automations are wired', async()=>{
  const welcome=await read('lib/welcome-notification.ts');
  const shipping=await read('lib/shipping.ts');
  const orderNotification=await read('lib/order-notification.ts');
  assert.match(welcome,/RESEND_API_KEY/);
  assert.match(welcome,/Bem-vindo à LORDNUTRI/);
  assert.match(shipping,/sendOrderStatusEmail/);
  assert.match(orderNotification,/RESEND_API_KEY/);
});
