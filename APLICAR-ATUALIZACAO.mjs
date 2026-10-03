import {cp,rename,mkdir,readdir,readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const source=path.dirname(fileURLToPath(import.meta.url));
const destination=process.argv[2] && path.resolve(process.argv[2]);
if(!destination)throw new Error('Uso: node APLICAR-ATUALIZACAO.mjs "C:\\pasta\\do\\repositorio"');
if(destination===source || destination.startsWith(source+path.sep) || source.startsWith(destination+path.sep))throw new Error('Extraia o pacote fora da pasta do repositório.');
await access(path.join(destination,'.git'));
const target=JSON.parse(await readFile(path.join(destination,'package.json'),'utf8'));
if(target.name!=='mix10-pro-revendedores')throw new Error('Esta pasta não é o repositório MIX10 PRO.');
const backup=path.join(path.dirname(destination),`LORDNUTRI-backup-${Date.now()}`);
await mkdir(backup);
const excluded=new Set(['node_modules','.next','.git','tsconfig.tsbuildinfo','APLICAR-ATUALIZACAO.mjs']);
const entries=(await readdir(source)).filter(name=>!excluded.has(name)&&(!name.startsWith('.env')||name==='.env.example'));
for(const name of entries){
 const dest=path.join(destination,name);
 try{await rename(dest,path.join(backup,name))}catch(e){if(e.code!=='ENOENT')throw e}
 await cp(path.join(source,name),dest,{recursive:true});
}
console.log(`Código atualizado. Backup: ${backup}`);
console.log('Revise as alterações no GitHub Desktop, faça Commit e Push origin na branch ligada à Hostinger.');
console.log('Credenciais .env e histórico .git foram preservados. Nenhum commit ou deploy foi executado por este script.');
