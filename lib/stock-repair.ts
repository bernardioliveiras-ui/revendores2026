import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases, stockMovements } from "@/db/schema";

/** Repairs one missing stock entry for every paid purchase linked to the reseller. */
export async function repairPaidPurchaseStockForUser(userId: string) {
  const db = getDb();
  const rows = await db.select({ id: purchases.id, boxes: purchases.boxes, kit: purchases.kit, welcomeStatus: purchases.welcomeStatus })
    .from(purchases).where(and(eq(purchases.userId, userId), eq(purchases.paymentStatus, "paid")));

  for (const purchase of rows) {
    await db.transaction(async (tx) => {
      const [locked] = await tx.select({ id: purchases.id, boxes: purchases.boxes, kit: purchases.kit, userId: purchases.userId, paymentStatus: purchases.paymentStatus, welcomeStatus: purchases.welcomeStatus })
        .from(purchases).where(eq(purchases.id, purchase.id)).limit(1).for("update");
      if (!locked || locked.paymentStatus !== "paid" || locked.userId !== userId) return;
      const [existing] = await tx.select({ id: stockMovements.id }).from(stockMovements)
        .where(and(eq(stockMovements.userId, userId), eq(stockMovements.referenceId, locked.id))).limit(1);
      if (existing) return;
      const now = new Date().toISOString();
      const replenishment = locked.welcomeStatus === "not_required";
      await tx.insert(stockMovements).values({
        id: crypto.randomUUID(), userId, type: "entry", boxes: locked.boxes,
        referenceType: replenishment ? "replenishment_purchase" : "initial_purchase", referenceId: locked.id,
        notes: replenishment ? `Reposição reparada · ${locked.kit.toUpperCase()}` : `Estoque reparado · ${locked.kit.toUpperCase()}`,
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
