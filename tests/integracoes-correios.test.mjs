import test from "node:test";
import assert from "node:assert/strict";
import { load, table, operators, memoryDb } from "./runtime-loader.mjs";

const code = "AA123456789BR";
const { latestPostalEvent } = load("lib/correios.ts");
const posted = { dtHrCriado:"2026-11-14T15:10:11", descricao:"Objeto postado", codigo:"PO" };
const returned = { dtHrCriado:"2026-11-16T15:10:11", descricao:"Objeto entregue ao remetente", codigo:"BDE",tipo:"01" };
const delivered = { ...returned, descricao:"Objeto entregue ao destinatário" };

test("rastreio seleciona o objeto e o evento mais recente, sem confundir devolução com entrega", () => {
  const latest = events => latestPostalEvent([{codObjeto:code,eventos:events}],code);
  assert.equal(latest([posted]).stage,"shipped");
  assert.equal(latest([posted,returned]).stage,null);
  assert.equal(latest([posted,delivered]).stage,"delivered");
  assert.equal(latest([{...posted,descricao:"Pré-postagem"}]).stage,null);
  assert.equal(latestPostalEvent([{codObjeto:"BB123456789BR",eventos:[delivered]}],code),null);
  assert.equal(latest([{...posted,dtHrCriado:"inválida"}]),null);
});

test("consulta em andamento respeita troca de etiqueta, erro do provedor e entrega manual", async () => {
  const schema = { purchases:table("id") };
  const state = memoryDb(schema,{purchases:[{id:"p",paymentStatus:"paid",shippingStatus:"separating",trackingCode:code,carrier:"Correios"}]});
  const notifications = [];
  const { updatePurchaseShipping:update } = load("lib/shipping.ts",{
    "drizzle-orm":operators, "@/db":{getDb:()=>state.db}, "@/db/schema":schema,
    "@/lib/purchase-fields":{operationalPurchaseFields:{}}, "@/lib/delivery-progress":load("lib/delivery-progress.ts"),
    "@/lib/order-notification":{sendOrderStatusEmail:async (id,stage)=>notifications.push(stage)},
  });
  const observe=(event,issue)=>update("p","",undefined,undefined,{originalCode:code,originalCarrier:"Correios",event,issue,failed:issue?.startsWith("Correios HTTP")});
  const event={description:"Objeto em trânsito",stage:"shipped",at:"2026-11-15T15:10:11"};
  await observe(event);await observe(event);await observe({...event,description:"Objeto postado",at:"2026-11-14T15:10:11"});
  assert.equal(state.rows.purchases[0].postalEvent,"Objeto em trânsito");
  await observe(null,"Correios HTTP 503");
  assert.equal(state.rows.purchases[0].postalEvent,"Objeto em trânsito");
  assert.equal(state.rows.purchases[0].postalIssue,"Correios HTTP 503");
  await update("p","shipped","Correios","BB123456789BR");
  assert.equal(state.rows.purchases[0].postalEvent,null);
  assert.equal((await observe({...event,stage:"delivered"})).ignored,true);
  await update("p","delivered");
  assert.deepEqual(notifications,["shipped","delivered"]);
});

test("consulta sem evento registra horário, e falha posterior preserva última consulta bem-sucedida",async()=>{
  const schema={purchases:table("id")};
  const state=memoryDb(schema,{purchases:[{id:"p",paymentStatus:"paid",shippingStatus:"shipped",trackingCode:code,carrier:"Correios"}]});
  const {updatePurchaseShipping:update}=load("lib/shipping.ts",{
    "drizzle-orm":operators,"@/db":{getDb:()=>state.db},"@/db/schema":schema,
    "@/lib/purchase-fields":{operationalPurchaseFields:{}},"@/lib/delivery-progress":load("lib/delivery-progress.ts"),
    "@/lib/order-notification":{sendOrderStatusEmail:async()=>{}},
  });
  const original={originalCode:code,originalCarrier:"Correios"};
  await update("p","",undefined,undefined,{...original,event:null,issue:"Objeto sem evento disponível para este contrato.",failed:false});
  const row=state.rows.purchases[0];
  assert.ok(row.postalAttemptAt,"tentativa precisa ter data");
  assert.ok(row.postalCheckedAt,"resposta válida sem evento também conta como consulta");
  const successfulAt=row.postalCheckedAt;
  await update("p","",undefined,undefined,{...original,event:null,issue:"Correios HTTP 503",failed:true});
  assert.equal(row.postalCheckedAt,successfulAt,"erro não substitui a data da última consulta válida");
  assert.equal(row.postalIssue,"Correios HTTP 503");
});

