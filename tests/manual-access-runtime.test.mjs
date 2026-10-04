import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readdirSync} from 'node:fs';
import {load, memoryDb, operators, table} from './runtime-loader.mjs';

const path='app/api/reseller/manual/route.ts';
const request=()=>new Request('https://example.test/api/reseller/manual');
const buyer={id:'buyer-1',email:'buyer@test.test',name:'Buyer',phone:'',role:'reseller',mustChangePassword:false};
const paid={id:'p1',userId:'buyer-1',kit:'kit20',paymentStatus:'paid',accessReleasedAt:'2026-10-04T03:00:00Z'};
function handler({user=buyer,orders=[paid],dbError=false,fileError=false}={}){
 assert.ok(existsSync(new URL('../'+path,import.meta.url)), 'O download precisa existir como rota autenticada, fora de public.');
 const schema={purchases:table('id','userId','kit','paymentStatus','accessReleasedAt')};
 const {db}=memoryDb(schema,{purchases:orders});
 const orm={...operators,or:(...f)=>(row)=>f.some(fn=>fn(row)),isNotNull:(col)=>(row)=>row[col]!=null};
 return load(path,{'drizzle-orm':orm,'@/db/schema':schema,'@/db':{getDb:()=>{if(dbError)throw Error('DB_OFFLINE');return db}},'@/lib/auth':{requireSession:async()=>{if(!user)throw Error('UNAUTHORIZED');return user}},'node:fs/promises':{readFile:async()=>{if(fileError)throw Error('ENOENT');return Buffer.from('%PDF-1.7\nprivate manual')}}}).GET;
}
test('o manual não possui cópia nem apresentação baixável em public',()=>{
 const dir=new URL('../public/manual/',import.meta.url);
 assert.deepEqual(existsSync(dir)?readdirSync(dir).filter(f=>/\.(pdf|pptx)$/i.test(f)):[],[]);
});
test('anônimo recebe 401 mesmo quando o banco está indisponível',async()=>{
 const r=await handler({user:null,dbError:true})(request());assert.equal(r.status,401);assert.ok(!(await r.text()).startsWith('%PDF'));
});
for(const [name,orders] of [
 ['sem compra',[]],['pagamento pendente',[{...paid,paymentStatus:'payment_pending'}]],
 ['compra de outra pessoa',[{...paid,userId:'other'}]],['pedido reembolsado',[{...paid,paymentStatus:'cancelled'}]],
 ['compra sem kit',[{...paid,kit:'retail'}]],['acesso ainda não liberado',[{...paid,accessReleasedAt:null}]],
])test(name+' não recebe o PDF',async()=>{const r=await handler({orders})(request());assert.equal(r.status,403);assert.ok(!(await r.text()).startsWith('%PDF'))});
test('comprador confirmado recebe PDF privado com a sessão atual',async()=>{
 const r=await handler()(request());assert.equal(r.status,200);assert.equal(r.headers.get('Content-Type'),'application/pdf');assert.match(r.headers.get('Cache-Control'),/private.*no-store/);assert.match(r.headers.get('X-Robots-Tag'),/noindex/);assert.match(await r.text(),/^%PDF/);
});
test('uma compra pendente não bloqueia outro kit pago do mesmo cliente',async()=>{
 const r=await handler({orders:[{...paid,id:'pending',paymentStatus:'payment_pending'},paid]})(request());assert.equal(r.status,200);
});
test('o BKO pode conferir o material sem possuir uma compra pessoal',async()=>{
 const r=await handler({user:{...buyer,role:'admin'},orders:[]})(request());assert.equal(r.status,200);
});
test('a troca obrigatória da senha protege o material do revendedor',async()=>{
 const r=await handler({user:{...buyer,mustChangePassword:true}})(request());assert.equal(r.status,403);
});
for(const input of [{dbError:true},{fileError:true}])test('falha de dependência não revela nem redireciona o PDF',async()=>{
 const r=await handler(input)(request());assert.equal(r.status,503);assert.equal(r.headers.get('Location'),null);assert.ok(!(await r.text()).startsWith('%PDF'));
});
