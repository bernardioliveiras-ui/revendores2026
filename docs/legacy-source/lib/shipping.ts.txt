import { getOptionalEnv } from "@/lib/env";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { orders, shipments } from "@/db/schema";

export type ShippingOrder = Pick<
  typeof orders.$inferSelect,
  | "id"
  | "orderNumber"
  | "boxes"
  | "totalCents"
  | "shippingPostalCode"
  | "shippingStreet"
  | "shippingNumber"
  | "shippingComplement"
  | "shippingDistrict"
  | "shippingCity"
  | "shippingState"
> & {
  organizationName: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
};

type ShippingAutomationResult = {
  provider?: string;
  service?: string;
  shipmentId?: string;
  status?: string;
  quoteCents?: number;
  trackingCode?: string;
  trackingUrl?: string;
  labelUrl?: string;
  error?: string;
};

const ALLOWED_STATUSES = new Set([
  "pending_quote",
  "processing",
  "ready_to_ship",
  "in_transit",
  "delivered",
  "exception",
  "cancelled",
]);

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function shippingAutomationConfigured() {
  return Boolean(
    getOptionalEnv("SHIPPING_AUTOMATION_URL") &&
      getOptionalEnv("SHIPPING_AUTOMATION_TOKEN"),
  );
}

export async function requestShippingAutomation(
  order: ShippingOrder,
  callbackBaseUrl: string,
) {
  const db = getDb();
  await db
    .insert(shipments)
    .values({
      id: `shp_${crypto.randomUUID()}`,
      orderId: order.id,
      status: "pending_quote",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .onDuplicateKeyUpdate({ set: { updatedAt: new Date().toISOString() } });

  const automationUrl = getOptionalEnv("SHIPPING_AUTOMATION_URL");
  const automationToken = getOptionalEnv("SHIPPING_AUTOMATION_TOKEN");
  if (!automationUrl || !automationToken) {
    return { configured: false, queued: true };
  }

  let endpoint: URL;
  try {
    endpoint = new URL(automationUrl);
    if (endpoint.protocol !== "https:") throw new Error("HTTPS obrigatório");
  } catch {
    throw new Error("A URL da automação logística é inválida.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${automationToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      event: "order.paid",
      strategy: "best_cost_and_speed",
      callbackUrl: `${callbackBaseUrl.replace(/\/$/, "")}/api/shipping/webhook`,
      order: {
        id: order.id,
        number: order.orderNumber,
        organization: order.organizationName,
        boxes: order.boxes,
        totalCents: order.totalCents,
        recipient: {
          name: order.recipientName,
          email: order.recipientEmail,
          phone: order.recipientPhone,
        },
        destination: {
          postalCode: order.shippingPostalCode,
          street: order.shippingStreet,
          number: order.shippingNumber,
          complement: order.shippingComplement,
          district: order.shippingDistrict,
          city: order.shippingCity,
          state: order.shippingState,
        },
        parcel: {
          quantity: order.boxes,
          product: "MIX10 PRO",
        },
      },
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const result = (await response.json().catch(() => ({}))) as ShippingAutomationResult;
  if (!response.ok) {
    const message = text(result.error) || "A automação logística não respondeu.";
    await db
      .update(shipments)
      .set({
        status: "exception",
        errorMessage: message,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(shipments.orderId, order.id));
    throw new Error(message);
  }

  const status = ALLOWED_STATUSES.has(String(result.status))
    ? (String(result.status) as typeof shipments.$inferInsert.status)
    : "processing";
  const now = new Date().toISOString();
  await db
    .update(shipments)
    .set({
      provider: text(result.provider, 80) || "automation",
      service: text(result.service, 120),
      providerShipmentId: text(result.shipmentId, 160) || null,
      status,
      quoteCents: Math.max(0, Math.floor(Number(result.quoteCents) || 0)),
      trackingCode: text(result.trackingCode, 100) || null,
      trackingUrl: text(result.trackingUrl) || null,
      labelUrl: text(result.labelUrl) || null,
      errorMessage: "",
      updatedAt: now,
    })
    .where(eq(shipments.orderId, order.id));

  if (result.trackingCode) {
    await db
      .update(orders)
      .set({ trackingCode: text(result.trackingCode, 100), updatedAt: now })
      .where(eq(orders.id, order.id));
  }
  return { configured: true, queued: true, status };
}
