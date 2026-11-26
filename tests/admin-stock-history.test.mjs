import test from "node:test";
import assert from "node:assert/strict";

test("BKO stock audit groups only manual stock entries/adjustments by reseller and newest first",async()=>{
  const {groupManualStockHistory}=await import("../lib/admin-stock-history.mjs");
  const rows=[
    {id:"a",userId:"u1",type:"entry",boxes:50,referenceType:"manual_initial_stock",notes:"Início",occurredAt:"2026-11-22T09:00:00.000Z"},
    {id:"b",userId:"u1",type:"sale",boxes:10,referenceType:"sale",notes:"Venda",occurredAt:"2026-11-23T09:00:00.000Z"},
    {id:"c",userId:"u2",type:"adjustment_out",boxes:2,referenceType:"bko_stock_adjustment",notes:"Outro",occurredAt:"2026-11-23T10:00:00.000Z"},
    {id:"d",userId:"u1",type:"adjustment_in",boxes:3,referenceType:"bko_stock_adjustment",notes:"Conferência",occurredAt:"2026-11-25T10:00:00.000Z"},
    {id:"e",userId:"u1",type:"entry",boxes:20,referenceType:"initial_purchase",notes:"Asaas",occurredAt:"2026-11-24T10:00:00.000Z"},
  ];
  const history=groupManualStockHistory(rows);
  assert.deepEqual(history.get("u1")?.map(item=>item.id),["d","a"]);
  assert.deepEqual(history.get("u2")?.map(item=>item.id),["c"]);
  assert.equal(history.get("u3"),undefined);
});

test("BKO stock audit caps recent list without erasing any ledger events",async()=>{
  const {groupManualStockHistory}=await import("../lib/admin-stock-history.mjs");
  const rows=Array.from({length:8},(_,i)=>({id:String(i),userId:"u1",type:"adjustment_in",boxes:1,referenceType:"bko_stock_adjustment",notes:"Ajuste",occurredAt:`2026-11-${String(i+1).padStart(2,"0")}T12:00:00Z`}));
  assert.deepEqual(groupManualStockHistory(rows,3).get("u1")?.map(item=>item.id),["7","6","5"]);
  assert.equal(rows.length,8);
});
