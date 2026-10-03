import mysql from 'mysql2/promise';
import {migrate} from './migration-core.mjs';
for(const path of ['.env.local','.env']){try{process.loadEnvFile(path)}catch(error){if(error.code!=='ENOENT')throw error}}
let connection;
try{
 for(const name of ['DATABASE_HOST','DATABASE_NAME','DATABASE_USER','DATABASE_PASSWORD'])if(!process.env[name])throw new Error(`Configure ${name} na Hostinger.`);
 connection=await mysql.createConnection({host:process.env.DATABASE_HOST,port:Number(process.env.DATABASE_PORT||3306),user:process.env.DATABASE_USER,password:process.env.DATABASE_PASSWORD,database:process.env.DATABASE_NAME,ssl:['1','true','yes'].includes((process.env.DATABASE_SSL||'').toLowerCase())?{}:undefined,connectTimeout:15000});
 await migrate(connection);
 console.log('LORDNUTRI: banco verificado; migrações aditivas aplicadas.');
}catch(error){console.error('LORDNUTRI: migração não concluída:',error.message);process.exitCode=1;}
finally{if(connection)await connection.end()}
