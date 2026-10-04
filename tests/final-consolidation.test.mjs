import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
const root=new URL('..',import.meta.url).pathname;const read=(p)=>readFile(join(root,p),'utf8');

test('LP builds trust in LORD NUTRI before product benefits, model, calculations and kits', async()=>{
  const src=await read('app/page.tsx');
  const model=src.indexOf('id="modelo"');
  const opportunity=src.indexOf('id="lord-nutri"');
  const simulator=src.indexOf('id="simulador"');
  const product=src.indexOf('id="mix10pro"');
  assert.ok(opportunity>=0 && product>opportunity && model>product && simulator>model);
  assert.match(src,/id="beneficios"/);
  const hero=src.slice(src.indexOf('id="inicio"'),opportunity);
  assert.doesNotMatch(hero,/20 caixas|até 6x|Frete à parte|href="#simulador"/i);
  assert.match(hero,/href="#lord-nutri"/);
  assert.match(src,/Vem realizar seus sonhos com a gente!/);
  assert.match(src,/Por que vender com a LORD NUTRI/);
  assert.match(src,/Benefícios pensados para o seu corpo/);
  assert.match(src,/40\+/);
  assert.match(src,/A plataforma de apoio e os treinamentos estão em desenvolvimento/);
});

test('favicon is the LORDNUTRI mark and the exclusive reseller manual is embedded in the portal', async()=>{
  await access(join(root,'app/icon.png'));
  await access(join(root,'public/brand/lordnutri-mark.png'));
  await access(join(root,'private/manual/Manual_do_Revendedor_LORD_NUTRI.pdf'));
  const portal=await read('app/painel/portal-client.tsx');
  assert.match(portal,/\/api\/reseller\/manual/);
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