test("agendador rejeita token ausente ou incorreto e sinaliza falha parcial",async t=>{
  const prev=process.env.CORREIOS_CRON_TOKEN;
  t.after(()=>{if(prev===undefined)delete process.env.CORREIOS_CRON_TOKEN;else process.env.CORREIOS_CRON_TOKEN=prev;});
  let calls=0;const {POST}=load("app/api/internal/correios/sync/route.ts",{
    "@/lib/auth":{safeHashEqual:(a,b)=>a===b},"@/lib/correios-sync":{runPostalSync:async()=>{calls++;return {errors:1};}},
  });
  const request=header=>new Request("https://test.example",{method:"POST", headers:{authorization:header}});
  delete process.env.CORREIOS_CRON_TOKEN;
  assert.equal((await POST(request(""))).status,401);
  process.env.CORREIOS_CRON_TOKEN="a".repeat(40);
  assert.equal((await POST(request("Bearer wrong"))).status,401);assert.equal(calls,0);
  assert.equal((await POST(request("Bearer "+"a".repeat(40)))).status,502);assert.equal(calls,1);
});

test("sincronização manual dos Correios exige BKO autenticado e informa resumo sem segredos",async()=>{
  let calls=0;
  const {POST}=load("app/api/admin/shipping/sync/route.ts",{
    "@/lib/auth":{requireAdmin:async request=>{if(request.headers.get("x-test-auth")==="no")throw Error("UNAUTHORIZED");if(request.headers.get("x-test-auth")==="reseller")throw Error("FORBIDDEN");}},
    "@/lib/correios-sync":{runPostalSync:async()=>{calls++;return {busy:false,selected:3,verified:2,waiting:1,errors:0,skipped:0};}},
  });
  const request=auth=>new Request("https://test.example/api/admin/shipping/sync",{method:"POST",headers:{"x-test-auth":auth}});
  assert.equal((await POST(request("no"))).status,401);
  assert.equal((await POST(request("reseller"))).status,403);
  assert.equal(calls,0,"acesso não autorizado nunca pode disparar o Correios");
  const ok=await POST(request("admin"));
  assert.equal(ok.status,200);
  assert.deepEqual(await ok.json(),{busy:false,selected:3,verified:2,waiting:1,errors:0,skipped:0});
  assert.equal(calls,1);
});

test("sincronização manual diferencia serviço indisponível de lote com erros",async()=>{
  let fail=false;
  const {POST}=load("app/api/admin/shipping/sync/route.ts",{
    "@/lib/auth":{requireAdmin:async()=>{}},
    "@/lib/correios-sync":{runPostalSync:async()=>{if(fail)throw Error("CORREIOS_CODIGO_ACESSO=segredo");return {busy:false,selected:1,verified:0,waiting:0,errors:1,skipped:0};}},
  });
  const req=()=>new Request("https://test.example",{method:"POST"});
  assert.equal((await POST(req())).status,502);
  fail=true;
  const err=await POST(req());
  assert.equal(err.status,503);
  assert.doesNotMatch(JSON.stringify(await err.json()),/segredo/);
});

test("diagnóstico Asaas usa operações de leitura e identifica fila interrompida em produção", async t=>{
  const cfg={ASAAS_ENVIRONMENT:"production",ASAAS_API_KEY:"fixture",ASAAS_WEBHOOK_TOKEN:"fixture"};
  const {inspectAsaasConnection}=load("lib/asaas.ts",{"@/lib/env":{getOptionalEnv:k=>cfg[k]}});
  const seen=[];const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
  globalThis.fetch=async (url,options)=>{
    assert.equal(options.method||"GET","GET");assert.equal(new URL(url).hostname,"api.asaas.com");seen.push(url);
    if(url.includes("/payments?"))return Response.json({data:[]});
    return Response.json({data:[{url:"https://app.test/api/billing/revendedores/webhook",enabled:true,interrupted:true,events:[]}],hasMore:false});
  };
  const result=await inspectAsaasConnection("https://app.test");
  assert.equal(result.environment,"production");assert.equal(seen.length,2);
  assert.match(result.revendedores,/interrompida/);assert.match(result.influenciadores,/não encontrada/);
});
