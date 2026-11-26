import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
const root=new URL('..',import.meta.url).pathname;const read=(p)=>readFile(join(root,p),'utf8');


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
  const webhook=await read('lib/billing-webhook.ts');
  const provision=await read('lib/access-provisioning.ts');
  assert.match(route,/createPayment/);
  assert.match(route,/welcomeStatus:\s*"not_required"/);
  assert.match(route,/paymentStatus:\s*"payment_pending"/);
  assert.match(webhook,/PAYMENT_CONFIRMED/);
  assert.match(webhook,/provisionPaidPurchase/);
  assert.match(provision,/replenishment_purchase/);
  assert.match(provision,/referenceId:\s*p\.id/);
});

test('revendedor usa venda rápida com quantidade direta e preço exclusivo do BKO', async()=>{
  const src=await read('app/painel/portal-client.tsx');
  const quick=await read('components/reseller-quick-sale.tsx');
  assert.match(src, /\[\["overview","Visão Geral"\],\["sales","Vendas"\],\["clients","Clientes"\],\["stock","Estoque"\],\["delivery","Meus Pedidos"\],\["manual","Manual do Revendedor"\],\["profile","Meu Perfil"\]\]/);
  assert.match(quick,/inputMode="numeric"/);
  assert.match(quick,/Saldo após a venda/);
  assert.match(quick,/definido pelo BKO/);
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
