import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadNative, fixtureDb, operators, table} from './native-runtime-loader.mjs';

const pdf=Buffer.from('%PDF-1.7\n1 0 obj <<>> endobj\n%%EOF');
const api='app/api/admin/reseller-materials/route.ts';
const file=(name='manual.pdf',bytes=pdf,type='application/pdf')=>new File([bytes],name,{type});
const makeForm=(fields={kind:'manual',title:'Manual atualizado',file:file()})=>{
  const body=new FormData();
  for(const [name,value] of Object.entries(fields))body.append(name,value);
  return body;
};
const request=(fields,origin='https://bko.test')=>new Request('https://bko.test/api/admin/reseller-materials',{method:'PUT',headers:{origin,host:'bko.test'},body:makeForm(fields)});

test('validador rejeita PDF vazio e arquivo disfarçado, mas aceita PDF real',async()=>{
  const {validateMaterialUpload}=await import('../lib/material-file-validation.mjs');
  assert.match(validateMaterialUpload(file('vazio.pdf',Buffer.alloc(0)),Buffer.alloc(0))||'',/arquivo/i);
  assert.match(validateMaterialUpload(file('falso.pdf',Buffer.from('<html>x</html>')),Buffer.from('<html>x</html>'))||'',/conteúdo/i);
  assert.equal(validateMaterialUpload(file(),pdf),null);
});

test('BKO publica substituição de manual no banco, usando o mesmo endereço protegido',async()=>{
  const calls=[];
  const {PUT}=loadNative(api,{
    'node:crypto':{randomUUID:()=> 'uuid'},
    '@/db':{getMysqlPool:()=>({execute:async(sql,params)=>{calls.push({sql,params});return [{affectedRows:1}]}})},
    '@/lib/auth':{requireAdmin:async()=>({id:'admin'})},
    '@/lib/reseller-materials':{ensureMaterialsTable:async()=>{},ensureManualPdfTable:async()=>{},materialError:e=>Response.json({error:e.message},{status:500})},
    '@/lib/material-file-validation.mjs':await import('../lib/material-file-validation.mjs'),
  },['PUT']);
  const response=await PUT(request());
  assert.equal(response.status,200);
  assert.ok(calls.some(call=>/INSERT INTO bko_manual_pdfs/.test(call.sql)));
  assert.ok(calls.some(call=>call.params.some(value=>Buffer.isBuffer(value)&&value.equals(pdf))));
  assert.equal((await response.json()).url,'/api/reseller/manual?edition=material');
});

test('BKO rejeita origem externa, arquivo fora do limite e título vazio sem gravação',async()=>{
  const calls=[];
  const {PUT}=loadNative(api,{
    'node:crypto':{randomUUID:()=> 'uuid'},
    '@/db':{getMysqlPool:()=>({execute:async(sql,p)=>{calls.push({sql,p});return [{affectedRows:1}]}})},
    '@/lib/auth':{requireAdmin:async()=>({id:'admin'})},
    '@/lib/reseller-materials':{ensureMaterialsTable:async()=>{},ensureManualPdfTable:async()=>{},materialError:e=>Response.json({error:e.message},{status:500})},
    '@/lib/material-file-validation.mjs':await import('../lib/material-file-validation.mjs'),
  },['PUT']);
  assert.equal((await PUT(request(undefined,'https://invasor.test'))).status,403);
  assert.equal((await PUT(request({kind:'manual',title:'',file:file()}))).status,400);
  assert.equal((await PUT(request({kind:'manual',title:'Manual',file:file('grande.pdf',Buffer.alloc(20*1024*1024+1,65))}))).status,400);
  assert.equal((await PUT(request({id:'11111111-1111-4111-8111-111111111111',title:'Novo título',file:file('vazio.pdf',Buffer.alloc(0))}))).status,400);
  assert.equal(calls.length,0);
});

