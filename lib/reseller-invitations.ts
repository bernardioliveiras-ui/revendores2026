import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { resellerInvitations, resellerProfiles, users } from "@/db/schema";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
import { invitationHash, newInvitationToken } from "@/lib/indicated-security";
import { canIssueManualResellerInvitation } from "@/lib/reseller-invitation-policy.mjs";

/** A private, one-use password setup link. Never build it from the request Host. */
export async function issueResellerInvitation(userId: string) {
  await ensureOperationalSchema();
  const token = newInvitationToken();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await getDb().transaction(async tx => {
    const [user] = await tx.select({id:users.id,role:users.role,status:users.status})
      .from(users).where(eq(users.id,userId)).limit(1).for("update");
    const [profile] = await tx.select({userId:resellerProfiles.userId,purchaseId:resellerProfiles.purchaseId})
      .from(resellerProfiles).where(eq(resellerProfiles.userId,userId)).limit(1);
    if (!canIssueManualResellerInvitation(user,profile)) throw new Error("RESELLER_INVITE_FORBIDDEN");
    await tx.delete(resellerInvitations).where(and(eq(resellerInvitations.userId,userId),isNull(resellerInvitations.usedAt)));
    await tx.insert(resellerInvitations).values({tokenHash:invitationHash(token),userId,expiresAt,usedAt:null,createdAt:now});
  });
  return {activationPath:`/ativar-revendedor?token=${encodeURIComponent(token)}`,expiresAt};
}
