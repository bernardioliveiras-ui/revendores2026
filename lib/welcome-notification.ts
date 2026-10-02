import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { getOptionalEnv } from "@/lib/env";
import { decryptTemporarySecret } from "@/lib/temporary-secret";
import { welcomeEndpoint, welcomeKey } from "@/lib/welcome-contract";

// Configurable bridge to the merchant's existing email + WhatsApp automation.
// The receiver must honor Idempotency-Key and send BOTH channels before 2xx.
export async function sendWelcome(purchaseId: string) {
  const endpoint = welcomeEndpoint(getOptionalEnv("WELCOME_AUTOMATION_URL") || "");
  const token = getOptionalEnv("WELCOME_AUTOMATION_TOKEN");
  if (!endpoint || !token) return { sent: false, reason: "not_configured" };
  return getDb().transaction(async tx => {
    const [p] = await tx.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1).for("update");
    if (!p || p.paymentStatus !== "paid" || !p.userId) return { sent: false, reason: "not_qualified" };
    if (p.welcomeStatus === "sent") return { sent: true, duplicate: true };
    if (!p.welcomeSecret || !p.welcomeIv) return { sent: false, reason: "manual_access_required" };
    const response = await fetch(endpoint, { method: "POST", redirect: "error", signal: AbortSignal.timeout(15000), headers: { "content-type": "application/json", authorization: `Bearer ${token}`, "Idempotency-Key": welcomeKey(p.id, p.welcomeIv) }, body: JSON.stringify({ event: "lordnutri.reseller.welcome", purchaseId: p.id, orderNumber: p.orderNumber, name: p.name, email: p.email, phone: p.phone, portalUrl: `${getOptionalEnv("NEXT_PUBLIC_APP_URL") || "https://revendedores.mix10pro.com.br"}/entrar`, temporaryPassword: decryptTemporarySecret(p.welcomeSecret, p.welcomeIv), channels: ["email", "whatsapp"] }) });
    if (!response.ok) throw new Error("WELCOME_DELIVERY_FAILED");
    await tx.update(purchases).set({ welcomeStatus: "sent", welcomeSentAt: new Date().toISOString(), welcomeSecret: null, welcomeIv: null }).where(eq(purchases.id, p.id));
    return { sent: true };
  });
}
