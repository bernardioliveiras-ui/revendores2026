import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { orders, resellerMovements } from "@/db/schema";
import { apiErrorResponse, requireOrganization } from "@/lib/current-user";
import { summarizeInventory } from "@/lib/inventory";

function clean(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET(request: Request) {
  try {
    const { membership } = await requireOrganization(request);
    const db = getDb();
    const [movements, organizationOrders] = await Promise.all([
      db
        .select()
        .from(resellerMovements)
        .where(eq(resellerMovements.organizationId, membership.organization.id))
        .orderBy(desc(resellerMovements.occurredAt)),
      db
        .select({
          boxes: orders.boxes,
          status: orders.status,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(eq(orders.organizationId, membership.organization.id)),
    ]);
    return Response.json({
      movements,
      summary: summarizeInventory(movements, organizationOrders),
    });
  } catch (error) {
    return apiErrorResponse(error, "Não foi possível carregar as movimentações.");
  }
}

export async function POST(request: Request) {
  try {
    const { user, membership } = await requireOrganization(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const type =
      payload.type === "return"
        ? "return"
        : payload.type === "adjustment_in"
          ? "adjustment_in"
          : payload.type === "adjustment_out"
            ? "adjustment_out"
            : "sale";
    if (
      (type === "adjustment_in" || type === "adjustment_out") &&
      membership.role === "seller"
    ) {
      return Response.json(
        { error: "Ajustes de estoque exigem acesso de gerente." },
        { status: 403 },
      );
    }
    const boxes = Math.max(1, Math.min(9999, Math.floor(Number(payload.boxes) || 0)));
    const unitValueCents = Math.max(
      0,
      Math.round(Number(payload.unitValue) * 100) || 0,
    );
    const channel = ["whatsapp", "instagram", "store", "referral"].includes(
      String(payload.channel),
    )
      ? (String(payload.channel) as "whatsapp" | "instagram" | "store" | "referral")
      : "other";
    const occurredAt = /^\d{4}-\d{2}-\d{2}$/.test(String(payload.occurredAt))
      ? String(payload.occurredAt)
      : new Date().toISOString().slice(0, 10);
    const db = getDb();
    const [existingMovements, organizationOrders] = await Promise.all([
      db
        .select()
        .from(resellerMovements)
        .where(eq(resellerMovements.organizationId, membership.organization.id)),
      db
        .select({
          boxes: orders.boxes,
          status: orders.status,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(eq(orders.organizationId, membership.organization.id)),
    ]);
    const current = summarizeInventory(existingMovements, organizationOrders);
    if ((type === "sale" || type === "adjustment_out") && boxes > current.stock) {
      return Response.json(
        { error: `Estoque insuficiente. Saldo atual: ${current.stock} caixa(s).` },
        { status: 409 },
      );
    }
    if (type === "return" && boxes > current.sold - current.returned) {
      return Response.json(
        { error: "A devolução não pode ser maior que as vendas registradas." },
        { status: 409 },
      );
    }
    const movement: typeof resellerMovements.$inferInsert = {
      id: `mov_${crypto.randomUUID()}`,
      organizationId: membership.organization.id,
      recordedBy: user.id,
      type,
      boxes,
      unitValueCents,
      totalValueCents: boxes * unitValueCents,
      channel,
      reference: clean(payload.reference, 100),
      notes: clean(payload.notes, 500),
      occurredAt,
      createdAt: new Date().toISOString(),
    };
    await db.insert(resellerMovements).values(movement);
    return Response.json({ movement });
  } catch (error) {
    console.error("movement_creation_failed", error);
    return apiErrorResponse(error, "Não foi possível registrar a movimentação.");
  }
}
