import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatedInvitations, indicatorProfiles, users } from "@/db/schema";
import { ensureIndicatorSchema } from "@/lib/indicator-schema";
import { invitationHash, newInvitationToken } from "@/lib/indicated-security";

/** Convite de ativação exclusivo de influenciadores. A tabela histórica
 * indicated_invitations permanece apenas como armazenamento de tokens, sem
 * disponibilizar o antigo perfil de cliente indicado nem seus comprovantes.
 */
export async function issueIndicatorInvitation(indicatorUserId: string) {
  await ensureIndicatorSchema();
  const token = newInvitationToken();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await getDb().transaction(async tx => {
    // Serialize generation and access deactivation around the same user row.
    const [user] = await tx.select({ id: users.id, role: users.role, status: users.status })
      .from(users).where(eq(users.id, indicatorUserId)).limit(1).for("update");
    if (!user || user.role !== "indicator" || user.status !== "active") throw new Error("INVITE_FORBIDDEN");
    const [profile]=await tx.select({userId:indicatorProfiles.userId}).from(indicatorProfiles).where(eq(indicatorProfiles.userId,user.id)).limit(1);
    if (!profile) throw new Error("INVITE_FORBIDDEN");
    // A newly generated link invalidates earlier unredeemed ones.
    await tx.delete(indicatedInvitations).where(and(eq(indicatedInvitations.clientUserId, indicatorUserId), isNull(indicatedInvitations.usedAt)));
    await tx.insert(indicatedInvitations).values({
      tokenHash: invitationHash(token), clientUserId: indicatorUserId, expiresAt, usedAt: null, createdAt: now,
    });
  });
  // Never build a full URL from a request Host header. The authenticated
  // frontend / PowerShell client joins this relative path to its trusted HTTPS base.
  return { activationPath: `/ativar-indicador?token=${encodeURIComponent(token)}`, expiresAt };
}
