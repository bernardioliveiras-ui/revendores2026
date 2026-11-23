import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('menu BKO fica compacto e fechado por padrão no mobile e possui botão acessível',()=>{
  const source=text('app/painel/portal-client.tsx');
  const css=text('app/portal-modern.css');
  assert.match(source,/aria-expanded=\{mobileMenuOpen\}/);
  assert.match(source,/lord-mobile-menu-trigger/);
  assert.match(source,/is-mobile-open/);
  assert.match(css,/@media\s*\(max-width:\s*780px\)[\s\S]*?\.lord-admin-sidebar:not\(\.is-mobile-open\)\s+\.bko-tabs\s*\{\s*display:\s*none/);
  assert.match(css,/@media\s*\(max-width:\s*780px\)[\s\S]*?\.lord-demo-filter\s*\{[^}]*flex-wrap:\s*wrap/);
});

test('ações de senha e liberação são proibidas para pagamento pendente, mesmo com data de acesso antiga',async()=>{
  const {canManagePurchaseAccess}=await import('../lib/bko-access-visibility.mjs');
  assert.equal(canManagePurchaseAccess({paymentStatus:'payment_pending',asaasVerifiedAt:null,accessReleasedAt:'2026-01-01'}),false);
  assert.equal(canManagePurchaseAccess({paymentStatus:'paid',asaasVerifiedAt:null,accessReleasedAt:'2026-01-01'}),false);
  assert.equal(canManagePurchaseAccess({paymentStatus:'paid',asaasVerifiedAt:'2026-11-23',accessReleasedAt:'2026-01-01'}),true);
  assert.equal(canManagePurchaseAccess({paymentStatus:'cancelled',asaasVerifiedAt:'2026-11-23'}),false);
  assert.match(text('app/painel/portal-client.tsx'),/canManagePurchaseAccess\(p\)/);
});
