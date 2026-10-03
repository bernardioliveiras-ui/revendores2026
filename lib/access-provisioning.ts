import { and, eq } from "drizzle-orm";
import { isMysqlDuplicateKeyError } from "@/lib/mysql-errors";
import { getDb } from "@/db";
import { purchases, resellerProfiles, stockMovements, users } from "@/db/schema";
import { operationalPurchaseFields } from "@/lib/purchase-fields";
import { encryptTemporarySecret } from "@/lib/temporary-secret";
import { generateTemporaryPassword, hashPassword } from "@/lib/passwords";

// A row lock on the purchase makes Asaas retries, replenishments and manual release converge.
async function provisionAttempt(purchaseId: string) {
  const password = generateTemporaryPassword();
  const passwordHash = await hashPassword(password);
  return getDb().transaction(async tx => {
    const [p] = await tx.select(operationalPurchaseFields).from(purchases).where(eq(purchases.id, purchaseId)).limit(1).for("update");
    if (!p) throw new Error("PURCHASE_NOT_FOUND");
    if (p.paymentStatus !== "paid") throw new Error("PAYMENT_REQUIRED");
    const now = new Date().toISOString();

    const ensureStockEntry = async (userId: string) => {
      const [existingMovement] = await tx.select({ id: stockMovements.id }).from(stockMovements)
        .where(and(eq(stockMovements.userId, userId), eq(stockMovements.referenceId, p.id))).limit(1);
      if (existingMovement) return false;
      const replenishment = p.welcomeStatus === "not_required";
      await tx.insert(stockMovements).values({
        id: crypto.randomUUID(), userId, type: "entry", boxes: p.boxes,
        referenceType: replenishment ? "replenishment_purchase" : "initial_purchase",
        referenceId: p.id,
        notes: replenishment ? `Reposição ${p.kit.toUpperCase()}` : `Estoque inicial ${p.kit.toUpperCase()}`,
        occurredAt: now, createdAt: now,
      });
      return true;
    };

    if (p.userId) {
      await ensureStockEntry(p.userId);
      if (!p.accessReleasedAt) await tx.update(purchases).set({ accessReleasedAt: now, updatedAt: now }).where(eq(purchases.id, p.id));
      return { released: false, email: p.email, password: null, userId: p.userId, stockApplied: true };
    }

    const [existing] = await tx.select().from(users).where(eq(users.email, p.email)).limit(1);
    if (existing) {
      if (existing.role !== "reseller" || existing.status !== "active") throw new Error("EMAIL_ALREADY_EXISTS");
      await ensureStockEntry(existing.id);
      await tx.update(purchases).set({ userId: existing.id, accessReleasedAt: now, updatedAt: now }).where(eq(purchases.id, p.id));
      return { released: true, email: p.email, password: null, userId: existing.id, stockApplied: true };
    }

    const userId = crypto.randomUUID();
    await tx.insert(users).values({ id: userId, email: p.email, name: p.name, phone: p.phone, role: "reseller", status: "active", passwordHash, mustChangePassword: 1, createdAt: now, updatedAt: now });
    await tx.insert(resellerProfiles).values({ id: crypto.randomUUID(), userId, purchaseId: p.id, cpfCnpj: p.cpfCnpj, postalCode: p.postalCode, street: p.street, number: p.number, complement: p.complement, district: p.district, city: p.city, state: p.state, initialKit: p.kit, initialBoxes: p.boxes, createdAt: now });
    await ensureStockEntry(userId);
    const secret = encryptTemporarySecret(password);
    await tx.update(purchases).set({ userId, accessReleasedAt: now, welcomeSecret: secret.ciphertext, welcomeIv: secret.iv, welcomeStatus: "pending", updatedAt: now }).where(eq(purchases.id, p.id));
    return { released: true, email: p.email, password, userId, stockApplied: true };
  });
}

export async function provisionPaidPurchase(purchaseId: string) {
  try { return await provisionAttempt(purchaseId); } catch(error) {
    if (!isMysqlDuplicateKeyError(error)) throw error;
    return provisionAttempt(purchaseId);
  }
}
