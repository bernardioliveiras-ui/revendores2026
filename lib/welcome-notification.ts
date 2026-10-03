import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { operationalPurchaseFields } from "@/lib/purchase-fields";
import { getOptionalEnv } from "@/lib/env";
import { decryptTemporarySecret } from "@/lib/temporary-secret";
import { welcomeEndpoint, welcomeKey } from "@/lib/welcome-contract";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

async function sendViaResend(input: { name: string; email: string; orderNumber: string; portalUrl: string; temporaryPassword: string | null }) {
  const apiKey = getOptionalEnv("RESEND_API_KEY");
  const from = getOptionalEnv("WELCOME_EMAIL_FROM") || getOptionalEnv("EMAIL_FROM");
  if (!apiKey || !from) return false;
  const safeName = escapeHtml(input.name || "Revendedor");
  const safePortal = escapeHtml(input.portalUrl);
  const passwordBlock = input.temporaryPassword
    ? `<p><strong>Senha provisória:</strong> <code style="font-size:16px">${escapeHtml(input.temporaryPassword)}</code></p><p>Por segurança, troque a senha no primeiro acesso.</p>`
    : `<p>Seu acesso já existia. Use sua senha atual para entrar.</p>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(15000),
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from, to: [input.email], subject: "Bem-vindo à LORDNUTRI - seu acesso ao Portal do Revendedor",
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0b2540"><h1>Bem-vindo à LORDNUTRI, ${safeName}!</h1><p>Seu pagamento do pedido <strong>${escapeHtml(input.orderNumber)}</strong> foi confirmado e seu acesso ao Portal do Revendedor está liberado.</p>${passwordBlock}<p><a href="${safePortal}" style="display:inline-block;padding:12px 18px;background:#0b2540;color:white;text-decoration:none;border-radius:8px">Acessar o portal</a></p><p>No portal você acompanha estoque, vendas, Manual do Revendedor e andamento dos pedidos.</p><p>Equipe LORDNUTRI</p></div>`,
    }),
  });
  if (!response.ok) throw new Error("WELCOME_EMAIL_FAILED");
  return true;
}

// Envio idempotente. Prioriza a automação externa (email + WhatsApp) quando configurada;
// caso contrário, envia o email diretamente pelo Resend quando houver credenciais.
export async function sendWelcome(purchaseId: string) {
  return getDb().transaction(async tx => {
    const [p] = await tx.select(operationalPurchaseFields).from(purchases).where(eq(purchases.id, purchaseId)).limit(1).for("update");
    if (!p || p.paymentStatus !== "paid" || !p.userId) return { sent: false, reason: "not_qualified" };
    if (p.welcomeStatus === "not_required") return { sent: false, reason: "not_required" };
    if (p.welcomeStatus === "sent") return { sent: true, duplicate: true };
    const temporaryPassword = p.welcomeSecret && p.welcomeIv ? decryptTemporarySecret(p.welcomeSecret, p.welcomeIv) : null;
    const portalUrl = `${getOptionalEnv("NEXT_PUBLIC_APP_URL") || "https://revendedores.mix10pro.com.br"}/entrar`;
    const endpoint = welcomeEndpoint(getOptionalEnv("WELCOME_AUTOMATION_URL") || "");
    const token = getOptionalEnv("WELCOME_AUTOMATION_TOKEN");
    let sent = false;

    if (endpoint && token) {
      const response = await fetch(endpoint, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
        headers: { "content-type": "application/json", authorization: `Bearer ${token}`, "Idempotency-Key": welcomeKey(p.id, p.welcomeIv || "existing-account") },
        body: JSON.stringify({ event: "lordnutri.reseller.welcome", purchaseId: p.id, orderNumber: p.orderNumber, name: p.name, email: p.email, phone: p.phone, portalUrl, temporaryPassword, existingAccount: !temporaryPassword, channels: ["email", "whatsapp"] }),
      });
      if (!response.ok) throw new Error("WELCOME_DELIVERY_FAILED");
      sent = true;
    } else {
      sent = await sendViaResend({ name: p.name, email: p.email, orderNumber: p.orderNumber, portalUrl, temporaryPassword });
    }

    if (!sent) return { sent: false, reason: "not_configured" };
    await tx.update(purchases).set({ welcomeStatus: "sent", welcomeSentAt: new Date().toISOString(), welcomeSecret: null, welcomeIv: null }).where(eq(purchases.id, p.id));
    return { sent: true };
  });
}
