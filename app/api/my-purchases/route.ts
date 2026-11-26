import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { manualShipments, purchases } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
export async function GET(request: Request) {
  try {
    const user = await requireSession(request);
    if (user.role !== "reseller") return Response.json({ error: "Área do revendedor." }, { status: 403 });
    await ensureOperationalSchema();
    const [rows,manualRows] = await Promise.all([
      getDb().select({ id: purchases.id, orderNumber: purchases.orderNumber, kit: purchases.kit, boxes: purchases.boxes, paymentStatus: purchases.paymentStatus, shippingStatus: purchases.shippingStatus, carrier: purchases.carrier, postalEvent: purchases.postalEvent, postalEventAt: purchases.postalEventAt, postalAttemptAt: purchases.postalAttemptAt, postalCheckedAt: purchases.postalCheckedAt, postalIssue: purchases.postalIssue, trackingCode: purchases.trackingCode, asaasInvoiceUrl: purchases.asaasInvoiceUrl, totalCents: purchases.totalCents, paymentMethod: purchases.paymentMethod, installments: purchases.installments, shippedAt: purchases.shippedAt, deliveredAt: purchases.deliveredAt, createdAt: purchases.createdAt, updatedAt: purchases.updatedAt }).from(purchases).where(eq(purchases.userId, user.id)).orderBy(desc(purchases.createdAt)),
      getDb().select().from(manualShipments).where(eq(manualShipments.userId,user.id)).orderBy(desc(manualShipments.createdAt)),
    ]);
    const manual = manualRows.map(s=>({...s,source:"manual",kit:"remessa manual",paymentStatus:"paid",totalCents:0,asaasInvoiceUrl:null}));
    return Response.json({ purchases: [...rows,...manual].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
    console.error("my_purchases_failed", error);
    return Response.json({ error: "Não foi possível carregar seus pedidos." }, { status: 500 });
  }
}
