import { after } from "next/server";
import { enqueueConfirmedPurchase, runPurchaseMeasurementQueue } from "@/lib/purchase-measurement";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { asaasEvents, indicatorCampaigns, purchases, stockMovements, users } from "@/db/schema";
import { operationalPurchaseFields } from "@/lib/purchase-fields";
import { safeHashEqual } from "@/lib/auth";
import { getOptionalEnv } from "@/lib/env";
import { isMysqlDuplicateKeyError } from "@/lib/mysql-errors";
import { provisionPaidPurchase } from "@/lib/access-provisioning";
import { getPayment } from "@/lib/asaas";
import { sendWelcome } from "@/lib/welcome-notification";
import { ensureCampaignSchema } from "@/lib/campaign-schema";
import { calculateInfluencerCashback } from "@/lib/indicator-cashback.mjs";

function purchaseStatus(event: string) {
  if (["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(event)) return "paid";
  if (["PAYMENT_REFUNDED", "PAYMENT_PARTIALLY_REFUNDED", "PAYMENT_DELETED", "PAYMENT_RECEIVED_IN_CASH_UNDONE", "PAYMENT_CHARGEBACK_REQUESTED"].includes(event)) return "cancelled";
  return null;
}
export async function POST(request: Request) {
  const expected = getOptionalEnv("ASAAS_WEBHOOK_TOKEN") || "";
  if (!expected || !safeHashEqual(expected, request.headers.get("asaas-access-token") || "")) return Response.json({error:"Webhook não autorizado."},{status:401});
  let body;
  try { body=await request.json(); } catch { return Response.json({error:"JSON inválido."},{status:400}); }
  const eventId=typeof body?.id === "string" ? body.id.trim() : "";
  const eventType=typeof body?.event === "string" ? body.event.trim() : "";
  const paymentId=typeof body?.payment?.id === "string" ? body.payment.id.trim() : "";
  if(!eventId || eventId.length>180 || !eventType || eventType.length>100 || !paymentId || paymentId.length>120) return Response.json({error:"Evento inválido."},{status:400});
  const status=purchaseStatus(eventType);
  if(!status) return Response.json({received:true,ignored:true});
  try {
    await ensureCampaignSchema();
    // Persist the event and payment change atomically. Different Asaas event IDs
    // for the same purchase serialize on the purchase row, including reversals.
    const result=await getDb().transaction(async tx=>{
      let [purchase]=await tx.select(operationalPurchaseFields).from(purchases).where(eq(purchases.asaasPaymentId,paymentId)).limit(1).for("update");
      const installmentId = typeof body?.payment?.installment === "string" ? body.payment.installment.trim() : "";
      if (!purchase && installmentId && installmentId.length <= 120) {
        [purchase] = await tx.select(operationalPurchaseFields).from(purchases).where(eq(purchases.asaasInstallmentId, installmentId)).limit(1).for("update");
      }
      if(!purchase) {
        const externalReference=typeof body?.payment?.externalReference==="string" ? body.payment.externalReference.trim() : "";
        if(externalReference){
          const [local]=await tx.select(operationalPurchaseFields).from(purchases).where(eq(purchases.id,externalReference)).limit(1);
          if(!local)return {id:"",paid:false,duplicate:false,ignored:true};
          // Older purchases may predate the stored installment ID. Confirm the
          // group against the original payment before accepting another parcel.
          if (installmentId && local.asaasPaymentId) {
            const original = await getPayment(local.asaasPaymentId);
            if (original.installment !== installmentId) throw new Error("PAYMENT_CONFLICT");
            [purchase] = await tx.select(operationalPurchaseFields).from(purchases).where(eq(purchases.id, local.id)).limit(1).for("update");
            await tx.update(purchases).set({asaasInstallmentId:installmentId}).where(eq(purchases.id,local.id));
          }
        }
        if (!purchase) throw new Error("PURCHASE_NOT_READY");
      }
      const [known]=await tx.select().from(asaasEvents).where(eq(asaasEvents.eventId,eventId)).limit(1);
      if(known && (known.paymentId!==paymentId || known.eventType!==eventType)) throw new Error("EVENT_CONFLICT");
      if(known) return {id:purchase.id,paid:purchase.paymentStatus==="paid",duplicate:true};
      await tx.insert(asaasEvents).values({eventId,eventType,paymentId,purchaseId:purchase.id,receivedAt:new Date().toISOString()});
      if(status==="paid" && purchase.paymentStatus==="cancelled") return {id:purchase.id,paid:false,duplicate:false};
      const physicallyDispatched = ["shipped", "delivered"].includes(purchase.shippingStatus);
      if (status === "cancelled" && purchase.userId && !physicallyDispatched) {
        await tx.select({id:users.id}).from(users).where(eq(users.id,purchase.userId)).limit(1).for("update");
        const [entry] = await tx.select().from(stockMovements).where(and(eq(stockMovements.userId,purchase.userId),eq(stockMovements.referenceId,purchase.id),eq(stockMovements.type,"entry"))).limit(1);
        const [reversal] = await tx.select().from(stockMovements).where(and(eq(stockMovements.userId,purchase.userId),eq(stockMovements.referenceId,purchase.id),eq(stockMovements.referenceType,"cancelled_purchase"))).limit(1);
        if (entry && !reversal) {
          const now = new Date().toISOString();
          await tx.insert(stockMovements).values({id:crypto.randomUUID(),userId:purchase.userId,type:"adjustment_out",boxes:entry.boxes,referenceType:"cancelled_purchase",referenceId:purchase.id,notes:"Compra cancelada antes da expedição",occurredAt:now,createdAt:now});
        }
      }
      let influencerCashback:number|null=null;
      if(status==="paid"&&purchase.paymentStatus!=="paid"){
        const [saved]=await tx.select({indicatorCashbackCents:purchases.indicatorCashbackCents,campaignId:purchases.campaignId,productTotalCents:purchases.productTotalCents,
          totalCents:purchases.totalCents,shippingCents:purchases.shippingCents,interestCents:purchases.interestCents})
          .from(purchases).where(eq(purchases.id,purchase.id)).limit(1);
        if(saved?.campaignId&&saved.indicatorCashbackCents===null){
          const [campaign]=await tx.select({cashbackMode:indicatorCampaigns.cashbackMode,cashbackValue:indicatorCampaigns.cashbackValue})
            .from(indicatorCampaigns).where(eq(indicatorCampaigns.id,saved.campaignId)).limit(1);
          if(campaign){const productCents=Math.max(0,saved.productTotalCents||(saved.totalCents-saved.shippingCents-saved.interestCents));
            influencerCashback=calculateInfluencerCashback(campaign,productCents);}
        }
      }
      await tx.update(purchases).set({... (influencerCashback===null?{}:{indicatorCashbackCents:influencerCashback}),paymentStatus:status,asaasVerifiedAt:status==="paid"?new Date().toISOString():null,shippingStatus:status==="paid" ? (purchase.shippingStatus==="awaiting_payment" ? "separating" : purchase.shippingStatus) : (physicallyDispatched ? purchase.shippingStatus : "cancelled"),updatedAt:new Date().toISOString()}).where(eq(purchases.id,purchase.id));
      return {id:purchase.id,paid:status==="paid",duplicate:false};
    });
    // A retry repairs a failed provisioning/notification even if the payment
    // event has already committed. Both operations are individually idempotent.
    if(result.paid){
      // Optional measurement is independent of access/notification failures.
      try {
        await enqueueConfirmedPurchase(result.id);
        after(async () => { try { await runPurchaseMeasurementQueue(2); } catch { console.error("purchase_measurement_worker_pending"); } });
      } catch { console.error("purchase_measurement_deferred"); }
      await provisionPaidPurchase(result.id);await sendWelcome(result.id);
    }
    return Response.json({received:true,duplicate:result.duplicate,ignored:result.ignored || false});
  } catch(error) {
    if(error instanceof Error && ["EVENT_CONFLICT","PAYMENT_CONFLICT"].includes(error.message)) return Response.json({error:"Evento divergente."},{status:409});
    if(error instanceof Error && error.message==="PURCHASE_NOT_READY") return Response.json({error:"Pedido ainda não localizado. Reenviar evento."},{status:503,headers:{"Retry-After":"10"}});
    // Another transaction may have claimed the event ID: ask Asaas to retry,
    // so the next request checks the persisted identity and completes the work.
    if(isMysqlDuplicateKeyError(error)) return Response.json({error:"Evento em processamento. Reenviar."},{status:503});
    console.error("asaas_webhook_failed",error);
    return Response.json({error:"Não foi possível concluir o evento. Reenviar."},{status:500});
  }
}
