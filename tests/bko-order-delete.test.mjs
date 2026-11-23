import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadNative} from './native-runtime-loader.mjs';
import {validateOrderDeletion,deletionBlockers} from '../lib/bko-order-deletion.mjs';

const order={id:'purchase-1',order_number:'MIXTEST123',user_id:null,shipping_status:'awaiting_payment',tracking_code:null,shipped_at:null,asaas_payment_id:'pay_test_abc',payment_status:'payment_pending'};
const tables=['purchases','users','sales','stock_movements','reseller_profiles','reseller_invitations','auth_sessions','affiliate_referrals','affiliate_cashbacks','asaas_events','purchase_measurement','measurement_outbox'];

function harness({purchase=order,account=null,sales=0,referrals=0,otherPurchases=0,otherStock=0,outgoingMovements=0,paidCashback=false,unknownFk=false,failSql='',admin=true}={}){
  const calls=[];let commits=0,rollbacks=0;
  const conn={
    beginTransaction:async()=>{calls.push('BEGIN');},
    commit:async()=>{commits++;calls.push('COMMIT');},
    rollback:async()=>{rollbacks++;calls.push('ROLLBACK');},
    release:()=>{},
    execute:async(sql,params=[])=>{
      calls.push({sql,params});
      if(failSql&&sql.includes(failSql))throw Error('DB_FAIL');
      if(sql.includes('information_schema.TABLES'))return [tables.map(name=>({name}))];
      if(sql.includes('information_schema.KEY_COLUMN_USAGE'))return [unknownFk?[{name:'unexpected_cascade'}]:[{name:'reseller_profiles'},{name:'purchase_measurement'},{name:'measurement_outbox'}]];
      if(sql.startsWith('SELECT id,order_number'))return [purchase?[purchase]:[]];
      if(sql.startsWith('SELECT id FROM purchases WHERE user_id'))return [[{id:'surviving-purchase'}]];
      if(sql.startsWith('SELECT id,role FROM users'))return [account?[account]:[]];
      if(sql.startsWith('SELECT purchase_id FROM reseller_profiles'))return [[{purchase_id:purchase?.id||null}]];
      if(sql.startsWith('SELECT status,paid_at,payout_reference FROM affiliate_cashbacks'))return [paidCashback?[{status:'paid'}]:[]];
      if(sql.includes('COUNT(*)')&&sql.includes('FROM sales'))return [[{n:sales}]];
      if(sql.includes('COUNT(*)')&&sql.includes('FROM affiliate_referrals'))return [[{n:referrals}]];
      if(sql.includes('COUNT(*)')&&sql.includes('FROM purchases'))return [[{n:otherPurchases}]];
      if(sql.includes('COUNT(*)')&&sql.includes('FROM stock_movements'))return [[{n:sql.includes("type IN ('sale','adjustment_out')")?outgoingMovements:otherStock}]];
      return [{affectedRows:1}];
    },
  };
  const mock={
    '@/db':{getMysqlPool:()=>({getConnection:async()=>conn,query:async(sql)=>{calls.push({sql,params:[]});return [[]]}})},
    '@/lib/auth':{requireAdmin:async()=>{if(!admin)throw Error('FORBIDDEN');return {id:'admin-1'}}},
    '@/lib/bko-order-deletion.mjs':{validateOrderDeletion,deletionBlockers},
  };
  const {DELETE}=loadNative('app/api/admin/orders/delete/route.ts',mock,['DELETE']);
  const req=(payload={purchaseId:'purchase-1',orderNumber:'MIXTEST123',confirm:'MIXTEST123'},origin='https://bko.test')=>new Request('https://bko.test/api/admin/orders/delete',{method:'DELETE',headers:{'content-type':'application/json',origin,host:'bko.test'},body:JSON.stringify(payload)});
  return {DELETE,req,calls,get commits(){return commits},get rollbacks(){return rollbacks}};
}

test('BKO barra exclusão anônima, origem externa e confirmação diferente sem tocar no banco',async()=>{
  const a=harness({admin:false});assert.equal((await a.DELETE(a.req())).status,403);assert.equal(a.calls.length,0);
  const b=harness();assert.equal((await b.DELETE(b.req(undefined,'https://outro.test'))).status,403);assert.equal(b.calls.length,0);
  assert.equal((await b.DELETE(b.req({purchaseId:'purchase-1',orderNumber:'MIXTEST123',confirm:'OUTRO'}))).status,400);
  assert.equal(b.calls.length,0);
});

