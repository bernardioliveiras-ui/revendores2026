import { getOptionalEnv } from "@/lib/env";
import { eq, or } from "drizzle-orm";

import { getDb } from "@/db";
import { orderEvents, orders, shipments } from "@/db/schema";
import { safeHashEqual } from "@/lib/auth";

const STATUSES = new Set([
  "pending_quote",
  "processing",
  "ready_to_ship",
  "in_transit",
  "delivered",
  "exception",
  "cancelled",
]);

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const expected = getOptionalEnv("SHIPPING_WEBHOOK_TOKEN");
  const received = request.headers.get("x-shipping-token") ?? "";
  if (!expected || !safeHashEqual(expected, received)) {
    return Response.json({ error: "Webhook não autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const orderId = clean(payload.orderId, 120);
    const providerShipmentId = clean(payload.shipmentId, 160);
    const status = clean(payload.status, 40);
    if ((!orderId && !providerShipmentId) || !STATUSES.has(status)) {
      return Response.json({ error: "Evento logístico inválido." }, { status: 400 });
    }

    const db = getDb();
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(
        or(
          orderId ? eq(shipments.orderId, orderId) : undefined,
          providerShipmentId
            ? eq(shipments.providerShipmentId, providerShipmentId)
            : undefined,
        ),
      )
      .limit(1);
    if (!shipment) {
      return Response.json({ error: "Envio não encontrado." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const trackingCode = clean(payload.trackingCode, 100);
    await db
      .update(shipments)
      .set({
        provider: clean(payload.provider, 80) || shipment.provider,
        service: clean(payload.service, 120) || shipment.service,
        providerShipmentId: providerShipmentId || shipment.providerShipmentId,
        status: status as typeof shipments.$inferInsert.status,
        quoteCents: Math.max(
          0,
          Math.floor(Number(payload.quoteCents) || shipment.quoteCents),
        ),
        trackingCode: trackingCode || shipment.trackingCode,
        trackingUrl: clean(payload.trackingUrl) || shipment.trackingUrl,
        labelUrl: clean(payload.labelUrl) || shipment.labelUrl,
        errorMessage: clean(payload.error) || "",
        updatedAt: now,
      })
      .where(eq(shipments.id, shipment.id));

    const orderStatus =
      status === "delivered"
        ? "delivered"
        : status === "in_transit"
          ? "shipped"
          : status === "processing" || status === "ready_to_ship"
            ? "processing"
            : null;
    if (orderStatus) {
      const [order] = await db
        .select({ status: orders.status })
        .from(orders)
        .where(eq(orders.id, shipment.orderId))
        .limit(1);
      if (order && order.status !== orderStatus) {
        await db
          .update(orders)
          .set({
            status: orderStatus,
            trackingCode: trackingCode || shipment.trackingCode,
            updatedAt: now,
          })
          .where(eq(orders.id, shipment.orderId));
        await db.insert(orderEvents).values({
          orderId: shipment.orderId,
          status: orderStatus,
          message:
            orderStatus === "delivered"
              ? "Entrega confirmada pela integração logística; estoque atualizado."
              : orderStatus === "shipped"
                ? "Pedido coletado e em transporte."
                : "Envio em preparação pela integração logística.",
          createdAt: now,
        });
      }
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error("shipping_webhook_failed", error);
    return Response.json(
      { error: "Não foi possível registrar o evento logístico." },
      { status: 500 },
    );
  }
}
