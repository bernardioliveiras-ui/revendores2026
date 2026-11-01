import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {load} from './runtime-loader.mjs';
import ts from 'typescript';
const fields=JSON.parse(readFileSync('data/landing-texts.json','utf8'));
const model=()=>load('lib/landing-texts.ts',{'@/data/landing-texts.json':{default:fields}});

test('o Studio nunca edita className, estilos ou atributos de layout',()=>{
 for(const file of ['components/landing-page.tsx','components/landing-sections.tsx','components/checkout-form.tsx','components/profit-simulator.tsx']){
  const tree=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function visit(node){if(ts.isCallExpression(node)&&node.expression.getText()==='landingText')for(let parent=node.parent;parent;parent=parent.parent)if(ts.isJsxAttribute(parent)){assert.ok(['alt','aria-label','placeholder','title'].includes(parent.name.getText()),`Texto usado em atributo protegido: ${file} ${parent.name.getText()}`);break;}ts.forEachChild(node,visit);}
  visit(tree);
 }
});
function store(){
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE content_studio(doc_type TEXT PRIMARY KEY,draft_json TEXT,published_json TEXT,updated_at TEXT,published_at TEXT)');
 const pool={async execute(sql,args){const statement=db.prepare(sql.replace('INSERT IGNORE','INSERT OR IGNORE'));return [/^SELECT/.test(sql)?statement.all(...args):{affectedRows:Number(statement.run(...args).changes)}];}};
 return {db,module:load('lib/landing-texts-store.ts',{'@/db':{getMysqlPool:()=>pool},'@/lib/content-studio':{ensureContentStudioSchema:async()=>{}},'@/lib/landing-texts':model()})};
}
test('Studio aceita somente campos de texto conhecidos e preserva os espaços',()=>{
 const m=model();assert.deepEqual(m.validateLandingTexts({'inicio.title':' Nova chamada '}),{'inicio.title':' Nova chamada '});
 for(const bad of [{style:{fontSize:'1000px'}},{studio:{html:'<p>OLD</p>'}},{'inicio.title':'x'.repeat(fields['inicio.title'].maxLength+1)},null])assert.throws(()=>m.validateLandingTexts(bad));
 assert.equal(m.landingText({},'inicio.title'),'Vem realizar seus sonhos ');
 assert.equal(m.landingText({'inicio.title':'Título novo'},'inicio.title'),'Título novo ','mantém a separação do próximo trecho destacado sem exigir um espaço digitado');
});
test('rascunho não altera LP; publicação é atômica e rejeita versão antiga',async()=>{
 const {module:s}=store();const original=await s.readLandingTextDocument();
 const draft=await s.writeLandingTextDocument({'inicio.title':'Meu título em rascunho'},original.revision,false);
 assert.equal((await s.readPublishedLandingTexts())['inicio.title'],fields['inicio.title'].text);
 assert.equal((await s.readLandingTextDocument()).texts['inicio.title'],'Meu título em rascunho');
 await assert.rejects(()=>s.writeLandingTextDocument({'inicio.title':'Versão antiga'},original.revision,true),e=>e.status===409);
 await s.writeLandingTextDocument(draft.texts,draft.revision,true);
 assert.equal((await s.readPublishedLandingTexts())['inicio.title'],'Meu título em rascunho');
});
test('documento novo ignora HTML e estilos do Studio antigo',async()=>{
 const {db,module:s}=store();db.prepare('INSERT INTO content_studio VALUES(?,?,?,?,?)').run('landing','{}',JSON.stringify({studio:{enabled:true,html:'OLD',styles:{desktop:{}}}}),'2026-01-01',null);
 assert.equal((await s.readPublishedLandingTexts())['inicio.title'],fields['inicio.title'].text);
 assert.equal(db.prepare('SELECT published_json FROM content_studio WHERE doc_type=?').get('landing').published_json.includes('OLD'),true);
});
test('falha do banco mantém o conteúdo original público sem expor o erro',async()=>{
 const s=load('lib/landing-texts-store.ts',{'@/db':{getMysqlPool:()=>{throw Error('SECRET_CONNECTION')}},'@/lib/content-studio':{ensureContentStudioSchema:async()=>{throw Error('SECRET_CONNECTION')}},'@/lib/landing-texts':model()});
 assert.equal((await s.readPublishedLandingTexts())['inicio.title'],fields['inicio.title'].text);
});
function api({authError,password=false}={}){
 let reads=0,writes=0;const m=model();
 const route=load('app/api/admin/landing-texts/route.ts',{'@/lib/auth':{requireAdmin:async()=>{if(authError)throw Error(authError);return {role:'admin',mustChangePassword:password};}},'@/lib/seo':{getSiteUrl:()=> 'https://example.test'},'@/lib/landing-texts':m,'@/lib/landing-texts-store':{readLandingTextDocument:async()=>{reads++;return {texts:{},revision:'2026-10-10T12:00:00.000Z'};},writeLandingTextDocument:async(texts,revision,publish)=>{m.validateLandingTexts(texts);writes++;return {texts,revision,publish};}}});return {route,counts:()=>({reads,writes})};
}
for(const [authError,status] of [['UNAUTHORIZED',401],['FORBIDDEN',403]])for(const method of ['GET','PUT'])test(`Studio ${method} impede ${authError} antes do banco`,async()=>{
 const a=api({authError});assert.equal((await a.route[method](new Request('https://example.test/api/admin/landing-texts',{method}))).status,status);assert.deepEqual(a.counts(),{reads:0,writes:0});
});
test('Studio rejeita senha inicial, origem externa, estilo e corpo grande',async()=>{
 const first=api({password:true});assert.equal((await first.route.GET(new Request('https://example.test'))).status,403);assert.equal(first.counts().reads,0);
 const cases=[{headers:{origin:'https://evil.test'},body:{texts:{},revision:'x',publish:false},status:403},{body:{texts:{style:'position:absolute'},revision:'x',publish:false},status:400},{raw:'x'.repeat(180001),status:413},{raw:'null',status:400}];
 for(const item of cases){const a=api();const response=await a.route.PUT(new Request('https://example.test/api/admin/landing-texts',{method:'PUT',headers:{'content-type':'application/json','x-landing-studio':'1',...item.headers},body:item.raw||JSON.stringify(item.body)}));assert.equal(response.status,item.status);assert.equal(a.counts().writes,0);}
});
