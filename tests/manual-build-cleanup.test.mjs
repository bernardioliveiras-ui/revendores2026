import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, access, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const script=new URL('../scripts/protect-manual-assets.mjs',import.meta.url).pathname;
test('o build elimina cópias públicas antigas sem apagar o PDF privado nem outros recursos',async()=>{
 const root=await mkdtemp(join(tmpdir(),'lordnutri-manual-'));
 try{
  await mkdir(join(root,'public/manual'),{recursive:true});await mkdir(join(root,'private/manual'),{recursive:true});
  for(const name of ['old.pdf','old.pptx','keep.txt'])await writeFile(join(root,'public/manual',name),'fixture');
  await writeFile(join(root,'private/manual','manual.pdf'),'%PDF-private');
  const r=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  await assert.rejects(access(join(root,'public/manual','old.pdf')));await assert.rejects(access(join(root,'public/manual','old.pptx')));
  await access(join(root,'public/manual','keep.txt'));await access(join(root,'private/manual','manual.pdf'));
 }finally{await rm(root,{recursive:true,force:true})}
});
test('o build não exige que a pasta pública antiga exista',async()=>{
 const root=await mkdtemp(join(tmpdir(),'lordnutri-manual-'));
 try{const r=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr)}finally{await rm(root,{recursive:true,force:true})}
});
test('build limpa CSV e CSC de public e subpastas, mantém planilhas privadas e aceita nova execução',async()=>{
 const root=await mkdtemp(join(tmpdir(),'lordnutri-public-'));
 try {
  await mkdir(join(root,'public','antigo'),{recursive:true});
  await mkdir(join(root,'private'));
  for(const name of ['public/lead.CsV','public/antigo/cupom.CSC','public/logo.png','private/pedido.csv']) await writeFile(join(root,name),'fixture');
  for(let i=0;i<2;i++) assert.equal(spawnSync(process.execPath,[script],{cwd:root}).status,0);
  await assert.rejects(access(join(root,'public/lead.CsV')));await assert.rejects(access(join(root,'public/antigo/cupom.CSC')));
  await access(join(root,'public/logo.png'));await access(join(root,'private/pedido.csv'));
 } finally {await rm(root,{recursive:true,force:true});}
});
