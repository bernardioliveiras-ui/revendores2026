import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { affiliateCashbacks, affiliateReferrals, asaasEvents, purchases } from "@/db/schema";
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
    eventId = payload.id?.trim() || ""; const eventType = payload.event?.trim() || ""; const paymentId = payload.payment?.id?.trim() || "";
    if (!eventId || !eventType) return Response.json({ error: "Evento inválido." }, { status: 400 });
    const [known] = await db.select({ eventId: asaasEvents.eventId }).from(asaasEvents).where(eq(asaasEvents.eventId,eventId)).limit(1);
    if (known) return Response.json({ received:true, duplicate:true });
    try { await db.insert(asaasEvents).values({ eventId, eventType, paymentId:paymentId||null, receivedAt:new Date().toISOString() }); }
    catch (error) { if (isMysqlDuplicateKeyError(error)) return Response.json({ received:true, duplicate:true }); throw error; }
    if (!paymentId) return Response.json({ received:true, ignored:true });
    const status = purchaseStatus(eventType);
    if (!status) return Response.json({ received:true, ignored:true });
    const [purchase] = await db.select().from(purchases).where(eq(purchases.asaasPaymentId,paymentId)).limit(1);
    if (!purchase) return Response.json({ received:true, unmatched:true });
    const now = new Date().toISOString();
    if (status === "paid") {
      await db.update(purchases).set({ paymentStatus:"paid", shippingStatus: purchase.shippingStatus === "awaiting_payment" ? "separating" : purchase.shippingStatus, updatedAt:now }).where(eq(purchases.id,purchase.id));
      if (purchase.referralId) {
        const [referral] = await db.select({ userId: affiliateReferrals.userId }).from(affiliateReferrals).where(eq(affiliateReferrals.id, purchase.referralId)).limit(1);
        if (referral?.userId) await db.insert(affiliateCashbacks).values({ id: crypto.randomUUID(), referralId: purchase.referralId, resellerUserId: referral.userId, purchaseId: purchase.id, amountCents: 1500, status: "pending", qualifyingBoxes: 1, createdAt: now, updatedAt: now }).catch((error) => { if (!isMysqlDuplicateKeyError(error)) throw error; });
      }
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