test('PDF substituído é servido no mesmo link e permanece protegido',async()=>{
  const schema={purchases:table('id','userId','kit','paymentStatus','accessReleasedAt','asaasVerifiedAt')};
  const {db}=fixtureDb(schema,{purchases:[{id:'paid',userId:'reseller',kit:'kit20',paymentStatus:'paid',accessReleasedAt:'2026',asaasVerifiedAt:'2026'}]});
  const orm={...operators,or:(...fn)=>row=>fn.some(f=>f(row)),isNotNull:key=>row=>row[key]!=null};
  const session={id:'reseller',role:'reseller',mustChangePassword:false};
  const mocks={
    'node:fs/promises':{readFile:async()=>{throw Error('Não deve acessar PDF fixo quando há substituição');}},
    'node:path':{join:(...parts)=>parts.join('/')},
    'drizzle-orm':orm,'@/db':{getDb:()=>db},'@/db/schema':schema,
    '@/lib/auth':{requireSession:async()=>session},
    '@/lib/content-studio':{getStudioDoc:async()=>{throw Error('Não deve acessar Studio');}},
    '@/lib/reseller-materials':{getManualPdfOverride:async()=>({file_name:'Manual_Atualizado.pdf',file_bytes:pdf})},
    '@/lib/simple-pdf':{buildManualPdf:()=>Buffer.from('')},
  };
  const {GET}=loadNative('app/api/reseller/manual/route.ts',mocks,['GET']);
  const result=await GET(new Request('https://bko.test/api/reseller/manual?edition=material'));
  assert.equal(result.status,200);
  assert.ok(Buffer.from(await result.arrayBuffer()).equals(pdf));
  assert.match(result.headers.get('content-disposition')||'',/Manual_Atualizado.pdf/);
  assert.match(result.headers.get('cache-control')||'',/private, no-store/);
});

test('BKO apresenta troca do manual e edição de cada material, sem oferecer editor interno de PDF',()=>{
  const component=readFileSync(new URL('../components/reseller-materials.tsx',import.meta.url),'utf8');
  const css=readFileSync(new URL('../app/portal-modern.css',import.meta.url),'utf8');
  assert.match(component,/Substituir Manual do Revendedor/);
  assert.match(component,/Substituir arquivo/);
  assert.match(component,/method:"PUT"/);
  assert.match(component,/kind", "manual"/);
  assert.match(component,/Abrir PDF atual/);
  assert.match(css,/@media\s*\(max-width:\s*780px\)[\s\S]*?\.bko-material-admin\s*\{[^}]*grid-template-columns:\s*1fr/);
});

test('edição de material existente conserva ID e link e permite renomear sem enviar outro arquivo',async()=>{
  const calls=[],id='11111111-1111-4111-8111-111111111111';
  const {PUT}=loadNative(api,{
    'node:crypto':{randomUUID:()=> 'uuid'},
    '@/db':{getMysqlPool:()=>({execute:async(sql,params)=>{
      calls.push({sql,params});return sql.startsWith('SELECT id')?[[{id}]]:[{affectedRows:1}];
    }})},
    '@/lib/auth':{requireAdmin:async()=>({id:'admin'})},
    '@/lib/reseller-materials':{ensureMaterialsTable:async()=>{},ensureManualPdfTable:async()=>{},materialError:e=>Response.json({error:e.message},{status:500})},
    '@/lib/material-file-validation.mjs':await import('../lib/material-file-validation.mjs'),
  },['PUT']);
  const response=await PUT(request({id,title:'PDF editado'}));
  assert.equal(response.status,200);
  assert.equal((await response.json()).url,`/api/reseller/materials/${id}`);
  assert.ok(calls.some(c=>c.sql==='UPDATE reseller_materials SET title=? WHERE id=?'&&c.params[0]==='PDF editado'));
});

test('BKO consulta só metadados do manual, nunca bytes brutos, na listagem administrativa',async()=>{
  const {GET}=loadNative(api,{
    'node:crypto':{randomUUID:()=> 'uuid'},'@/db':{getMysqlPool:()=>({})},
    '@/lib/auth':{requireAdmin:async()=>({id:'admin'})},
    '@/lib/reseller-materials':{ensureMaterialsTable:async()=>{},ensureManualPdfTable:async()=>{},getManualPdfMetadata:async()=>({title:'Atualizado',file_name:'novo.pdf',updated_at:'2026-11-23'}),materialError:e=>Response.json({error:e.message},{status:500})},
    '@/lib/material-file-validation.mjs':await import('../lib/material-file-validation.mjs'),
  },['GET']);
  const response=await GET(new Request('https://bko.test/api/admin/reseller-materials'));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{manual:{title:'Atualizado',file_name:'novo.pdf',updated_at:'2026-11-23'}});
});

