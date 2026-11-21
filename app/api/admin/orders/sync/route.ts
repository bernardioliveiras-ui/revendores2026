import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getPayment, getAsaasConfig, AsaasRequestError } from "@/lib/asaas";
import { getOptionalEnv } from "@/lib/env";
import { ensureCampaignSchema } from "@/lib/campaign-schema";
import { handleBillingWebhook } from "@/lib/billing-webhook";
import { beginReconciliationAudit, finishReconciliationAudit, type AuditAttempt, type AuditCode, type AuditEnvironment, type AuditOutcome, type ReconciliationAction } from "@/lib/asaas-reconciliation-audit";

export async function POST(request: Request) {
 let audit: AuditAttempt | null = null;
 let auditStartAttempted = false;
 let consultedEnvironment: AuditEnvironment | null = null;
 let providerConsulted = false;
 const respond = async (body: unknown, status: number, outcome: AuditOutcome, safeErrorCode: AuditCode | null = null) => {
  if (audit) {
   const currentAudit = audit;
   try {
    // A decisão somente sai da API depois que o resultado está no MySQL.
    await finishReconciliationAudit(currentAudit, { outcome, httpStatus: status, safeErrorCode, consultedEnvironment, providerConsulted });
    audit = null;
   } catch {
    // A confirmação pode já ter sido aplicada pelo webhook. Jamais fabricar rollback.
    // O registro "started" permanece pendente e identificável para conciliação.
    console.error("asaas_reconciliation_audit_finish_failed",{requestId:currentAudit.requestId,attemptId:currentAudit.attemptId});
    return Response.json({error:"Não foi possível registrar a auditoria. Confira o pedido antes de tentar novamente."},{status:503});
   }
  }
  return Response.json(body,{status});
 };
 try {
  const actor = await requireAdmin(request);
  const body = await request.json().catch(()=>null);
  const id = typeof body?.purchaseId === "string" ? body.purchaseId.trim() : "";
  const number = typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";
  if ((!id && !number) || id.length>120 || number.length>80) return Response.json({error:"Informe o número do pedido."},{status:400});
  await ensureCampaignSchema();
  const [purchase] = await getDb().select().from(purchases).where(id?eq(purchases.id,id):eq(purchases.orderNumber,number)).limit(1);
  const config = getAsaasConfig();
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
  const action: ReconciliationAction = pathname.endsWith("/api/admin/orders") ? "admin.orders.patch.legacy" : "admin.orders.sync";
  auditStartAttempted = true;
  audit = await beginReconciliationAudit({
   actorId:typeof actor?.id === "string" ? actor.id : null,
   purchaseId:purchase?.id || id || null,
   paymentId:purchase?.asaasPaymentId || null,
   configuredEnvironment:config.environment,
   endpointAction:action,
  });
  if (!purchase) return respond({error:"Pedido não encontrado neste banco."},404,"rejected","PURCHASE_NOT_FOUND");
  if (!purchase.asaasPaymentId) return respond({error:"Pedido sem ID de cobrança Asaas. Requer conferência do vínculo."},409,"rejected","PAYMENT_ID_MISSING");
  const token = getOptionalEnv("ASAAS_WEBHOOK_TOKEN");
  if (!token) return respond({error:"Configure ASAAS_WEBHOOK_TOKEN na aplicação."},503,"rejected","AUDIT_CONFIGURATION_MISSING");
  if (!config.configured) return respond({error:"Configure a conta Asaas para consultar os pagamentos."},503,"rejected","AUDIT_CONFIGURATION_MISSING");
  // The invoice URL is stored at checkout. When it identifies a different
  // Asaas environment from the configured account, reconciliation is unsafe.
  if (purchase.asaasInvoiceUrl) {
   let host = "";
   try { host = new URL(purchase.asaasInvoiceUrl).hostname.toLowerCase(); } catch { /* Legacy URL: payment ID and account remain authoritative. */ }
   const invoiceEnv = host === "sandbox.asaas.com" || host === "api-sandbox.asaas.com" ? "sandbox" :
    host === "www.asaas.com" || host === "asaas.com" || host === "api.asaas.com" ? "production" : null;
   if (invoiceEnv && invoiceEnv !== config.environment) return respond({error:"O ambiente Asaas desta cobrança diverge do pedido. Confira a conta vinculada."},409,"rejected","ENVIRONMENT_MISMATCH");
  }
  // Configuração congelada: o Asaas consultado é exatamente o ambiente auditado.
  consultedEnvironment = config.environment;
  providerConsulted = true;
  const payment = await getPayment(purchase.asaasPaymentId, config);
  if (payment.id !== purchase.asaasPaymentId || payment.externalReference !== purchase.id || !purchase.asaasCustomerId || payment.customer !== purchase.asaasCustomerId)
   return respond({error:"A cobrança retornada não corresponde ao pedido. Confira conta e ambiente Asaas."},409,"rejected","PAYMENT_MISMATCH");
  const installment = Boolean(purchase.asaasInstallmentId);
  if (installment ? (payment.installment !== purchase.asaasInstallmentId || !Number.isSafeInteger(purchase.installments) || purchase.installments < 2 ||
    !Number.isSafeInteger(purchase.installmentValueCents) || purchase.installmentValueCents < 1 || purchase.installmentValueCents * purchase.installments !== purchase.totalCents) : Boolean(payment.installment))
   return respond({error:"Parcelamento da cobrança diverge do pedido. Necessária conferência."},409,"rejected","INSTALLMENT_MISMATCH");
  const expectedCents = installment ? purchase.installmentValueCents : purchase.totalCents;
  if (!Number.isSafeInteger(expectedCents) || expectedCents < 1 || typeof payment.value !== "number" || !Number.isFinite(payment.value) || Math.round(payment.value*100) !== expectedCents)
   return respond({error:"Valor da cobrança diverge do pedido. Necessária conferência."},409,"rejected","PAYMENT_MISMATCH");
  if (payment.deleted || !["RECEIVED","CONFIRMED"].includes(payment.status || ""))
   return respond({updated:false,message:`Asaas: ${payment.status || "status indisponível"}. Pagamento não confirmado por esta consulta.`,asaasStatus:payment.status},200,"rejected",payment.deleted || ["CANCELLED","DELETED"].includes(payment.status || "") ? "PAYMENT_CANCELLED" : ["REFUNDED","CHARGEBACK_REQUESTED"].includes(payment.status || "") ? "PAYMENT_REFUNDED" : "PAYMENT_PENDING");
  if (purchase.paymentStatus === "cancelled") return respond({error:"Pedido local cancelado. Confira o histórico antes de alterar."},409,"rejected","ORDER_CANCELLED");
  const event = payment.status === "RECEIVED" ? "PAYMENT_RECEIVED" : "PAYMENT_CONFIRMED";
  const response = await handleBillingWebhook(new Request(request.url,{method:"POST",headers:{"content-type":"application/json","asaas-access-token":token},body:JSON.stringify({id:`reconcile:${payment.id}:${payment.status}`,event,payment})}));
  const result = await response.json();
  if (!response.ok) return respond(result,response.status,response.status>=500?"internal_error":"rejected",response.status>=500?"INTERNAL_ERROR":"RECONCILIATION_REJECTED");
  const [saved] = await getDb().select().from(purchases).where(eq(purchases.id,purchase.id)).limit(1);
  if (result.ignored || saved?.paymentStatus !== "paid" || !saved.asaasVerifiedAt) return respond({error:"Pagamento não aplicado. Confira o vínculo do pedido."},409,"rejected","RECONCILIATION_REJECTED");
  return respond({updated:true,orderNumber:saved.orderNumber,channel:saved.kit==="mix10-unit"?"influenciadores":"revendedores",message:saved.kit==="mix10-unit"&&!saved.campaignId?"Pagamento confirmado, mas o pedido não tem campanha vinculada. Confira a atribuição no BKO.":"Pagamento confirmado no Asaas e pedido atualizado. Atualize os painéis para consultar os totais."},200,"approved");
 } catch (error) {
  if(error instanceof Error && error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});
  if(error instanceof Error && error.message==="FORBIDDEN")return Response.json({error:"Acesso restrito ao administrador."},{status:403});
  if(error instanceof AsaasRequestError)return respond({error:"Não foi possível consultar a cobrança no Asaas. Confira chave, ambiente e ID da cobrança."},502,"provider_error","ASAAS_UNAVAILABLE");
  if(auditStartAttempted && !audit){
   console.error("asaas_reconciliation_audit_start_failed");
   return Response.json({error:"Não foi possível registrar a tentativa de conciliação. Tente novamente."},{status:503});
  }
  console.error("asaas_reconcile_failed",{category:"internal_error"});
  return respond({error:"Falha na sincronização. Tente novamente; se persistir, confira os logs da aplicação."},500,"internal_error","INTERNAL_ERROR");
 }
}
