import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { asaasEvents, purchases } from "@/db/schema";
import { safeHashEqual } from "@/lib/auth";
import { getOptionalEnv } from "@/lib/env";
import { isMysqlDuplicateKeyError } from "@/lib/mysql-errors";
import { provisionPaidPurchase } from "@/lib/access-provisioning";
import { sendWelcome } from "@/lib/welcome-notification";

function purchaseStatus(event: string) {
  if (["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(event)) return "paid";
  if (["PAYMENT_REFUNDED", "PAYMENT_DELETED", "PAYMENT_CHARGEBACK_REQUESTED"].includes(event)) return "cancelled";
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
    // Persist the event and payment change atomically. Different Asaas event IDs
    // for the same purchase serialize on the purchase row, including reversals.
    const result=await getDb().transaction(async tx=>{
      const [purchase]=await tx.select().from(purchases).where(eq(purchases.asaasPaymentId,paymentId)).limit(1).for("update");
      if(!purchase) {
        const externalReference=typeof body?.payment?.externalReference==="string" ? body.payment.externalReference.trim() : "";
        if(externalReference){
          const [local]=await tx.select().from(purchases).where(eq(purchases.id,externalReference)).limit(1);
          if(!local)return {id:"",paid:false,duplicate:false,ignored:true};
        }
        throw new Error("PURCHASE_NOT_READY");
      }
      const [known]=await tx.select().from(asaasEvents).where(eq(asaasEvents.eventId,eventId)).limit(1);
      if(known && (known.paymentId!==paymentId || known.eventType!==eventType)) throw new Error("EVENT_CONFLICT");
      if(known) return {id:purchase.id,paid:purchase.paymentStatus==="paid",duplicate:true};
      await tx.insert(asaasEvents).values({eventId,eventType,paymentId,receivedAt:new Date().toISOString()});
      if(status==="paid" && purchase.paymentStatus==="cancelled") return {id:purchase.id,paid:false,duplicate:false};
      await tx.update(purchases).set({paymentStatus:status,shippingStatus:status==="paid" ? (purchase.shippingStatus==="awaiting_payment" ? "separating" : purchase.shippingStatus) : (purchase.accessReleasedAt ? purchase.shippingStatus : "cancelled"),updatedAt:new Date().toISOString()}).where(eq(purchases.id,purchase.id));
      return {id:purchase.id,paid:status==="paid",duplicate:false};
    });
    // A retry repairs a failed provisioning/notification even if the payment
    // event has already committed. Both operations are individually idempotent.
    if(result.paid){await provisionPaidPurchase(result.id);await sendWelcome(result.id);}
    return Response.json({received:true,duplicate:result.duplicate,ignored:result.ignored || false});
  } catch(error) {
    if(error instanceof Error && error.message==="EVENT_CONFLICT") return Response.json({error:"Evento divergente."},{status:409});
    if(error instanceof Error && error.message==="PURCHASE_NOT_READY") return Response.json({error:"Pedido ainda não localizado. Reenviar evento."},{status:503,headers:{"Retry-After":"10"}});
    // Another transaction may have claimed the event ID: ask Asaas to retry,
    // so the next request checks the persisted identity and completes the work.
    if(isMysqlDuplicateKeyError(error)) return Response.json({error:"Evento em processamento. Reenviar."},{status:503});
    console.error("asaas_webhook_failed",error);
    return Response.json({error:"Não foi possível concluir o evento. Reenviar."},{status:500});
  }
}
