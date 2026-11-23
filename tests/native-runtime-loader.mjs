// Runs real server TypeScript under Node 24 without installing package dependencies.
// Only external dependencies are replaced by explicit test doubles.
import { stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";

export function loadNative(relative, mocks, exportsList) {
  let source = stripTypeScriptTypes(readFileSync(new URL(`../${relative}`,import.meta.url),"utf8"),{mode:"strip"});
  source = source.replace(/^import\s+(.+?)\s+from\s+["']([^"']+)["'];?$/gm, (_whole, bindings, path) => {
    if (bindings.startsWith("{")) return `const ${bindings} = __mock(${JSON.stringify(path)});`;
    if (bindings.startsWith("* as ")) return `const ${bindings.slice(5)} = __mock(${JSON.stringify(path)});`;
    return `const ${bindings} = __mock(${JSON.stringify(path)}).default;`;
  });
  source = source.replace(/^export\s+(?=(async\s+)?function\s|const\s|class\s)/gm, "");
  const get = (id) => {
    if (!Object.hasOwn(mocks,id)) throw new Error("Missing test double: "+id);
    return mocks[id];
  };
  return new Function("__mock",`${source}\nreturn {${exportsList.join(",")}}`)(get);
}

export function fixtureDb(schema, initial = {}) {
  const rows = Object.fromEntries(Object.keys(schema).map(key=>[key,structuredClone(initial[key]||[])]));
  const tableName = new Map(Object.entries(schema).map(([key,value])=>[value,key]));
  const db = {
    select:()=>({from(table){let filter=()=>true;let limit=Infinity;const chain={where(fn){filter=fn;return chain},limit(n){limit=n;return chain},for(){return chain},then(ok,bad){return Promise.resolve(rows[tableName.get(table)].filter(filter).slice(0,limit).map(row=>({...row}))).then(ok,bad)}};return chain;}}),
    insert:(table)=>({async values(value){rows[tableName.get(table)].push({...value})}}),
    update:(table)=>({set(fields){return {async where(fn){for(const row of rows[tableName.get(table)])if(fn(row))Object.assign(row,fields)}}}}),
    delete:(table)=>({async where(fn){const key=tableName.get(table);rows[key]=rows[key].filter(row=>!fn(row))}}),
  };
  db.transaction=async fn=>{
    const original=structuredClone(rows);
    try{return await fn(db)}catch(error){Object.assign(rows,original);throw error}
  };
  return {rows,db};
}
export const operators = {
  eq:(field,value)=>row=>row[field]===value,
  and:(...conditions)=>row=>conditions.every(condition=>condition(row)),
  isNull:field=>row=>row[field]===null,
};
export const table = (...fields) => Object.fromEntries(fields.map(field=>[field,field]));
