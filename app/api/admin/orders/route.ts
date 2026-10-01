import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { orderEvents, orders, organizations, users } from "@/db/schema";
import { apiErrorResponse, getCurrentUser } from "@/lib/current-user";
import { requestShippingAutomation } from "@/lib/shipping";

const ALLOWED = new Set([
  "payment_pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "payment_error",
]);

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (user.systemRole !== "admin") {
      return Response.json({ error: "Acesso restrito." }, { status: 403 });
    }
    const payload = (await request.json()) as {
      orderId?: unknown;
      status?: unknown;
      trackingCode?: unknown;
      carrier?: unknown;
    };
    const orderId = typeof payload.orderId === "string" ? payload.orderId : "";
    const status = typeof payload.status === "string" ? payload.status : "";
    const trackingProvided = typeof payload.trackingCode === "string";
    const carrierProvided = typeof payload.carrier === "string";
    const trackingCode = trackingProvided ? (payload.trackingCode as string).trim().slice(0, 100) : "";
    const carrier = carrierProvided ? (payload.carrier as string).trim().slice(0, 120) : "";
    if (!orderId || !ALLOWED.has(status)) {
      return Response.json({ error: "Alteração inválida." }, { status: 400 });
    }
    const typedStatus = status as typeof orders.$inferInsert.status;
    const now = new Date().toISOString();
    const update = {
      status: typedStatus,
      updatedAt: now,
      ...(carrierProvided ? { carrier: carrier || null } : {}),
      ...(trackingProvided ? { trackingCode: trackingCode || null } : {}),
      ...(typedStatus === "shipped" ? { shippedAt: now } : {}),
    };
    await getDb()
      .update(orders)
      .set(update)
      .where(eq(orders.id, orderId));
    await getDb().insert(orderEvents).values({
      orderId,
      status,
      message: `Status alterado manualmente para ${status}.`,
      actorId: user.id,
      createdAt: now,
    });
    if (typedStatus === "paid") {
      const [shippingOrder] = await getDb()
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          boxes: orders.boxes,
          totalCents: orders.totalCents,
          shippingPostalCode: orders.shippingPostalCode,
          shippingStreet: orders.shippingStreet,
          shippingNumber: orders.shippingNumber,
          shippingComplement: orders.shippingComplement,
          shippingDistrict: orders.shippingDistrict,
          shippingCity: orders.shippingCity,
          shippingState: orders.shippingState,
          organizationName: organizations.tradeName,
          recipientName: users.name,
          recipientEmail: users.email,
          recipientPhone: organizations.phone,
        })
        .from(orders)
        .innerJoin(organizations, eq(organizations.id, orders.organizationId))
        .innerJoin(users, eq(users.id, orders.createdBy))
        .where(eq(orders.id, orderId))
        .limit(1);
      if (shippingOrder) {
        await requestShippingAutomation(
          shippingOrder,
          new URL(request.url).origin,
        ).catch((shippingError) => {
          console.error("manual_shipping_automation_failed", shippingError);
        });
      }
    }
    return Response.json({ updated: true });
  } catch (error) {
    return apiErrorResponse(error, "Não foi possível alterar o pedido.");
  }
}
