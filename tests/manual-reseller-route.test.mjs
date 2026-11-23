import test from "node:test";
import assert from "node:assert/strict";
import { fixtureDb, loadNative, operators, table } from "./native-runtime-loader.mjs";
import { validateManualReseller } from "../lib/reseller-registration.mjs";

const contact={name:"Carlos Almeida",email:"carlos@example.com",phone:"11988887777",cpfCnpj:"52998224725",postalCode:"01310100",street:"Av Paulista",number:"100",complement:"",district:"Bela Vista",city:"São Paulo",state:"SP"};
const schema={users:table("id","email","role","status","name","phone"),resellerProfiles:table("id","userId","purchaseId","cpfCnpj","postalCode","initialKit","initialBoxes")};

function setup() {
  const f=fixtureDb(schema);
  let issued=0;
  const deps={
    "drizzle-orm":operators,"@/db":{getDb:()=>f.db,getMysqlPool:()=>({})},"@/db/schema":{...schema,authSessions:table("userId")},
    "@/lib/auth":{requireAdmin:async()=>({id:"admin01"}),normalizeEmail:v=>typeof v==="string"&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())?v.trim().toLowerCase():null,isAdminEmail:e=>e==="admin@example.com"},
    "@/lib/runtime-schema":{ensureOperationalSchema:async()=>{}},
    "@/lib/reseller-edit-validation.mjs":{validateResellerEdit:()=>({})},
    "@/lib/reseller-delete-guards.mjs":{resellerDeletionBlockers:()=>[]},
    "@/lib/indicator-security":{cleanText:v=>String(v||""),indicatedError:e=>Response.json({error:String(e.message)},{status:500}),privateResponseHeaders:{"cache-control":"no-store"}},
    "@/lib/reseller-registration.mjs":{validateManualReseller},
    "@/lib/reseller-invitations":{issueResellerInvitation:async()=>{issued++;return {activationPath:"/ativar-revendedor?token=synthetic",expiresAt:"2026-11-24T00:00:00Z"}}},
    "@/lib/mysql-errors":{isMysqlDuplicateKeyError:()=>false},
  };
  const {POST}=loadNative("app/api/admin/resellers/route.ts",deps,["POST"]);
  const request=(fields=contact,headers={origin:"https://example.test",host:"example.test"})=>new Request("https://example.test/api/admin/resellers",{method:"POST",headers:{"content-type":"application/json",...headers},body:JSON.stringify(fields)});
  return {...f,request,POST,get issued(){return issued}};
}

test("manual BKO registration creates user and zero-stock address profile without an Asaas order",async()=>{
  const f=setup();const response=await f.POST(f.request());const body=await response.json();
  assert.equal(response.status,201);assert.equal(body.created,true);
  assert.equal(f.rows.users.length,1);assert.equal(f.rows.users[0].role,"reseller");assert.equal(f.rows.users[0].passwordHash,null);
  assert.equal(f.rows.resellerProfiles.length,1);assert.equal(f.rows.resellerProfiles[0].purchaseId,null);
  assert.equal(f.rows.resellerProfiles[0].initialBoxes,0);assert.equal(f.rows.resellerProfiles[0].initialKit,"manual");
  assert.equal(f.issued,1);assert.match(body.activationPath,/^\/ativar-revendedor/);
});

test("manual registration rejects missing Origin and repeated email, without changing a prior account",async()=>{
  const f=setup();
  const blocked=await f.POST(f.request(contact,{host:"example.test",origin:"https://other.test"}));
  assert.equal(blocked.status,403);assert.equal(f.rows.users.length,0);
  assert.equal((await f.POST(f.request())).status,201);
  assert.equal((await f.POST(f.request())).status,409);
  assert.equal(f.rows.users.length,1);assert.equal(f.rows.resellerProfiles.length,1);assert.equal(f.issued,1);
});

test("registration rejects invalid CPF, no phantom data created",async()=>{
  const f=setup();const response=await f.POST(f.request({...contact,cpfCnpj:"11111111111"}));
  assert.equal(response.status,400);assert.equal(f.rows.users.length,0);
});
