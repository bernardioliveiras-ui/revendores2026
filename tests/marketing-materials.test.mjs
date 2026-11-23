import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {load, memoryDb, operators, table} from './runtime-loader.mjs';

const root=new URL('..',import.meta.url);
const source=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const manual=readFileSync(new URL('../private/manual/Manual_do_Revendedor_Enviado_2026.pdf',import.meta.url));
const folder=readFileSync(new URL('../public/materiais/folder-mix10pro.png',import.meta.url));
const paid={id:'p1',userId:'seller',kit:'kit20',paymentStatus:'paid',accessReleasedAt:'2026-10-04',asaasVerifiedAt:'2026-10-04'};
const schema={purchases:table('id','userId','kit','paymentStatus','accessReleasedAt','asaasVerifiedAt')};
const user={id:'seller',role:'reseller',mustChangePassword:false};
function route({session=user,orders=[paid]}={}){
 const {db}=memoryDb(schema,{purchases:orders});
 const orm={...operators,or:(...f)=>(row)=>f.some(fn=>fn(row)),isNotNull:col=>row=>row[col]!=null};
 return load('app/api/reseller/manual/route.ts',{
  'drizzle-orm':orm,'@/db/schema':schema,'@/db':{getDb:()=>db},
  '@/lib/auth':{requireSession:async()=>{if(!session)throw Error('UNAUTHORIZED');return session}},
  '@/lib/content-studio':{getStudioDoc:async()=>{throw Error('Não deve buscar Studio ao abrir manual fornecido')}},
  '@/lib/reseller-materials':{getManualPdfOverride:async()=>null,hasManualOrGrantedMaterialsAccess:async()=>false},
  '@/lib/simple-pdf':{buildManualPdf:()=>{throw Error('Não deve recompor o manual fornecido')}},
  'node:fs/promises':{readFile:async path=>{assert.match(path,/private\/manual\/Manual_do_Revendedor_Enviado_2026\.pdf$/);return manual}},
 }).GET;
}
const request=()=>new Request('https://exemplo.test/api/reseller/manual?edition=material');

test('o PDF e folder originais estão no lugar correto, com tipos válidos',()=>{
 assert.ok(manual.subarray(0,5).equals(Buffer.from('%PDF-')));
 assert.ok(folder.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
 assert.ok(manual.byteLength>1_000_000 && folder.byteLength>100_000);
 assert.ok(!existsSync(new URL('../public/manual/Manual_do_Revendedor_Enviado_2026.pdf',import.meta.url)));
});
test('apenas BKO e revendedor pago e ativo conseguem consultar o PDF enviado',async()=>{
 for (const session of [null,{id:'isabella',role:'indicator',mustChangePassword:false}]){
  const response=await route({session})(request());
  assert.equal(response.status,session?403:401);assert.doesNotMatch(await response.text(),/^%PDF-/);
 }
 assert.equal((await route({orders:[]})(request())).status,403);
 assert.equal((await route({session:{...user,mustChangePassword:true}})(request())).status,403);
 const response=await route()(request());
 assert.equal(response.status,200);
 assert.equal(response.headers.get('Content-Type'),'application/pdf');
 assert.match(response.headers.get('Cache-Control'),/private, no-store/);
 assert.match(response.headers.get('Content-Disposition'),/2026.pdf/);
 assert.ok(Buffer.from(await response.arrayBuffer()).equals(manual));
 assert.equal((await route({session:{...user,role:'admin'},orders:[]})(request())).status,200);
});
test('portais expõem os materiais certos sem oferecer manual para a indicadora',()=>{
 const reseller=source('app/painel/portal-client.tsx');
 const page=source('components/member-dashboard.tsx');
 const indicator=source('components/indicator-portal.tsx');
 const component=source('components/marketing-folder.tsx');
 assert.match(page,/manualUrl="\/api\/reseller\/manual\?edition=material"/);
 assert.match(reseller,/view === "manual"/);
 assert.match(reseller,/<MarketingFolder\/>/);
 assert.match(indicator,/<InfluencerMaterialLibrary\s*\/>/);
 assert.match(source("components/influencer-material-library.tsx"),/\/materiais\/folder-mix10pro.png/);
 assert.doesNotMatch(indicator,/\/api\/reseller\/manual/);
 assert.match(component,/\/materiais\/folder-mix10pro.png/);
 assert.match(component,/navigator\.canShare/);
 assert.match(component,/navigator\.share/);
 assert.match(component,/wa\.me\/\?text=/);
 assert.match(component,/download="folder-mix10pro.png"/);
 assert.doesNotMatch(component,/\/api\/sales|\/api\/billing|cashback/);
});
test('o PDF permanece privado e o PNG pode ser compartilhado sem login',()=>{
 const config=source('next.config.ts');
 const manualRoute=source('app/api/reseller/manual/route.ts');
 assert.match(config,/\.\/private\/manual\/\*\.pdf/);
 assert.match(manualRoute,/user\.role!=="reseller"/);
 assert.match(manualRoute,/edition/);
 assert.match(manualRoute,/getDb\(\)/);
});
