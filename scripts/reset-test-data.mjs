/** Reset dos dados comerciais DE TESTE. Preserva admins, conteúdo, ajustes e estrutura. */
import mysql from "mysql2/promise";
import { createWriteStream, existsSync } from "node:fs";
import { mkdir, rename, stat, unlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { PassThrough } from "node:stream";
for(const file of [".env.local",".env"]){try{process.loadEnvFile(file)}catch(e){if(e.code!=="ENOENT")throw e}}
const execute=process.argv.includes("--execute");
const confirm=process.argv.includes("--confirm=ZERAR-TESTES");
const backupArg=process.argv.find(a=>a.startsWith("--backup="))?.slice(9);
const backup=backupArg?resolve(backupArg):"";
if(execute&&(!confirm||!backup||!backup.endsWith(".jsonl.gz"))){
 console.error("Exige --execute --confirm=ZERAR-TESTES --backup=./backup-testes.jsonl.gz");process.exit(2);
}
if(execute&&existsSync(backup)){console.error("Backup existente. Escolha outro nome para evitar sobrescrever.");process.exit(2)}
const connection=await mysql.createConnection({host:process.env.DATABASE_HOST,port:Number(process.env.DATABASE_PORT||3306),
 user:process.env.DATABASE_USER,password:process.env.DATABASE_PASSWORD,database:process.env.DATABASE_NAME,
 ssl:["1","true","yes"].includes((process.env.DATABASE_SSL||"").toLowerCase())?{}:undefined,connectTimeout:15000});
const tableNames=["affiliate_cashbacks","indicator_receipts","indicator_leads","indicated_receipts","indicated_clients",
 "indicated_invitations","indicator_campaigns","indicator_profiles","affiliate_clicks","affiliate_referrals",
 "measurement_outbox","purchase_measurement","reseller_profiles","stock_movements","sales","asaas_events","purchases","auth_sessions"];
let transaction=false,temporary="";
try{
 const [rows]=await connection.execute("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'");
 const existing=new Set(rows.map(r=>r.name));
 const tables=tableNames.filter(t=>existing.has(t));
 const [admins]=await connection.query("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'");
 if(!admins[0]?.n)throw Error("Nenhum usuário admin encontrado. Aborto preventivo.");
 console.log("Banco alvo:",process.env.DATABASE_NAME,"(host:",process.env.DATABASE_HOST,")");
 for(const t of [...tables,"users"]){const query=t==="users"?"SELECT COUNT(*) AS n FROM users WHERE role <> 'admin'":`SELECT COUNT(*) AS n FROM \`${t}\``;
  const [count]=await connection.query(query);console.log(t,count[0]?.n||0);}
 if(!execute){console.log("SIMULAÇÃO: nenhuma linha apagada. Use os parâmetros de execução e backup para zerar.");process.exit(0)}
 // Backup obrigatório gerado automaticamente em formato JSONL comprimido.
 await mkdir(dirname(backup),{recursive:true});temporary=backup+".partial";
 const input=new PassThrough();const writer=createWriteStream(temporary,{flags:"wx",mode:0o600});
 const saving=pipeline(input,createGzip({level:6}),writer);
 const append=async(obj)=>{if(!input.write(JSON.stringify(obj)+"\n"))await new Promise(ok=>input.once("drain",ok));};
 await append({meta:{database:process.env.DATABASE_NAME,createdAt:new Date().toISOString(),format:"jsonl",note:"Snapshot antes de limpar dados de testes"}});
 for(const t of [...tables,"users"]){
  // Sem dump da senha do admin (que é preservado).
  const [records]=await connection.query(t==="users"?"SELECT * FROM users WHERE role <> 'admin'":`SELECT * FROM \`${t}\``);
  await append({table:t,rows:records});
 }
 input.end();await saving;
 const metadata=await stat(temporary);if(metadata.size<30)throw Error("Backup inválido.");
 await rename(temporary,backup);temporary="";console.log("Backup feito:",backup,"bytes",metadata.size);
 await connection.beginTransaction();transaction=true;
 for(const t of tables){await connection.query(`DELETE FROM \`${t}\``);}
 await connection.query("DELETE FROM users WHERE role <> 'admin'");
 await connection.commit();transaction=false;
 console.log("Limpeza concluída, mantendo",admins[0].n,"administrador(es), tabelas e conteúdos.");
}catch(error){if(transaction)await connection.rollback().catch(()=>{});console.error("ABORTADO:",error.message);process.exitCode=1;}
finally{if(temporary)await unlink(temporary).catch(()=>{});await connection.end();}