test('link Visualizar PDF abre no navegador e ainda exige sessão',async()=>{
  const id='22222222-2222-4222-8222-222222222222';
  const {GET}=loadNative('app/api/reseller/materials/[id]/route.ts',{
    '@/db':{getMysqlPool:()=>({execute:async()=>[[{file_name:'kit.pdf',mime_type:'application/pdf',file_bytes:pdf}]]})},
    '@/lib/reseller-materials':{authorizeMaterials:async()=>({id:'reseller'}),ensureMaterialsTable:async()=>{},materialError:e=>Response.json({error:e.message},{status:500})},
  },['GET']);
  const response=await GET(new Request('https://bko.test/api/reseller/materials/'+id),{params:Promise.resolve({id})});
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-disposition')||'',/^inline;/);
  assert.match(response.headers.get('cache-control')||'',/private/);
});

test('revendedor de KIT100 também abre o manual atualizado após pagamento e liberação',async()=>{
  const schema={purchases:table('id','userId','kit','paymentStatus','accessReleasedAt','asaasVerifiedAt')};
  const {db}=fixtureDb(schema,{purchases:[{id:'kit100',userId:'seller',kit:'kit100',paymentStatus:'paid',accessReleasedAt:'2026-11-23',asaasVerifiedAt:'2026-11-23'}]});
  const orm={...operators,or:(...f)=>r=>f.some(check=>check(r)),isNotNull:k=>r=>r[k]!=null};
  const {GET}=loadNative('app/api/reseller/manual/route.ts',{
    'node:fs/promises':{readFile:async()=>Buffer.from('%PDF-1.7')},'node:path':{join:(...parts)=>parts.join('/')},
    'drizzle-orm':orm,'@/db':{getDb:()=>db},'@/db/schema':schema,
    '@/lib/auth':{requireSession:async()=>({id:'seller',role:'reseller',mustChangePassword:false})},
    '@/lib/content-studio':{getStudioDoc:async()=>({published:{pages:[]}})},
    '@/lib/reseller-materials':{getManualPdfOverride:async()=>({file_name:'atual.pdf',file_bytes:pdf})},
    '@/lib/simple-pdf':{buildManualPdf:()=>pdf},
  },['GET']);
  const response=await GET(new Request('https://bko.test/api/reseller/manual?edition=material'));
  assert.equal(response.status,200);
});

test('manual e materiais não são liberados para compra paid sem verificação do Asaas',async()=>{
  const schema={purchases:table('id','userId','kit','paymentStatus','accessReleasedAt','asaasVerifiedAt'),resellerProfiles:table('userId','purchaseId','initialKit')};
  const stale={id:'stale',userId:'seller',kit:'kit20',paymentStatus:'paid',accessReleasedAt:'2026',asaasVerifiedAt:null};
  const {db}=fixtureDb(schema,{purchases:[stale],resellerProfiles:[]});
  const orm={...operators,or:(...f)=>r=>f.some(check=>check(r)),isNotNull:k=>r=>r[k]!=null};
  const session={id:'seller',role:'reseller',mustChangePassword:false};
  const {GET}=loadNative('app/api/reseller/manual/route.ts',{
    'node:fs/promises':{readFile:async()=>Buffer.from('%PDF-1.7')},'node:path':{join:(...parts)=>parts.join('/')},
    'drizzle-orm':orm,'@/db':{getDb:()=>db},'@/db/schema':schema,
    '@/lib/auth':{requireSession:async()=>session},
    '@/lib/content-studio':{getStudioDoc:async()=>({published:{pages:[]}})},
    '@/lib/reseller-materials':{getManualPdfOverride:async()=>({file_name:'novo.pdf',file_bytes:pdf}),hasManualResellerProfile:async()=>false},
    '@/lib/simple-pdf':{buildManualPdf:()=>pdf},
  },['GET']);
  assert.equal((await GET(new Request('https://bko.test/api/reseller/manual?edition=material'))).status,403);
  const {authorizeMaterials}=loadNative('lib/reseller-materials.ts',{
    'drizzle-orm':orm,'@/db':{getDb:()=>db,getMysqlPool:()=>({})},'@/db/schema':schema,'@/lib/auth':{requireSession:async()=>session},
  },['authorizeMaterials']);
  await assert.rejects(authorizeMaterials(new Request('https://bko.test/api/reseller/materials')),{message:'FORBIDDEN'});
});

