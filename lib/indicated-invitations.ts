import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatedClients, indicatedInvitations, users } from "@/db/schema";
import { invitationHash, newInvitationToken } from "@/lib/indicated-security";

/**
 * Create a one-time, short-lived manual activation link for an indicated client.
 *
 * The admin receives the path only in this response and delivers it privately
 * (for example via WhatsApp). The DB stores only a SHA-256 hash. No e-mail,
 * reseller account or Asaas integration is used here.
 */
export async function issueIndicatedInvitation(clientUserId: string) {
  const token = newInvitationToken();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await getDb().transaction(async tx => {
    // Serialize generation and access deactivation around the same user row.
    const [user] = await tx.select({ id: users.id, role: users.role, status: users.status })
      .from(users).where(eq(users.id, clientUserId)).limit(1).for("update");
    if (!user || user.role !== "client_indicated" || user.status !== "active") throw new Error("INVITE_FORBIDDEN");
    const [indication] = await tx.select({ id: indicatedClients.id })
      .from(indicatedClients).where(eq(indicatedClients.clientUserId, clientUserId)).limit(1);
    if (!indication) throw new Error("INVITE_FORBIDDEN");
    // A newly generated link invalidates earlier unredeemed ones.
    await tx.delete(indicatedInvitations).where(and(eq(indicatedInvitations.clientUserId, clientUserId), isNull(indicatedInvitations.usedAt)));
    await tx.insert(indicatedInvitations).values({
      tokenHash: invitationHash(token), clientUserId, expiresAt, usedAt: null, createdAt: now,
    });
  });
  // Never build a full URL from a request Host header. The authenticated
  // frontend / PowerShell client joins this relative path to its trusted HTTPS base.
  return { activationPath: `/ativar-cliente?token=${encodeURIComponent(token)}`, expiresAt };
}
