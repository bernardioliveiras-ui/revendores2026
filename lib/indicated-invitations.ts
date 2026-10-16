import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatedInvitations, users } from "@/db/schema";
import { getAppUrl, getOptionalEnv } from "@/lib/env";
import { invitationHash, newInvitationToken } from "@/lib/indicated-security";

function htmlEscape(value: string) { return value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c); }
export function invitationReady() {
  const url = getAppUrl();
  return Boolean(getOptionalEnv("NEXT_PUBLIC_APP_URL") && getOptionalEnv("RESEND_API_KEY") && (getOptionalEnv("WELCOME_EMAIL_FROM") || getOptionalEnv("EMAIL_FROM")) && (url.startsWith("https://") || url.startsWith("http://localhost:")));
}

/** Tokens are never returned to BKO; delivery uses the existing Resend email integration. */
export async function sendIndicatedInvitation(clientUserId: string) {
  if (!invitationReady()) throw new Error("INVITE_NOT_CONFIGURED");
  const db = getDb();
  const [user] = await db.select({ id:users.id, email:users.email, name:users.name, role:users.role, status:users.status })
    .from(users).where(eq(users.id,clientUserId)).limit(1);
  if (!user || user.role !== "client_indicated" || user.status !== "active") throw new Error("INVITE_FORBIDDEN");
  const token = newInvitationToken();
  const hash = invitationHash(token);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 3600_000).toISOString();
  await db.insert(indicatedInvitations).values({ tokenHash: hash, clientUserId, expiresAt, usedAt:null, createdAt:now });
  const inviteUrl = `${getAppUrl()}/ativar-cliente?token=${encodeURIComponent(token)}`;
  const from = getOptionalEnv("WELCOME_EMAIL_FROM") || getOptionalEnv("EMAIL_FROM");
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(15000),
      headers: { "content-type":"application/json", authorization:`Bearer ${getOptionalEnv("RESEND_API_KEY")}` },
      body: JSON.stringify({from, to:[user.email], subject:"LORD NUTRI — ative seu acesso de cliente indicado",
        html:`<div style="font-family:Arial,sans-serif;color:#17263b"><h2>Olá, ${htmlEscape(user.name)}!</h2><p>Você recebeu um convite para acessar sua indicação na LORD NUTRI.</p><p><a href="${htmlEscape(inviteUrl)}">Ativar acesso e criar minha senha</a></p><p>O convite expira em 24 horas e só pode ser utilizado uma vez. Se você não solicitou este acesso, ignore a mensagem.</p></div>` }),
    });
    if (!response.ok) throw new Error("INVITE_DELIVERY_FAILED");
  } catch (error) {
    // Do not expose a token whose delivery failed; administrator may retry.
    await db.delete(indicatedInvitations).where(and(eq(indicatedInvitations.tokenHash,hash),isNull(indicatedInvitations.usedAt)));
    throw error;
  }
  return {sent:true, expiresAt};
}
