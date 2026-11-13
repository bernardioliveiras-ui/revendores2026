import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeIndicatorOrderEvent,paymentTransition} from '../lib/indicator-order-bridge.mjs';
const sample={event:'created',externalOrderId:'pedido_123',campaignCode:'a'.repeat(32),asaasPaymentId:'pay_123',productTotalCents:149800};
test('aceita pedido criado com codigo de campanha e cobranca Asaas',()=>{assert.deepEqual(normalizeIndicatorOrderEvent(sample),sample)});
test('rejeita dados arbitrarios e receita incorreta',()=>{assert.equal(normalizeIndicatorOrderEvent({...sample,campaignCode:'a'.repeat(4)}),null);assert.equal(normalizeIndicatorOrderEvent({...sample,productTotalCents:-1}),null);assert.equal(normalizeIndicatorOrderEvent({...sample,externalOrderId:'../../outro'}),null)});
test('nao aprova venda sem status confirmado e referencia do pedido',()=>{assert.equal(paymentTransition('paid','PENDING','pedido_123','pedido_123'),null);assert.equal(paymentTransition('paid','RECEIVED','outro','pedido_123'),null);assert.equal(paymentTransition('paid','RECEIVED','pedido_123','pedido_123'),'paid')});
test('reembolsos reais cancelam, eventos arbitrarios nao',()=>{assert.equal(paymentTransition('cancelled','REFUNDED','pedido_123','pedido_123'),'cancelled');assert.equal(paymentTransition('cancelled','PENDING','pedido_123','pedido_123'),null)});
