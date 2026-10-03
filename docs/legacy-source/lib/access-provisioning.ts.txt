import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { accessProvisioning, initialPurchases, memberships, orderEvents, orders, organizations, users } from "@/db/schema";
import { generateTemporaryPassword, hashPassword } from "@/lib/passwords";
import { encryptTemporarySecret } from "@/lib/temporary-secret";

function orderNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `MX-${today}-${Math.floor(10000 + Math.random() * 90000)}`;
}

export async function provisionInitialOrder(initialPurchaseId: string) {
  const db = getDb();
  const [existingAccess] = await db.select().from(accessProvisioning).where(eq(accessProvisioning.initialPurchaseId, initialPurchaseId)).limit(1);
  if (existingAccess) return existingAccess;

  const [purchase] = await db.select().from(initialPurchases).where(eq(initialPurchases.id, initialPurchaseId)).limit(1);
  if (!purchase) throw new Error("Compra inicial não encontrada.");
  if (!['paid', 'provisioned'].includes(purchase.status)) throw new Error("Compra inicial ainda não está paga.");

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const encrypted = encryptTemporarySecret(temporaryPassword);
  const now = new Date().toISOString();
  const secretExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString();

  return db.transaction(async (tx) => {
    const [alreadyProvisioned] = await tx.select().from(accessProvisioning).where(eq(accessProvisioning.initialPurchaseId, initialPurchaseId)).limit(1);
    if (alreadyProvisioned) return alreadyProvisioned;

    let [organization] = await tx.select().from(organizations).where(eq(organizations.cpfCnpj, purchase.cpfCnpj)).limit(1);
    if (!organization) {
      const organizationId = `org_${crypto.randomUUID()}`;
      await tx.insert(organizations).values({
        id: organizationId,
        legalName: purchase.name,
        tradeName: purchase.name,
        cpfCnpj: purchase.cpfCnpj,
        email: purchase.email,
        phone: purchase.phone,
        postalCode: purchase.postalCode,
        street: purchase.street,
        number: purchase.number,
        complement: purchase.complement,
        district: purchase.district,
        city: purchase.city,
        state: purchase.state,
        asaasCustomerId: purchase.asaasCustomerId,
        utmSource: purchase.utmSource,
        utmMedium: purchase.utmMedium,
        utmCampaign: purchase.utmCampaign,
        utmContent: purchase.utmContent,
        landingPage: purchase.landingPage,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      [organization] = await tx.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
    }

    let [user] = await tx.select().from(users).where(eq(users.email, purchase.email)).limit(1);
    let secretCiphertext: string | null = null;
    let secretIv: string | null = null;
    let secretExpiry: string | null = null;
    if (!user) {
      const userId = `usr_${crypto.randomUUID()}`;
      await tx.insert(users).values({
        id: userId,
        email: purchase.email,
        name: purchase.name,
        phone: purchase.phone,
        systemRole: "member",
        status: "active",
        onboardingStatus: "complete",
        emailVerifiedAt: now,
        passwordHash,
        mustChangePassword: 1,
        failedLoginAttempts: 0,
        createdAt: now,
        updatedAt: now,
      });
      secretCiphertext = encrypted.ciphertext;
      secretIv = encrypted.iv;
      secretExpiry = secretExpiresAt;
      [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    } else if (!user.passwordHash) {
      await tx.update(users).set({ passwordHash, mustChangePassword: 1, failedLoginAttempts: 0, lockedUntil: null, updatedAt: now }).where(eq(users.id, user.id));
      secretCiphertext = encrypted.ciphertext;
      secretIv = encrypted.iv;
      secretExpiry = secretExpiresAt;
    }

    if (!organization || !user) throw new Error("Não foi possível criar revenda e usuário.");

    const [membership] = await tx.select({ id: memberships.id }).from(memberships).where(and(eq(memberships.organizationId, organization.id), eq(memberships.userId, user.id))).limit(1);
    if (!membership) await tx.insert(memberships).values({ organizationId: organization.id, userId: user.id, role: "owner", status: "active", createdAt: now });

    let orderId = purchase.orderId;
    if (!orderId) {
      orderId = `ord_${crypto.randomUUID()}`;
      await tx.insert(orders).values({
        id: orderId,
        orderNumber: orderNumber(),
        organizationId: organization.id,
        createdBy: user.id,
        kit: purchase.kit,
        boxes: purchase.boxes,
        unitPriceCents: purchase.unitPriceCents,
        totalCents: purchase.totalCents,
        status: "processing",
        orderType: "initial",
        billingType: purchase.billingType,
        asaasPaymentId: purchase.asaasPaymentId,
        asaasInvoiceUrl: purchase.asaasInvoiceUrl,
        asaasQrPayload: purchase.asaasQrPayload,
        asaasQrImage: purchase.asaasQrImage,
        paymentDueDate: purchase.paymentDueDate,
        shippingPostalCode: purchase.postalCode,
        shippingStreet: purchase.street,
        shippingNumber: purchase.number,
        shippingComplement: purchase.complement,
        shippingDistrict: purchase.district,
        shippingCity: purchase.city,
        shippingState: purchase.state,
        createdAt: purchase.createdAt,
        updatedAt: now,
      });
      await tx.insert(orderEvents).values({ orderId, status: "processing", message: "Pagamento confirmado pelo Asaas. Kit liberado para separação.", createdAt: now });
    }

    const accessId = `acc_${crypto.randomUUID()}`;
    await tx.insert(accessProvisioning).values({
      id: accessId,
      initialPurchaseId,
      organizationId: organization.id,
      userId: user.id,
      orderId,
      status: "ready",
      secretCiphertext,
      secretIv,
      secretExpiresAt: secretExpiry,
      createdAt: now,
      updatedAt: now,
    });
    await tx.update(initialPurchases).set({ status: "provisioned", organizationId: organization.id, userId: user.id, orderId, updatedAt: now }).where(eq(initialPurchases.id, initialPurchaseId));
    const [result] = await tx.select().from(accessProvisioning).where(eq(accessProvisioning.id, accessId)).limit(1);
    return result;
  });
}
