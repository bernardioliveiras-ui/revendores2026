import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { operationalPurchaseFields } from "@/lib/purchase-fields";
import { canAdvanceShipping } from "@/lib/delivery-progress";
import { sendOrderStatusEmail } from "@/lib/order-notification";
import type { PostalEvent } from "@/lib/correios";

type Observation = { originalCode: string; originalCarrier: string | null; event: PostalEvent | null; issue?: string; failed?: boolean };
function clean(value: unknown, fallback: string | null) {
  return typeof value === "string" ? value.trim().slice(0,120) || fallback : fallback;
}

export async function updatePurchaseShipping(id: string, status: string, carrier?: unknown, trackingCode?: unknown, observation?: Observation) {
  const result = await getDb().transaction(async tx => {
    const [purchase] = await tx.select(operationalPurchaseFields).from(purchases).where(eq(purchases.id,id)).limit(1).for("update");
    if (!purchase) throw new Error("PURCHASE_NOT_FOUND");
    const ignored = { updated:false, ignored:true, notify:"" };
    if (observation && (purchase.trackingCode !== observation.originalCode || purchase.carrier !== observation.originalCarrier ||
        purchase.paymentStatus !== "paid" || !["separating","shipped"].includes(purchase.shippingStatus))) return ignored;
    if (purchase.paymentStatus !== "paid") throw new Error("PAYMENT_REQUIRED");
    const now = new Date().toISOString();
    const nextCarrier = clean(carrier, purchase.carrier);
    const nextCode = clean(trackingCode, purchase.trackingCode);
    const trackingChanged = nextCarrier !== purchase.carrier || nextCode !== purchase.trackingCode;
    const patch: Partial<typeof purchases.$inferInsert> = {};
    if (trackingChanged) Object.assign(patch, { postalEvent:null, postalEventAt:null, postalCheckedAt:null, postalAttemptAt:null, postalIssue:null });
    if (observation) {
      const event = observation.event;
      patch.postalAttemptAt = now;
      patch.postalIssue = observation.issue || null;
      if (!observation.failed) patch.postalCheckedAt = now;
      status = purchase.shippingStatus;
      if (event) {
        if (!purchase.postalEventAt || Date.parse(event.at) >= Date.parse(purchase.postalEventAt)) {
          patch.postalEvent = event.description;
          patch.postalEventAt = event.at;
          if (event.stage && canAdvanceShipping(status,event.stage)) status = event.stage;
        }
      }
    }
    if (!canAdvanceShipping(purchase.shippingStatus,status)) return ignored;
    const changedStage = purchase.shippingStatus !== status;
    if (changedStage || trackingChanged) {
      Object.assign(patch, { shippingStatus:status, carrier:nextCarrier, trackingCode:nextCode, updatedAt:now });
      if (status === "shipped" && !purchase.shippedAt) patch.shippedAt = now;
      if (status === "delivered" && !purchase.deliveredAt) patch.deliveredAt = now;
    }
    if (Object.keys(patch).length) await tx.update(purchases).set(patch).where(eq(purchases.id,id));
    return { updated:true, ignored:false, notify:changedStage ? status : "" };
  });
  if (result.notify === "shipped" || result.notify === "delivered") {
    try { await sendOrderStatusEmail(id, result.notify); } catch { console.error("order_status_email_pending"); }
  }
  return { updated:result.updated, ignored:result.ignored };
}