test('BKO apaga pedido pendente em transação e audita sem consultar nem alterar Asaas',async()=>{
  const h=harness();const response=await h.DELETE(h.req());
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{deleted:true,orderNumber:'MIXTEST123',asaasUnchanged:true});
  assert.equal(h.commits,1);assert.equal(h.rollbacks,0);
  assert.ok(h.calls.some(c=>typeof c==='object'&&/INSERT INTO bko_order_deletions/.test(c.sql)));
  assert.ok(h.calls.some(c=>typeof c==='object'&&/DELETE FROM purchases WHERE id=/.test(c.sql)));
  assert.ok(h.calls.some(c=>typeof c==='object'&&/UPDATE asaas_events SET purchase_id=NULL/.test(c.sql)));
  assert.ok(!h.calls.some(c=>typeof c==='object'&&/DELETE FROM asaas_events/.test(c.sql)),'histórico de webhooks deve preservar idempotência');
  assert.ok(!h.calls.some(c=>typeof c==='object'&&/asaas\.com|DELETE FROM users/.test(c.sql)));
});

test('BKO bloqueia pedido enviado, com vendas, indicação ou cashback já pago',async()=>{
  for(const change of [
    {purchase:{...order,shipping_status:'shipped'}},
    {purchase:{...order,delivered_at:'2026-11-22'}},
    {purchase:{...order,user_id:'seller'},account:{id:'seller',role:'reseller'},sales:1},
    {purchase:{...order,user_id:'seller'},account:{id:'seller',role:'reseller'},referrals:1},
    {paidCashback:true},
  ]){
    const h=harness(change);const response=await h.DELETE(h.req());
    assert.equal(response.status,409,JSON.stringify(change));
    assert.equal(h.commits,0);assert.equal(h.rollbacks,1);
    assert.ok(!h.calls.some(c=>typeof c==='object'&&c.sql.startsWith('DELETE FROM')));
  }
});

test('pedido pago sem movimentação remove estoque da compra, acesso exclusivo e sessões',async()=>{
  const h=harness({purchase:{...order,payment_status:'paid',shipping_status:'separating',user_id:'seller'},account:{id:'seller',role:'reseller'}});
  assert.equal((await h.DELETE(h.req())).status,200);
  const sql=h.calls.filter(c=>typeof c==='object').map(c=>c.sql);
  for(const part of ['DELETE FROM stock_movements','DELETE FROM auth_sessions','DELETE FROM users','DELETE FROM purchases'])assert.ok(sql.some(s=>s.includes(part)),part);
  assert.equal(h.commits,1);
});

test('se revendedor possui outro pedido, conta e sessões ficam intactas',async()=>{
  const h=harness({purchase:{...order,user_id:'seller',payment_status:'paid'},account:{id:'seller',role:'reseller'},otherPurchases:1});
  assert.equal((await h.DELETE(h.req())).status,200);
  const sql=h.calls.filter(c=>typeof c==='object').map(c=>c.sql);
  assert.ok(!sql.some(s=>s.startsWith('DELETE FROM users')));
  assert.ok(!sql.some(s=>s.startsWith('DELETE FROM auth_sessions')));
  const relink=h.calls.find(c=>typeof c==='object'&&c.sql.startsWith('UPDATE reseller_profiles SET purchase_id=?'));
  assert.ok(relink,'perfil deve permanecer associado a outra compra Asaas');
  assert.deepEqual(relink.params,['surviving-purchase','purchase-1']);
});

test('conta de origem Asaas com estoque independente e sem outra compra não vira cadastro manual',async()=>{
  const h=harness({purchase:{...order,user_id:'seller',payment_status:'paid'},account:{id:'seller',role:'reseller'},otherStock:1});
  const response=await h.DELETE(h.req());
  assert.equal(response.status,409);
  assert.equal(h.commits,0);
  assert.ok(!h.calls.some(c=>typeof c==='object'&&c.sql.startsWith('UPDATE reseller_profiles SET purchase_id=NULL')));
});

test('falha na transação e vínculo FK desconhecido impedem exclusão parcial',async()=>{
  const fail=harness({failSql:'DELETE FROM purchases'});
  assert.equal((await fail.DELETE(fail.req())).status,500);assert.equal(fail.commits,0);assert.equal(fail.rollbacks,1);
  const fk=harness({unknownFk:true});
  assert.equal((await fk.DELETE(fk.req())).status,409);assert.equal(fk.commits,0);assert.equal(fk.rollbacks,1);
});

test('lista de pedidos do BKO disponibiliza exclusão individual com confirmação pelo número',()=>{
  const portal=readFileSync(new URL('../app/painel/portal-client.tsx',import.meta.url),'utf8');
  const component=readFileSync(new URL('../components/bko-order-delete-button.tsx',import.meta.url),'utf8');
  assert.match(portal,/BkoOrderDeleteButton/);
  assert.match(component,/Excluir definitivamente/);
  assert.match(component,/api\/admin\/orders\/delete/);
  assert.match(component,/window\.prompt\(/);
});

test('schema inclui rastreabilidade da exclusão e armazenamento privado do manual',()=>{
  const schema=readFileSync(new URL('../database/schema.sql',import.meta.url),'utf8');
  assert.match(schema,/CREATE TABLE IF NOT EXISTS `bko_order_deletions`/);
  assert.match(schema,/CREATE TABLE IF NOT EXISTS `bko_manual_pdfs`/);
});
