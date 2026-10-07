import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { operationalPurchaseFields } from "@/lib/purchase-fields";
import { getOptionalEnv } from "@/lib/env";

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c] || c)); }

export async function sendOrderStatusEmail(purchaseId: string, status: string) {
  const apiKey = getOptionalEnv("RESEND_API_KEY");
  const from = getOptionalEnv("WELCOME_EMAIL_FROM") || getOptionalEnv("EMAIL_FROM");
  if (!apiKey || !from || !["shipped", "delivered"].includes(status)) return { sent: false, reason: "not_configured" };
  const [p] = await getDb().select(operationalPurchaseFields).from(purchases).where(eq(purchases.id, purchaseId)).limit(1);
  if (!p) return { sent: false, reason: "not_found" };
  const portal = `${getOptionalEnv("NEXT_PUBLIC_APP_URL") || "https://revendedores.mix10pro.com.br"}/painel`;
  const label = status === "delivered" ? "Entregue" : "Em percurso";
  const tracking = p.trackingCode ? `<p><strong>Rastreio:</strong> ${escapeHtml(p.trackingCode)}</p>` : "";
  const carrier = p.carrier ? `<p><strong>Transportadora:</strong> ${escapeHtml(p.carrier)}</p>` : "";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(15000),
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from, to: [p.email], subject: `LORDNUTRI - pedido ${p.orderNumber}: ${label}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0b2540"><h1>Atualização do seu pedido</h1><p>Olá, ${escapeHtml(p.name)}. O pedido <strong>${escapeHtml(p.orderNumber)}</strong> agora está como <strong>${label}</strong>.</p>${carrier}${tracking}<p><a href="${escapeHtml(portal)}">Acompanhar no Portal do Revendedor</a></p><p>Equipe LORDNUTRI</p></div>`,
    }),
  });
  if (!response.ok) throw new Error("ORDER_STATUS_EMAIL_FAILED");
  return { sent: true };
}
