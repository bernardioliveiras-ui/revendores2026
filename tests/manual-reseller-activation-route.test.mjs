import test from "node:test";
import assert from "node:assert/strict";
import { fixtureDb, loadNative, operators, table } from "./native-runtime-loader.mjs";
import { canIssueManualResellerInvitation, isUsableManualResellerInvitation, validateManualResellerActivation } from "../lib/reseller-invitation-policy.mjs";

const TOKEN="z".repeat(43);
const schema={
  users:table("id","role","status","passwordHash"),resellerProfiles:table("userId","purchaseId"),
  resellerInvitations:table("tokenHash","userId","usedAt","expiresAt"),authSessions:table("userId"),
};
const user={id:"manual-1",role:"reseller",status:"active",passwordHash:null};

function fixture(profilePurchaseId=null){
 const f=fixtureDb(schema,{users:[{...user}],resellerProfiles:[{userId:"manual-1",purchaseId:profilePurchaseId}],authSessions:[{userId:"manual-1"}]});
 const deps={"drizzle-orm":operators,"@/db":{getDb:()=>f.db},"@/db/schema":schema,
  "@/lib/runtime-schema":{ensureOperationalSchema:async()=>{}},
  "@/lib/indicated-security":{newInvitationToken:()=>TOKEN,invitationHash:t=>"hash:"+t,privateResponseHeaders:{"cache-control":"no-store"}},
  "@/lib/reseller-invitation-policy.mjs":{canIssueManualResellerInvitation,isUsableManualResellerInvitation,validateManualResellerActivation},
  "@/lib/passwords":{hashPassword:async value=>"hashed:"+value},
 };
 const {issueResellerInvitation}=loadNative("lib/reseller-invitations.ts",deps,["issueResellerInvitation"]);
 const {POST}=loadNative("app/api/reseller/activate/route.ts",deps,["POST"]);
 const request=()=>new Request("https://example.test/api/reseller/activate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:TOKEN,password:"strong-password-123",confirm:"strong-password-123"})});
 return {...f,issueResellerInvitation,POST,request};
}

test("manual invitation stores only hash and activation sets password once",async()=>{
 const f=fixture();const result=await f.issueResellerInvitation("manual-1");
 assert.match(result.activationPath,/^\/ativar-revendedor\?token=/);
 assert.equal(f.rows.resellerInvitations.length,1);
 assert.equal(f.rows.resellerInvitations[0].tokenHash,"hash:"+TOKEN);
 assert.equal((await f.POST(f.request())).status,200);
 assert.equal(f.rows.users[0].passwordHash,"hashed:strong-password-123");
 assert.equal(f.rows.authSessions.length,0);
 assert.equal((await f.POST(f.request())).status,410);
});

test("purchased-kit reseller cannot use the manual invitation channel",async()=>{
 const f=fixture("paid-order-1");
 await assert.rejects(()=>f.issueResellerInvitation("manual-1"),/RESELLER_INVITE_FORBIDDEN/);
 assert.equal(f.rows.resellerInvitations.length,0);
});
