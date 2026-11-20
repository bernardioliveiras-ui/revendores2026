import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from './runtime-loader.mjs';
const {nextCashbackFriday}=load('lib/cashback-schedule.ts');
test('saldo atinge mínimo na sexta e vai para sexta seguinte',()=>{
 assert.equal(nextCashbackFriday('2026-11-13T15:00:00-03:00'),'2026-11-20');
});
test('quinta à noite no Brasil usa sexta imediatamente seguinte',()=>{
 assert.equal(nextCashbackFriday('2026-11-13T01:30:00Z'),'2026-11-13');
});
test('sábado usa sexta posterior e atravessa virada de ano',()=>{
 assert.equal(nextCashbackFriday('2026-12-26T15:00:00-03:00'),'2027-01-01');
});
test('preview exige autenticação e não envia dinheiro',async()=>{
 const {POST}=load('app/api/admin/cashback/prepare/route.ts',{
  '@/lib/auth':{requireAdmin:async()=>({id:'admin'})},
  '@/lib/indicator-security':{privateResponseHeaders:{},indicatedError:()=>new Response(null,{status:401})},
  '@/lib/cashback-schedule':{nextCashbackFriday},
 });
 const request = amountCents => new Request('https://example.test',{method:'POST',body:JSON.stringify({amountCents,availableAt:'2026-10-30T10:00:00-03:00'})});
 assert.equal((await POST(request(9999))).status,400);
 const response=await POST(request(10000));
 const body=await response.json();
 assert.equal(body.automaticTransfersEnabled,false);
 assert.equal(body.scheduleDate,'2026-11-06');
 assert.equal(body.mode,'preview');
});
