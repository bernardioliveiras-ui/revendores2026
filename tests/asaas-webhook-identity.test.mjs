import test from "node:test";
import assert from "node:assert/strict";
import { fixtureDb, loadNative, operators, table } from "./native-runtime-loader.mjs";

const schema = {
  purchases:table("id","asaasPaymentId","asaasInstallmentId","paymentStatus","asaasCustomerId","userId","shippingStatus","kit","installments","installmentValueCents","totalCents"),
  asaasEvents:table("eventId","paymentId","eventType"),
  indicatorCampaigns:table("id"),stockMovements:table("id","userId","referenceId","type","referenceType"),users:table("id"),
};
const original = {id:"order1",asaasPaymentId:"pay1",asaasInstallmentId:null,asaasCustomerId:null,
  paymentStatus:"payment_pending",shippingStatus:"awaiting_payment",installments:1,totalCents:10990,
  installmentValueCents:10990,kit:"kit20",userId:null};

function setup(customerId) {
  const data=fixtureDb(schema,{purchases:[{...original,asaasCustomerId:customerId}]});
  let provisioned=0;
  const dependencies={
    "next/server":{after:()=>{}},"drizzle-orm":operators,"@/db":{getDb:()=>data.db},"@/db/schema":schema,
    "@/lib/purchase-fields":{operationalPurchaseFields:{}},
    "@/lib/auth":{safeHashEqual:(a,b)=>a===b},"@/lib/env":{getOptionalEnv:()=>"secret"},
    "@/lib/mysql-errors":{isMysqlDuplicateKeyError:()=>false},
    "@/lib/access-provisioning":{provisionPaidPurchase:async()=>{provisioned++}},
    "@/lib/purchase-measurement":{enqueueConfirmedPurchase:async()=>{},runPurchaseMeasurementQueue:async()=>{}},
    "@/lib/asaas":{getPayment:async()=>{throw Error("should not fetch")}},
    "@/lib/campaign-schema":{ensureCampaignSchema:async()=>{}},
    "@/lib/indicator-cashback.mjs":{calculateInfluencerCashback:()=>0},
  };
  const {handleBillingWebhook}=loadNative("lib/billing-webhook.ts",dependencies,["handleBillingWebhook"]);
  const request=()=>new Request("https://example.com/api/billing/revendedores/webhook",{method:"POST",headers:{"asaas-access-token":"secret","content-type":"application/json"},body:JSON.stringify({
    id:"evt-1",event:"PAYMENT_CONFIRMED",payment:{id:"pay1",customer:"cus-real",value:109.9,externalReference:"order1",status:"CONFIRMED"},
  })});
  return {...data,request,handleBillingWebhook,get provisioned(){return provisioned}};
}

test("a paid webhook refuses to provision when purchase has no saved Asaas customer",async()=>{
  const f=setup(null);
  const response=await f.handleBillingWebhook(f.request(),"revendedores");
  assert.equal(response.status,409);
  assert.equal(f.rows.purchases[0].paymentStatus,"payment_pending");
  assert.equal(f.rows.asaasEvents.length,0);
  assert.equal(f.provisioned,0);
});

test("a fully matching real Asaas payment provisions once; event replay stays idempotent",async()=>{
  const f=setup("cus-real");
  assert.equal((await f.handleBillingWebhook(f.request(),"revendedores")).status,200);
  assert.equal(f.rows.purchases[0].paymentStatus,"paid");
  assert.equal(f.rows.asaasEvents.length,1);
  assert.equal((await f.handleBillingWebhook(f.request(),"revendedores")).status,200);
  assert.equal(f.rows.asaasEvents.length,1);
});
