import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { operationalPurchaseFields } from "@/lib/purchase-fields";
import { canAdvanceShipping } from "@/lib/delivery-progress";
import { sendOrderStatusEmail } from "@/lib/order-notification";

export async function updatePurchaseShipping(id: string, status: string, carrier?: unknown, trackingCode?: unknown) {
  const result = await getDb().transaction(async tx => {
    const [purchase] = await tx.select(operationalPurchaseFields).from(purchases).where(eq(purchases.id,id)).limit(1).for("update");
    if (!purchase) throw new Error("PURCHASE_NOT_FOUND");
    if (purchase.paymentStatus !== "paid") throw new Error("PAYMENT_REQUIRED");
    if (!canAdvanceShipping(purchase.shippingStatus,status)) return { updated:false, ignored:true };
    const now=new Date().toISOString();
    const clean=(value: unknown, fallback: string | null)=>typeof value==="string" ? value.trim().slice(0,120)||fallback : fallback;
    await tx.update(purchases).set({shippingStatus:status,carrier:clean(carrier,purchase.carrier),trackingCode:clean(trackingCode,purchase.trackingCode),shippedAt:status==="shipped" ? purchase.shippedAt||now : purchase.shippedAt,deliveredAt:status==="delivered" ? purchase.deliveredAt||now : purchase.deliveredAt,updatedAt:now}).where(eq(purchases.id,id));
    return {updated:true,ignored:false};
  });
  if (result.updated && ["shipped", "delivered"].includes(status)) {
    try { await sendOrderStatusEmail(id, status); } catch (error) { console.error("order_status_email_pending", error); }
  }
  return result;
}
