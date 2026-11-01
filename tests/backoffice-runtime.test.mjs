import test from 'node:test';
import assert from 'node:assert/strict';
import {load,memoryDb,operators,table} from './runtime-loader.mjs';
const schema={purchases:table('id','userId','paymentStatus'),users:table('id','email'),authSessions:table('userId'),resellerProfiles:table('userId'),stockMovements:table('id','userId','referenceId')};
const pending={id:'p1',email:'buyer@example.test',name:'Buyer',phone:'',kit:'kit20',boxes:20,paymentStatus:'payment_pending',shippingStatus:'awaiting_payment'};
function backoffice({role='admin',purchase=pending}={}){
 const s=memoryDb(schema,{purchases:[purchase]});let schemaTouches=0;
 const deps={'drizzle-orm':operators,'@/db':{getDb:()=>s.db},'@/db/schema':schema,'@/lib/auth':{requireAdmin:async()=>{if(role===null)throw Error('UNAUTHORIZED');if(role!=='admin')throw Error('FORBIDDEN');return {id:'bko',role}}},'@/lib/runtime-schema':{ensureOperationalSchema:async()=>{schemaTouches++}},'@/lib/temporary-secret':{encryptTemporarySecret:()=>({ciphertext:'secret',iv:'generation'})},'@/lib/passwords':{generateTemporaryPassword:()=> 'temporary-password',hashPassword:async()=> 'hash'},'@/lib/purchase-fields':{operationalPurchaseFields:{}},'@/lib/mysql-errors':{isMysqlDuplicateKeyError:()=>false},'@/lib/welcome-notification':{sendWelcome:async()=>({sent:false,reason:'not_configured'})}};
 const provision=load('lib/access-provisioning.ts',deps);deps['@/lib/access-provisioning']=provision;
 return {...s,orders:load('app/api/admin/orders/route.ts',deps).PATCH,access:load('app/api/admin/access/route.ts',deps).POST,get schemaTouches(){return schemaTouches}};
}
const req=(body,method='POST')=>new Request('https://example.test',{method,body:JSON.stringify(body)});
for(const [role,status] of [[null,401],['reseller',403]])test('BKO bloqueia papel '+role+' antes do banco',async()=>{
 const s=backoffice({role});assert.equal((await s.orders(req({purchaseId:'p1',status:'paid'},'PATCH'))).status,status);assert.equal((await s.access(req({purchaseId:'p1'}))).status,status);assert.equal(s.schemaTouches,0);assert.equal(s.rows.users.length,0);
});
test('BKO não libera senha ou estoque de compra pendente ou cancelada',async()=>{
 for(const paymentStatus of ['payment_pending','cancelled']){const s=backoffice({purchase:{...pending,paymentStatus}});assert.equal((await s.access(req({purchaseId:'p1'}))).status,409);assert.equal(s.rows.users.length,0);assert.equal(s.rows.stockMovements.length,0)}
});
test('BKO aprova pedido uma vez e usa provisionamento comum sem duplicar conta/estoque',async()=>{
 const s=backoffice();for(let i=0;i<2;i++)assert.equal((await s.orders(req({purchaseId:'p1',status:'paid'},'PATCH'))).status,200);
 assert.equal(s.rows.purchases[0].paymentStatus,'paid');assert.equal(s.rows.purchases[0].shippingStatus,'separating');assert.ok(s.rows.purchases[0].accessReleasedAt);
 assert.equal(s.rows.users.length,1);assert.equal(s.rows.users[0].mustChangePassword,1);assert.equal(s.rows.stockMovements.length,1);assert.equal(s.rows.stockMovements[0].boxes,20);
});
test('BKO não reaprova pedido cancelado',async()=>{
 const s=backoffice({purchase:{...pending,paymentStatus:'cancelled'}});assert.equal((await s.orders(req({purchaseId:'p1',status:'paid'},'PATCH'))).status,409);assert.equal(s.rows.users.length,0);
});
test('BKO reseta senha e revoga todas as sessões, com nova geração de boas-vindas',async()=>{
 const s=backoffice({purchase:{...pending,paymentStatus:'paid',userId:'u1',welcomeStatus:'sent'}});s.rows.users.push({id:'u1',passwordHash:'old',mustChangePassword:0});s.rows.authSessions.push({userId:'u1',tokenHash:'old-session'});s.rows.purchases.push({...pending,id:'p2',userId:'u1',welcomeSecret:'old-secret',welcomeIv:'old-generation'});
 assert.equal((await s.access(req({purchaseId:'p1',action:'reset-password'}))).status,200);
 assert.equal(s.rows.users[0].passwordHash,'hash');assert.equal(s.rows.users[0].mustChangePassword,1);assert.equal(s.rows.authSessions.length,0);
 assert.equal(s.rows.purchases[0].welcomeStatus,'pending');assert.equal(s.rows.purchases[0].welcomeIv,'generation');assert.equal(s.rows.purchases[1].welcomeSecret,null);
});
