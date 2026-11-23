import test from "node:test";
import assert from "node:assert/strict";
import { canIssueManualResellerInvitation, isUsableManualResellerInvitation, validateManualResellerActivation } from "../lib/reseller-invitation-policy.mjs";

const user = {id:"usr1",role:"reseller",status:"active"};
const manualProfile = {userId:"usr1",purchaseId:null};
const token = "a".repeat(43);

test("only active manual resellers get activation links, never indicators or paid-kit profiles", () => {
  assert.equal(canIssueManualResellerInvitation(user,manualProfile),true);
  for (const [person,profile] of [
    [{...user,role:"indicator"},manualProfile], [{...user,status:"inactive"},manualProfile],
    [user,{...manualProfile,purchaseId:"real-order"}], [user,null],
  ]) assert.equal(canIssueManualResellerInvitation(person,profile),false);
});

test("activation requires 24h-valid unused token, manual profile and active user", () => {
  const invite={tokenHash:"sha256",usedAt:null,expiresAt:"2026-11-24T12:00:00.000Z"};
  assert.equal(isUsableManualResellerInvitation(invite,user,manualProfile,"2026-11-24T11:59:59.000Z"),true);
  assert.equal(isUsableManualResellerInvitation(invite,user,manualProfile,"2026-11-24T12:00:00.000Z"),false);
  assert.equal(isUsableManualResellerInvitation({...invite,usedAt:"2026-11-23T13:00:00Z"},user,manualProfile,"2026-11-23T14:00:00Z"),false);
  assert.equal(isUsableManualResellerInvitation(invite,{...user,status:"inactive"},manualProfile,"2026-11-23T14:00:00Z"),false);
});

test("activation validates single-use token shape and matching strong passwords", () => {
  assert.deepEqual(validateManualResellerActivation({token,password:"senha-segura-123",confirm:"senha-segura-123"}),{value:{token,password:"senha-segura-123"}});
  for (const fields of [
    {token:"invalido",password:"senha-segura-123",confirm:"senha-segura-123"},
    {token,password:"123",confirm:"123"},
    {token,password:"senha-segura-123",confirm:"outra-senha-123"},
  ]) assert.ok(validateManualResellerActivation(fields).error);
});
