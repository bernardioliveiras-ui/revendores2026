import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sales, stockMovements, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { calculateStock } from "@/lib/stock";
import { repairPaidPurchaseStockForUser } from "@/lib/stock-repair";

import { ensureOperationalSchema } from "@/lib/runtime-schema";
function clean(value: unknown, max = 120) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export async function POST(request: Request) {
  try {
    await ensureOperationalSchema();
    await requireAdmin(request);
    const body = await request.json() as { userId?: unknown; boxes?: unknown; unitValue?: unknown; channel?: unknown; customerName?: unknown; notes?: unknown; soldAt?: unknown };
    const userId = clean(body.userId, 80);
    const boxes = Number(body.boxes);
    const unitValueCents = Math.round(Number(body.unitValue) * 100);
    if (!userId || !Number.isSafeInteger(boxes) || boxes <= 0 || boxes > 2147483647 || !Number.isSafeInteger(unitValueCents) || unitValueCents < 0 || boxes * unitValueCents > 2147483647) {
      return Response.json({ error: "Informe revendedor, quantidade e valor válidos." }, { status: 400 });
    }
    const db = getDb();
    const [reseller] = await db.select({ id: users.id, role: users.role, status: users.status }).from(users).where(eq(users.id, userId)).limit(1);
    if (!reseller || reseller.role !== "reseller" || reseller.status !== "active") return Response.json({ error: "Revendedor não encontrado ou inativo." }, { status: 404 });

    await repairPaidPurchaseStockForUser(userId);
    const saleId = crypto.randomUUID();
    const now = new Date().toISOString();
    const soldAt = clean(body.soldAt, 40) || now;
    let remainingStock = 0;
    await db.transaction(async (tx) => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1).for("update");
      const movements = await tx.select().from(stockMovements).where(eq(stockMovements.userId, userId));
      const stock = calculateStock(movements);
      if (stock < boxes) throw new Error("INSUFFICIENT_STOCK");
      remainingStock = stock - boxes;
      await tx.insert(sales).values({ id: saleId, userId, boxes, unitValueCents, totalValueCents: boxes * unitValueCents, channel: clean(body.channel, 40) || "bko", customerName: clean(body.customerName, 120), notes: clean(body.notes, 1000), soldAt, createdAt: now });
      await tx.insert(stockMovements).values({ id: crypto.randomUUID(), userId, type: "sale", boxes, referenceType: "sale", referenceId: saleId, notes: `Venda registrada pelo BKO · ${clean(body.channel, 40) || "other"}`, occurredAt: soldAt, createdAt: now });
    });
    return Response.json({ created: true, id: saleId, remainingStock });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return Response.json({ error: "Acesso restrito ao BKO." }, { status: 403 });
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") return Response.json({ error: "Estoque insuficiente para registrar esta venda." }, { status: 409 });
    console.error("admin_sale_create_failed", error);
    return Response.json({ error: "Não foi possível registrar a venda." }, { status: 500 });
  }
}
