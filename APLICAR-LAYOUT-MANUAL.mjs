import {copyFile,mkdir,readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const source=path.dirname(fileURLToPath(import.meta.url));
const target=process.argv[2]&&path.resolve(process.argv[2]);
if(!target||target===source)throw new Error('Extraia fora do projeto. Uso: node APLICAR-LAYOUT-MANUAL.mjs "C:\\pasta\\do\\projeto"');
const pkg=JSON.parse(await readFile(path.join(target,'package.json'),'utf8'));
if(pkg.name!=='mix10-pro-revendedores')throw new Error('A pasta deve ser o projeto LORD NUTRI de revendedores.');
const files=['app/page.tsx','app/landing.css','public/brand/lordnutri-logo.png','public/brand/mix10-box.png','public/brand/conversa-revenda.png','public/brand/caminhada-bem-estar.png','public/manual/MANUAL-DO-REVENDEDOR-LORDNUTRI-MIX10PRO.pdf'];
const backup=path.join(path.dirname(target),`LORD-NUTRI-layout-backup-${Date.now()}`);
for(const file of files){const dest=path.join(target,file);await mkdir(path.dirname(dest),{recursive:true});try{await access(dest);const b=path.join(backup,file);await mkdir(path.dirname(b),{recursive:true});await copyFile(dest,b);}catch(e){if(e.code!=='ENOENT')throw e;}await copyFile(path.join(source,file),dest);}
console.log(`Layout aplicado. Backup: ${backup}`);
console.log('Revise, faça commit e push na branch da Hostinger.');
