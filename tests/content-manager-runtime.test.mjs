import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Small hook scheduler executes the shipped component; only React rendering
// and HTTP are doubled so requests can complete in a controlled order.
function manager(){
 const slots=[];let cursor=0;let effects=[];
 const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const react={
  useState(initial){const i=cursor++;if(!slots[i])slots[i]={value:typeof initial==='function'?initial():initial};return [slots[i].value,v=>{slots[i].value=typeof v==='function'?v(slots[i].value):v}]},
  useRef(initial){const i=cursor++;return (slots[i]??={current:initial})},
  useMemo(fn,deps){const i=cursor++;if(!slots[i]||!equal(slots[i].deps,deps))slots[i]={value:fn(),deps};return slots[i].value},
  useEffect(fn,deps){const i=cursor++;if(!slots[i]||!equal(slots[i].deps,deps)){const old=slots[i];slots[i]={deps};effects.push(()=>{old?.cleanup?.();slots[i].cleanup=fn()})}},
 };react.useCallback=(fn,deps)=>react.useMemo(()=>fn,deps);
 const jsx=(type,props)=>({type,props});
 const source=readFileSync(new URL('../components/content-studio-admin.tsx',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};new Function('require','exports',code)(id=>id==='react'?react:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id==='@/components/welcome-video'?{WelcomeVideo:()=>null}:(()=>{throw Error('Unmocked '+id)})(),exports);
 return {slots,render(){cursor=0;effects=[];const tree=exports.ContentStudioAdmin();effects.forEach(fn=>fn());return tree}};
}
function find(node,label){
 if(!node||typeof node!=='object')return null;
 if(typeof label==='function'?label(node):node.type==='button'&&node.props.children===label)return node;
 for(const child of [node.props?.children].flat(Infinity)){const result=find(child,label);if(result)return result}return null;
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const doc=type=>({type,draft:type==='manual'?{pages:[],fieldCount:0}:{products:[]},published:{}});
function browser(){const old=globalThis.window;globalThis.window={location:{origin:'https://example.test'},addEventListener(){},removeEventListener(){}};return ()=>{globalThis.window=old}};

test('salvar/publicar não enviam documento de outra aba durante troca de conteúdo',async()=>{
 const restore=browser();const old=globalThis.fetch;const requests=[];
 globalThis.fetch=async(url,init)=>{requests.push({url,init});return {ok:true,json:async()=>doc('products')}};
 try{
  const s=manager();s.slots[0]={value:'products'};s.slots[1]={value:doc('manual')};s.slots[2]={value:false};
  const tree=s.render();const save=find(tree,'Salvar rascunho');const publish=find(tree,'Publicar');
  await save.props.onClick();await publish.props.onClick();await tick();
  assert.equal(requests.filter(r=>['PATCH','POST'].includes(r.init?.method)).length,0);
  assert.equal(save.props.disabled,true);assert.equal(publish.props.disabled,true);
 }finally{globalThis.fetch=old;restore()}
});
test('resposta atrasada do manual não sobrescreve produtos após troca de aba',async()=>{
 const restore=browser();const old=globalThis.fetch;const requests=[];
 globalThis.fetch=(url,init)=>new Promise(resolve=>requests.push({url,init,resolve}));
 try{
  const s=manager();let tree=s.render();assert.equal(requests[0].url,'/api/admin/cms/manual');
  find(tree,'Produtos').props.onClick();tree=s.render();assert.equal(requests[1].url,'/api/admin/cms/products');
  requests[1].resolve({ok:true,json:async()=>doc('products')});await tick();assert.equal(s.slots[1].value.type,'products');
  requests[0].resolve({ok:true,json:async()=>doc('manual')});await tick();assert.equal(s.slots[1].value.type,'products');
 }finally{globalThis.fetch=old;restore()}
});

test('salvar e publicar preservam payload e ordem PATCH antes do POST',async()=>{
 const restore=browser();const old=globalThis.fetch;const requests=[];
 const original={...doc('manual'),draft:{pages:[{page:1,fields:[{id:'field1',text:'Texto original',x:12}]}],fieldCount:1,metadata:{preserved:true}}};
 globalThis.fetch=async(url,init)=>{requests.push({url,init});return {ok:true,json:async()=>structuredClone(original)}};
 try{
  const s=manager();s.render();await tick();let tree=s.render();
  find(tree,'Salvar rascunho').props.onClick();await tick();tree=s.render();find(tree,'Publicar').props.onClick();await tick();
  const writes=requests.filter(r=>r.init?.method);assert.deepEqual(writes.map(r=>r.init.method),['PATCH','PATCH','POST']);
  for(const write of writes.slice(0,2))assert.deepEqual(JSON.parse(write.init.body),{draft:original.draft});
  assert.deepEqual(JSON.parse(writes[2].init.body),{action:'publish'});assert.equal(s.slots[3].value,'Conteúdo publicado.');
 }finally{globalThis.fetch=old;restore()}
});

test('upload de vídeo mantém FormData e seleciona Boas Vindas sem publicar',async()=>{
 const restore=browser();const old=globalThis.fetch;const oldFormData=globalThis.FormData;const requests=[];let reset=false;
 class UploadFormData{constructor(form){this.form=form}}
 globalThis.FormData=UploadFormData;
 globalThis.fetch=async(url,init)=>{requests.push({url,init});return {ok:true,json:async()=>init.method==='POST'?{id:'video1',name:'Boas Vindas',mimeType:'video/mp4',sizeBytes:200,url:'/api/media/video1'}:url==='/api/admin/media'?{assets:[]}:doc('media')}};
 try{
  const s=manager();s.slots[0]={value:'media'};s.render();await tick();const tree=s.render();
  await find(tree,node=>node.type==='form').props.onSubmit({preventDefault(){},currentTarget:{reset(){reset=true}}});
  const writes=requests.filter(r=>r.init.method);assert.equal(writes.length,1);assert.equal(writes[0].url,'/api/admin/media');
  assert.ok(writes[0].init.body instanceof UploadFormData);assert.equal(writes[0].init.headers['content-type'],undefined);
  assert.equal(s.slots[1].value.draft.welcomeVideo.sourceUrl,'/api/media/video1');assert.equal(reset,true);
 }finally{globalThis.fetch=old;globalThis.FormData=oldFormData;restore()}
});

test('erro de carregamento mantém salvar/publicar indisponíveis',async()=>{
 const restore=browser();const old=globalThis.fetch;
 globalThis.fetch=async()=>({ok:false,json:async()=>({error:'Falha de teste'})});
 try{
  const s=manager();s.render();await tick();const tree=s.render();assert.equal(s.slots[3].value,'Falha de teste');
  assert.equal(find(tree,'Salvar rascunho').props.disabled,true);assert.equal(find(tree,'Publicar').props.disabled,true);
 }finally{globalThis.fetch=old;restore()}
});

test('clicar a aba já ativa mantém conteúdo carregado e ações disponíveis',async()=>{
 const restore=browser();const old=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,json:async()=>doc('manual')});
 try{
  const s=manager();s.render();await tick();find(s.render(),'Manual').props.onClick();const tree=s.render();
  assert.equal(find(tree,'Salvar rascunho').props.disabled,false);assert.equal(s.slots[1].value.type,'manual');
 }finally{globalThis.fetch=old;restore()}
});
