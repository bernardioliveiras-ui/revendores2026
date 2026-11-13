import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getPayment, AsaasRequestError } from "@/lib/asaas";
import { getOptionalEnv } from "@/lib/env";
import { ensureCampaignSchema } from "@/lib/campaign-schema";
import { handleBillingWebhook } from "@/lib/billing-webhook";

export async function POST(request: Request) {
 try {
  await requireAdmin(request);
  const body = await request.json().catch(()=>null);
  const id = typeof body?.purchaseId === "string" ? body.purchaseId.trim() : "";
  const number = typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";
  if ((!id && !number) || id.length>120 || number.length>80) return Response.json({error:"Informe o número do pedido."},{status:400});
  await ensureCampaignSchema();
  const [purchase] = await getDb().select().from(purchases).where(id?eq(purchases.id,id):eq(purchases.orderNumber,number)).limit(1);
  if (!purchase) return Response.json({error:"Pedido não encontrado neste banco."},{status:404});
  if (!purchase.asaasPaymentId) return Response.json({error:"Pedido sem ID de cobrança Asaas. Requer conferência do vínculo."},{status:409});
  const token = getOptionalEnv("ASAAS_WEBHOOK_TOKEN");
  if (!token) return Response.json({error:"Configure ASAAS_WEBHOOK_TOKEN na aplicação."},{status:503});
  const payment = await getPayment(purchase.asaasPaymentId);
  if (payment.id !== purchase.asaasPaymentId || (payment.externalReference && payment.externalReference !== purchase.id) || (purchase.asaasCustomerId && payment.customer !== purchase.asaasCustomerId))
   return Response.json({error:"A cobrança retornada não corresponde ao pedido. Confira conta e ambiente Asaas."},{status:409});
  if (!purchase.asaasInstallmentId && (typeof payment.value !== "number" || Math.abs(Math.round(payment.value*100)-purchase.totalCents)>1))
   return Response.json({error:"Valor da cobrança diverge do pedido. Necessária conferência."},{status:409});
  if (payment.deleted || !["RECEIVED","CONFIRMED"].includes(payment.status || ""))
   return Response.json({updated:false,message:`Asaas: ${payment.status || "status indisponível"}. Pagamento não confirmado por esta consulta.`,asaasStatus:payment.status});
  if (purchase.paymentStatus === "cancelled") return Response.json({error:"Pedido local cancelado. Confira o histórico antes de alterar."},{status:409});
  const event = payment.status === "RECEIVED" ? "PAYMENT_RECEIVED" : "PAYMENT_CONFIRMED";
  const response = await handleBillingWebhook(new Request(request.url,{method:"POST",headers:{"content-type":"application/json","asaas-access-token":token},body:JSON.stringify({id:`reconcile:${payment.id}:${payment.status}`,event,payment})}));
  const result = await response.json();
  if (!response.ok) return Response.json(result,{status:response.status});
  const [saved] = await getDb().select().from(purchases).where(eq(purchases.id,purchase.id)).limit(1);
  if (result.ignored || saved?.paymentStatus !== "paid" || !saved.asaasVerifiedAt) return Response.json({error:"Pagamento não aplicado. Confira o vínculo do pedido."},{status:409});
  return Response.json({updated:true,orderNumber:saved.orderNumber,channel:saved.kit==="mix10-unit"?"influenciadores":"revendedores",message:saved.kit==="mix10-unit"&&!saved.campaignId?"Pagamento confirmado, mas o pedido não tem campanha vinculada. Confira a atribuição no BKO.":"Pagamento confirmado no Asaas e pedido atualizado. Atualize os painéis para consultar os totais."});
 } catch (error) {
  if(error instanceof Error && error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});
  if(error instanceof Error && error.message==="FORBIDDEN")return Response.json({error:"Acesso restrito ao administrador."},{status:403});
  if(error instanceof AsaasRequestError)return Response.json({error:"Não foi possível consultar a cobrança no Asaas. Confira chave, ambiente e ID da cobrança."},{status:502});
  console.error("asaas_reconcile_failed",error);
  return Response.json({error:"Falha na sincronização. Tente novamente; se persistir, confira os logs da aplicação."},{status:500});
 }
}
