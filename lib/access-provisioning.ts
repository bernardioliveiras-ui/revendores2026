import { isMysqlDuplicateKeyError } from "@/lib/mysql-errors";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases, resellerProfiles, stockMovements, users } from "@/db/schema";
import { encryptTemporarySecret } from "@/lib/temporary-secret";
import { generateTemporaryPassword, hashPassword } from "@/lib/passwords";

// A row lock on the purchase makes Asaas retries and manual release converge.
async function provisionAttempt(purchaseId: string) {
  const password = generateTemporaryPassword();
  const passwordHash = await hashPassword(password);
  return getDb().transaction(async tx => {
    const [p] = await tx.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1).for("update");
    if (!p) throw new Error("PURCHASE_NOT_FOUND");
    if (p.paymentStatus !== "paid") throw new Error("PAYMENT_REQUIRED");
    if (p.userId || p.accessReleasedAt) return { released: false, email: p.email, password: null, userId: p.userId };
    const [existing] = await tx.select().from(users).where(eq(users.email, p.email)).limit(1);
    if (existing) {
      if(existing.role!=="reseller"||existing.status!=="active")throw new Error("EMAIL_ALREADY_EXISTS");
      const now=new Date().toISOString();
      await tx.insert(stockMovements).values({id:crypto.randomUUID(),userId:existing.id,type:"entry",boxes:p.boxes,referenceType:"initial_purchase",referenceId:p.id,notes:`Compra ${p.kit.toUpperCase()}`,occurredAt:now,createdAt:now});
      await tx.update(purchases).set({userId:existing.id,accessReleasedAt:now,updatedAt:now}).where(eq(purchases.id,p.id));
      return {released:true,email:p.email,password:null,userId:existing.id};
    }
    const userId = crypto.randomUUID(); const now = new Date().toISOString();
    await tx.insert(users).values({ id: userId, email: p.email, name: p.name, phone: p.phone, role: "reseller", status: "active", passwordHash, mustChangePassword: 1, createdAt: now, updatedAt: now });
    await tx.insert(resellerProfiles).values({ id: crypto.randomUUID(), userId, purchaseId: p.id, cpfCnpj: p.cpfCnpj, postalCode: p.postalCode, street: p.street, number: p.number, complement: p.complement, district: p.district, city: p.city, state: p.state, initialKit: p.kit, initialBoxes: p.boxes, createdAt: now });
    await tx.insert(stockMovements).values({ id: crypto.randomUUID(), userId, type: "entry", boxes: p.boxes, referenceType: "initial_purchase", referenceId: p.id, notes: `Estoque inicial ${p.kit.toUpperCase()}`, occurredAt: now, createdAt: now });
    const secret = encryptTemporarySecret(password);
    await tx.update(purchases).set({ userId, accessReleasedAt: now, welcomeSecret: secret.ciphertext, welcomeIv: secret.iv, welcomeStatus: "pending", updatedAt: now }).where(eq(purchases.id, p.id));
    return { released: true, email: p.email, password, userId };
  });
}

export async function provisionPaidPurchase(purchaseId: string) {
  try { return await provisionAttempt(purchaseId); } catch(error) {
    // Concurrent first purchases for the same email converge on its unique user.
    if (!isMysqlDuplicateKeyError(error)) throw error;
    return provisionAttempt(purchaseId);
  }
}
