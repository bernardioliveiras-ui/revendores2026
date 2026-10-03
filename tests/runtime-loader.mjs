import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Executes the shipped TypeScript with explicit boundary doubles (no network/DB).
export function load(relative, mocks = {}) {
 const source=readFileSync(new URL('../'+relative,import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};
 new Function('require','exports',code)((id)=>{
  if(Object.hasOwn(mocks,id))return mocks[id];
  if(id.startsWith('@/'))throw new Error('Unmocked dependency '+id);
  return require(id);
 },exports);
 return exports;
}
export function memoryDb(schema, initial={}) {
 const rows=Object.fromEntries(Object.keys(schema).map(k=>[k,structuredClone(initial[k]||[])]));
 const tableNames=new Map(Object.entries(schema).map(([k,v])=>[v,k]));
 const db={
  select:()=>({from(table){let where=()=>true;let n=Infinity;const q={where(fn){where=fn;return q},limit(v){n=v;return q},for(){return q},then(a,b){return Promise.resolve(rows[tableNames.get(table)].filter(where).slice(0,n).map(r=>({...r}))).then(a,b)}};return q}}),
  insert:(table)=>({async values(value){rows[tableNames.get(table)].push({...value});}}),
  update:(table)=>({set(patch){return {async where(fn){let count=0;for(const row of rows[tableNames.get(table)])if(fn(row)){Object.assign(row,patch);count++}return [{affectedRows:count}]}}}}),
  delete:(table)=>({async where(fn){const key=tableNames.get(table);rows[key]=rows[key].filter(r=>!fn(r))}})
 };
 let queue=Promise.resolve();
 db.transaction=(fn)=>{const next=queue.then(async()=>{const before=structuredClone(rows);try{return await fn(db)}catch(e){Object.assign(rows,before);throw e}});queue=next.catch(()=>{});return next};
 return {db,rows};
}
export const operators={eq:(column,value)=>(row)=>row[column]===value,and:(...f)=>(row)=>f.every(fn=>fn(row))};
export const table=(...columns)=>Object.fromEntries(columns.map(k=>[k,k]));
