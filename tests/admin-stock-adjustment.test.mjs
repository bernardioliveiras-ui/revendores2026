import test from "node:test";
import assert from "node:assert/strict";
import { fixtureDb, loadNative, operators, table } from "./native-runtime-loader.mjs";
import { calculateStock } from "../lib/stock.ts";

const schema={users:table("id","role","status"),stockMovements:table("id","userId","type","boxes","referenceType","referenceId","notes","occurredAt")};
const base={users:[{id:"seller01",role:"reseller",status:"active"}],stockMovements:[
  {id:"entry01",userId:"seller01",type:"entry",boxes:50,referenceType:"initial_purchase",referenceId:"p01",notes:"Compra de kit"},
  {id:"sale01",userId:"seller01",type:"sale",boxes:10,referenceType:"sale",referenceId:"s01",notes:"Venda"},
]};

async function stockLogic(){return import("../lib/stock-adjustment.mjs")}

test("stock correction validates integer saldo and motive without accepting coercion",async()=>{
  const {validateStockCorrection}=await stockLogic();
  const input={userId:"seller01",desiredStock:25,expectedStock:40,reason:"Contagem física"};
  assert.deepEqual(validateStockCorrection(input),{value:input});
  for(const desiredStock of [-1,1.2,"25",null,Number.NaN,2147483648]){
    assert.match(validateStockCorrection({...input,desiredStock}).error||"",/estoque/i);
  }
  assert.match(validateStockCorrection({...input,expectedStock:"40"}).error||"",/saldo/i);
  assert.match(validateStockCorrection({...input,reason:"  "}).error||"",/motivo/i);
  assert.match(validateStockCorrection({...input,userId:""}).error||"",/revendedor/i);
});

test("stock correction emits difference-only signed movement with audit details",async()=>{
  const {planStockCorrection}=await stockLogic();
  assert.deepEqual(planStockCorrection(40,40,"Recontagem","admin01"),{changed:false,stock:40});
  assert.deepEqual(planStockCorrection(40,25,"Recontagem","admin01"),{
    changed:true,type:"adjustment_out",boxes:15,stock:25,notes:"Ajuste de estoque pelo BKO admin01 · Recontagem",
  });
  assert.deepEqual(planStockCorrection(40,55,"Caixas encontradas","admin01"),{
    changed:true,type:"adjustment_in",boxes:15,stock:55,notes:"Ajuste de estoque pelo BKO admin01 · Caixas encontradas",
  });
});

async function setup(options={}){
  const f=fixtureDb(schema,base);
  let repairCalls=0;
  let lockedStockReads=0;
  const select=f.db.select;
  f.db.select=(...args)=>({from(target){
    const chain=select(...args).from(target),previousFor=chain.for;
    chain.for=(mode)=>{if(target===schema.stockMovements&&mode==="update")lockedStockReads++;return previousFor(mode)};
    return chain;
  }});
  const logic=await stockLogic();
  const deps={
    "drizzle-orm":operators,"@/db":{getDb:()=>f.db},"@/db/schema":schema,
    "@/lib/auth":{requireAdmin:async()=>{if(options.forbidden)throw new Error("FORBIDDEN");return {id:"admin01"}}},
    "@/lib/runtime-schema":{ensureOperationalSchema:async()=>{}},
    "@/lib/stock":{calculateStock},
    "@/lib/stock-repair":{repairPaidPurchaseStockForUser:async()=>{repairCalls++}},
    "@/lib/stock-adjustment.mjs":logic,
    "@/lib/indicator-security":{privateResponseHeaders:{"cache-control":"no-store"},indicatedError:e=>Response.json({error:String(e.message)},{status:e.message==="FORBIDDEN"?403:500})},
  };
  const {POST}=loadNative("app/api/admin/resellers/stock/route.ts",deps,["POST"]);
  const request=(overrides={},headers={})=>new Request("https://example.test/api/admin/resellers/stock",{method:"POST",headers:{origin:"https://example.test",host:"example.test","content-type":"application/json",...headers},body:JSON.stringify({userId:"seller01",expectedStock:40,desiredStock:25,reason:"Contagem física",...overrides})});
  return {...f,request,POST,get repairCalls(){return repairCalls},get lockedStockReads(){return lockedStockReads}};
}

test("BKO correction updates shared stock ledger while preserving purchase and sale",async()=>{
  const f=await setup();const response=await f.POST(f.request());const result=await response.json();
  assert.equal(response.status,200);assert.deepEqual({updated:result.updated,changed:result.changed,stock:result.stock},{updated:true,changed:true,stock:25});
  assert.equal(f.repairCalls,1);assert.equal(f.rows.stockMovements.length,3);
  assert.equal(f.rows.stockMovements[0].boxes,50);assert.equal(f.rows.stockMovements[1].boxes,10);
  const adjustment=f.rows.stockMovements[2];
  assert.equal(adjustment.type,"adjustment_out");assert.equal(adjustment.boxes,15);
  assert.equal(adjustment.referenceType,"bko_stock_adjustment");
  assert.match(adjustment.notes,/admin01.*Contagem física/);
  // Mesma função de saldo utilizada pelo GET /api/stock do portal.
  assert.equal(calculateStock(f.rows.stockMovements),25);
});

test("stale balance after another sale blocks correction and reports fresh stock",async()=>{
  const f=await setup();f.rows.stockMovements.push({id:"sale02",userId:"seller01",type:"sale",boxes:5,referenceType:"sale",referenceId:"s02"});
  const response=await f.POST(f.request());const result=await response.json();
  assert.equal(response.status,409);assert.equal(result.code,"STALE_STOCK");assert.equal(result.stock,35);
  assert.equal(f.rows.stockMovements.length,3);
});

test("admin locks the stock-movement range even when it is empty, protecting concurrent Asaas inserts",async()=>{
  const f=await setup();f.rows.stockMovements.length=0;
  const response=await f.POST(f.request({expectedStock:0,desiredStock:5}));
  assert.equal(response.status,200);assert.equal(f.lockedStockReads,1);
  assert.equal(calculateStock(f.rows.stockMovements),5);
});

test("same balance creates no event and does not falsify sales",async()=>{
  const f=await setup();const response=await f.POST(f.request({desiredStock:40}));const result=await response.json();
  assert.equal(response.status,200);assert.equal(result.changed,false);assert.equal(result.stock,40);assert.equal(f.rows.stockMovements.length,2);
});

test("out-of-range correction, unauthorized origin and non-admin are rejected without changing stock",async()=>{
  const f=await setup();
  assert.equal((await f.POST(f.request({desiredStock:-10}))).status,400);
  assert.equal((await f.POST(f.request({}, {origin:"https://evil.test"}))).status,403);
  assert.equal(f.rows.stockMovements.length,2);
  const forbidden=await setup({forbidden:true});
  assert.equal((await forbidden.POST(forbidden.request())).status,403);
  assert.equal(forbidden.rows.stockMovements.length,2);
});

test("non-reseller account cannot receive stock corrections",async()=>{
  const f=await setup();f.rows.users[0].role="indicator";
  const response=await f.POST(f.request());assert.equal(response.status,404);
  assert.equal(f.rows.stockMovements.length,2);assert.equal(f.repairCalls,0);
});
