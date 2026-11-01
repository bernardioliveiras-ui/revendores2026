import test from 'node:test';
import assert from 'node:assert/strict';
import {migrate} from '../scripts/migration-core.mjs';
test('migração aplica colunas faltantes uma vez e pode ser repetida',async()=>{
 const tables=new Map();const statements=[];
 const db={async query(sql){statements.push(sql);if(sql.includes('GET_LOCK'))return [[{acquired:1}]];
  if(sql.startsWith('CREATE TABLE')){const name=/EXISTS `([^`]+)`/.exec(sql)[1];if(!tables.has(name))tables.set(name,new Set([...sql.matchAll(/(?:^|[\n,])\s*`?([a-z_]+)`?\s+(?:varchar\(\d+\)|int|bigint|text)(?=[\s,])/g)].map(m=>m[1])))}
  if(sql.startsWith('ALTER TABLE')){const [,table,col]=/TABLE `([^`]+)` ADD COLUMN `([^`]+)`/.exec(sql);tables.get(table).add(col)}return [[]]},
 async execute(_sql,[table]){return [[...(tables.get(table)||[])].map(COLUMN_NAME=>({COLUMN_NAME}))]}};
 await migrate(db);tables.get('purchases').delete('welcome_status');await migrate(db);await migrate(db);
 assert.equal(statements.filter(s=>s.startsWith('ALTER TABLE')).length,1);
 assert.equal(tables.has('affiliate_cashbacks'),true);assert.equal(statements.filter(s=>s.includes('RELEASE_LOCK')).length,3);
});
