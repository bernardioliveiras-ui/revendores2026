import test from "node:test";
import assert from "node:assert/strict";
import { loadNative } from "./native-runtime-loader.mjs";

const {POST} = loadNative("app/api/admin/resellers/invite/route.ts",{
  "@/lib/auth":{requireAdmin:async()=>({id:"admin"})},
  "@/lib/reseller-invitations":{issueResellerInvitation:async()=>({activationPath:"/ativar-revendedor?token=local",expiresAt:"2026-11-24"})},
  "@/lib/indicated-security":{privateResponseHeaders:{"cache-control":"no-store"}},
},["POST"]);

test("admin invitation rejects HTTP origin outside exact localhost",async()=>{
  const response=await POST(new Request("http://localhost.evil/api/admin/resellers/invite",{
    method:"POST",headers:{origin:"http://localhost.evil",host:"localhost.evil","content-type":"application/json"},body:JSON.stringify({userId:"manual-1"}),
  }));
  assert.equal(response.status,403);
});

test("admin invitation permits matched secure origin",async()=>{
  const response=await POST(new Request("https://example.test/api/admin/resellers/invite",{
    method:"POST",headers:{origin:"https://example.test",host:"example.test","content-type":"application/json"},body:JSON.stringify({userId:"manual-1"}),
  }));
  assert.equal(response.status,200);
});

test("admin invitation rejects absent Origin as forbidden rather than an internal error",async()=>{
  const response=await POST(new Request("https://example.test/api/admin/resellers/invite",{
    method:"POST",headers:{host:"example.test","content-type":"application/json"},body:JSON.stringify({userId:"manual-1"}),
  }));
  assert.equal(response.status,403);
});
