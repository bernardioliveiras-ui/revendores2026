import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { shippingCounts, filterShippingPurchases } from '../lib/shipping-dashboard.mjs';

const p = (id, shippingStatus, extra={}) => ({id,orderNumber:id,name:'Priscila',city:'Barueri',state:'SP',paymentStatus:'paid',shippingStatus,trackingCode:null,...extra});
const rows=[p('A','separating'),p('B','shipped',{trackingCode:'AA123456789BR',postalEvent:'Objeto postado'}),p('C','delivered'),p('D','separating',{paymentStatus:'payment_pending'})];

test('expedição conta somente pedidos pagos e identifica etiquetas ausentes',()=>{
  assert.deepEqual(shippingCounts(rows),{separating:1,shipped:1,delivered:1,withoutLabel:1});
  assert.equal(filterShippingPurchases(rows,'AA123').length,1);
  assert.equal(filterShippingPurchases(rows,'priscila').length,4);
  assert.equal(filterShippingPurchases(rows,'outro').length,0);
});

test('a área BKO tem pesquisa, indicadores e acompanhamento do evento consultado',()=>{
  const source=readFileSync(new URL('../components/bko-shipping.tsx',import.meta.url),'utf8');
  for(const phrase of ['Aguardando expedição','Em trânsito','Entregues','Sem etiqueta','Acompanhar','Última consulta'])assert.ok(source.includes(phrase),phrase);
  assert.match(source,/postalEvent/);
  assert.match(source,/postalIssue/);
});

test('a compra avulsa não oferece liberação de acesso de revendedor',()=>{
  const source=readFileSync(new URL('../app/painel/portal-client.tsx',import.meta.url),'utf8');
  assert.match(source,/p\.kit !== "mix10-unit" && !p\.accessReleasedAt/);
  assert.match(source,/p\.kit !== "mix10-unit" && p\.accessReleasedAt/);
});

test('revendedor abre detalhes do rastreio com evento e horário real',()=>{
  const source=readFileSync(new URL('../app/painel/portal-client.tsx',import.meta.url),'utf8');
  assert.match(source,/Ver rastreamento/);
  assert.match(source,/aria-label="Etapas do rastreamento"/);
  assert.match(source,/selectedShipment\.postalCheckedAt/);
});

test('o painel do influenciador separa apuração de aprovação e pagamento',()=>{
  const source=readFileSync(new URL('../components/indicator-portal.tsx',import.meta.url),'utf8');
  for (const label of ['Cashback aprovado','Disponível para repasse','Cashback pago'])assert.ok(source.includes(label),label);
  assert.match(source,/Sem conciliação de repasses/);
});
