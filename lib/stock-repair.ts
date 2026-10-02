import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases, stockMovements } from "@/db/schema";

/**
 * Repairs missing stock entries for already-paid purchases.
 * Older deployments could provision an access while the stock movement failed
 * or while the operational tables were still being migrated. The purchase row
 * is the durable source of truth, so each paid purchase contributes exactly one
 * initial_purchase movement.
 */
export async function repairPaidPurchaseStockForUser(userId: string) {
  const db = getDb();
  const rows = await db.select({ id: purchases.id, boxes: purchases.boxes, kit: purchases.kit })
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.paymentStatus, "paid")));

  for (const purchase of rows) {
    await db.transaction(async (tx) => {
      const [locked] = await tx.select({ id: purchases.id, boxes: purchases.boxes, kit: purchases.kit, userId: purchases.userId, paymentStatus: purchases.paymentStatus })
        .from(purchases).where(eq(purchases.id, purchase.id)).limit(1).for("update");
      if (!locked || locked.paymentStatus !== "paid" || locked.userId !== userId) return;
      const [existing] = await tx.select({ id: stockMovements.id }).from(stockMovements)
        .where(and(
          eq(stockMovements.userId, userId),
          eq(stockMovements.referenceType, "initial_purchase"),
          eq(stockMovements.referenceId, locked.id),
        )).limit(1);
      if (existing) return;
      const now = new Date().toISOString();
      await tx.insert(stockMovements).values({
        id: crypto.randomUUID(), userId, type: "entry", boxes: locked.boxes,
        referenceType: "initial_purchase", referenceId: locked.id,
        notes: `Estoque reparado · ${locked.kit.toUpperCase()}`,
        occurredAt: now, createdAt: now,
      });
    });
  }
}

export async function repairPaidPurchaseStockForAllResellers() {
  const rows = await getDb().select({ userId: purchases.userId }).from(purchases).where(eq(purchases.paymentStatus, "paid"));
  const userIds = [...new Set(rows.map((row) => row.userId).filter((id): id is string => Boolean(id)))];
  for (const userId of userIds) await repairPaidPurchaseStockForUser(userId);
}