test('revendedor cadastrado manualmente abre manual e materiais sem compra Asaas',async()=>{
  const schema={purchases:table('id','userId','kit','paymentStatus','accessReleasedAt','asaasVerifiedAt'),resellerProfiles:table('userId','purchaseId','initialKit')};
  const orm={...operators,or:(...f)=>r=>f.some(check=>check(r)),isNotNull:k=>r=>r[k]!=null};
  const session={id:'seller',role:'reseller',mustChangePassword:false};
  const {db}=fixtureDb(schema,{purchases:[],resellerProfiles:[{userId:'seller',purchaseId:null,initialKit:'manual'}]});
  const {authorizeMaterials,hasManualResellerProfile}=loadNative('lib/reseller-materials.ts',{
    'drizzle-orm':orm,'@/db':{getDb:()=>db,getMysqlPool:()=>({})},'@/db/schema':schema,'@/lib/auth':{requireSession:async()=>session},
  },['authorizeMaterials','hasManualResellerProfile']);
  assert.equal(await hasManualResellerProfile('seller'),true);
  assert.equal((await authorizeMaterials(new Request('https://bko.test/api/reseller/materials'))).id,'seller');
  const {GET}=loadNative('app/api/reseller/manual/route.ts',{
    'node:fs/promises':{readFile:async()=>{throw Error('PDF base não deve ser aberto');}},'node:path':{join:(...parts)=>parts.join('/')},
    'drizzle-orm':orm,'@/db':{getDb:()=>db},'@/db/schema':schema,
    '@/lib/auth':{requireSession:async()=>session},
    '@/lib/content-studio':{getStudioDoc:async()=>({published:{pages:[]}})},
    '@/lib/reseller-materials':{getManualPdfOverride:async()=>({file_name:'novo.pdf',file_bytes:pdf}),hasManualResellerProfile},
    '@/lib/simple-pdf':{buildManualPdf:()=>pdf},
  },['GET']);
  assert.equal((await GET(new Request('https://bko.test/api/reseller/manual?edition=material'))).status,200);
});

test('compra Asaas antiga com profile sem vínculo e kit comprado não vira cadastro manual',async()=>{
  const schema={purchases:table('id','userId','kit','paymentStatus','accessReleasedAt','asaasVerifiedAt'),resellerProfiles:table('userId','purchaseId','initialKit')};
  const {db}=fixtureDb(schema,{purchases:[],resellerProfiles:[{userId:'seller',purchaseId:null,initialKit:'kit20'}]});
  const {hasManualResellerProfile}=loadNative('lib/reseller-materials.ts',{
    'drizzle-orm':{...operators,or:(...f)=>r=>f.some(check=>check(r)),isNotNull:k=>r=>r[k]!=null},
    '@/db':{getDb:()=>db,getMysqlPool:()=>({})},'@/db/schema':schema,'@/lib/auth':{requireSession:async()=>({id:'seller'})},
  },['hasManualResellerProfile']);
  assert.equal(await hasManualResellerProfile('seller'),false);
});
