import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { asaasEvents, purchases } from "@/db/schema";
import { safeHashEqual } from "@/lib/auth";
import { getOptionalEnv } from "@/lib/env";
import { isMysqlDuplicateKeyError } from "@/lib/mysql-errors";

type AsaasWebhook = { id?: string; event?: string; payment?: { id?: string; status?: string; externalReference?: string } };

function purchaseStatus(event: string) {
  if (["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(event)) return "paid";
  if (["PAYMENT_REFUNDED", "PAYMENT_DELETED", "PAYMENT_CHARGEBACK_REQUESTED"].includes(event)) return "cancelled";
  return null;
}

export async function POST(request: Request) {
  const expected = getOptionalEnv("ASAAS_WEBHOOK_TOKEN") || "";
  const received = request.headers.get("asaas-access-token") || "";
  if (!expected || !safeHashEqual(expected, received)) return Response.json({ error: "Webhook não autorizado." }, { status: 401 });
  const db = getDb(); let eventId = "";
  try {
    const payload = await request.json() as AsaasWebhook;
    eventId = payload.id?.trim() || "";
    const eventType = payload.event?.trim() || "";
    const paymentId = payload.payment?.id?.trim() || "";
    const externalReference = payload.payment?.externalReference?.trim() || "";
    if (!eventId || !eventType) return Response.json({ error: "Evento inválido." }, { status: 400 });
    const [known] = await db.select({ eventId: asaasEvents.eventId }).from(asaasEvents).where(eq(asaasEvents.eventId,eventId)).limit(1);
    if (known) return Response.json({ received:true, duplicate:true });
    try { await db.insert(asaasEvents).values({ eventId, eventType, paymentId:paymentId||null, receivedAt:new Date().toISOString() }); }
    catch (error) { if (isMysqlDuplicateKeyError(error)) return Response.json({ received:true, duplicate:true }); throw error; }
    const status = purchaseStatus(eventType);
    if (!status) return Response.json({ received:true, ignored:true });

    // Parcelamentos podem gerar IDs de cobrança distintos. O externalReference é o purchaseId
    // e é a chave mais estável; para cobranças avulsas mantemos fallback pelo paymentId.
    let purchase = null;
    if (externalReference) {
      [purchase] = await db.select().from(purchases).where(eq(purchases.id, externalReference)).limit(1);
    }
    if (!purchase && paymentId) {
      [purchase] = await db.select().from(purchases).where(eq(purchases.asaasPaymentId,paymentId)).limit(1);
    }
    if (!purchase) return Response.json({ received:true, unmatched:true });

    const now = new Date().toISOString();
    if (status === "paid") {
      await db.update(purchases).set({ paymentStatus:"paid", shippingStatus: purchase.shippingStatus === "awaiting_payment" ? "separating" : purchase.shippingStatus, updatedAt:now }).where(eq(purchases.id,purchase.id));
    } else {
      await db.update(purchases).set({ paymentStatus:"cancelled", shippingStatus: purchase.accessReleasedAt ? purchase.shippingStatus : "cancelled", updatedAt:now }).where(eq(purchases.id,purchase.id));
    }
    return Response.json({ received:true });
  } catch (error) {
    if (eventId) await db.delete(asaasEvents).where(eq(asaasEvents.eventId,eventId)).catch(()=>undefined);
    console.error("asaas_webhook_failed",error);
    return Response.json({ error:"Não foi possível registrar o evento." }, { status:500 });
  }
}
