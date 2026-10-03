import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
export async function GET(request: Request) {
  try {
    await ensureOperationalSchema();
    const user = await requireSession(request);
    if (user.role !== "reseller") return Response.json({ error: "Área do revendedor." }, { status: 403 });
    const rows = await getDb().select({ id: purchases.id, orderNumber: purchases.orderNumber, kit: purchases.kit, boxes: purchases.boxes, paymentStatus: purchases.paymentStatus, shippingStatus: purchases.shippingStatus, carrier: purchases.carrier, trackingCode: purchases.trackingCode, asaasInvoiceUrl: purchases.asaasInvoiceUrl, totalCents: purchases.totalCents, paymentMethod: purchases.paymentMethod, installments: purchases.installments, shippedAt: purchases.shippedAt, deliveredAt: purchases.deliveredAt, createdAt: purchases.createdAt }).from(purchases).where(eq(purchases.userId, user.id)).orderBy(desc(purchases.createdAt));
    return Response.json({ purchases: rows }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
    console.error("my_purchases_failed", error);
    return Response.json({ error: "Não foi possível carregar seus pedidos." }, { status: 500 });
  }
}
