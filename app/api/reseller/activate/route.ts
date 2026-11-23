import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { authSessions, resellerInvitations, resellerProfiles, users } from "@/db/schema";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
import { invitationHash, privateResponseHeaders } from "@/lib/indicated-security";
import { isUsableManualResellerInvitation, validateManualResellerActivation } from "@/lib/reseller-invitation-policy.mjs";
import { hashPassword } from "@/lib/passwords";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = validateManualResellerActivation(body);
    if (parsed.error) return Response.json({error:parsed.error},{status:400,headers:privateResponseHeaders});
    const {token,password} = parsed.value!;
    await ensureOperationalSchema();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    return await getDb().transaction(async tx => {
      const [invite] = await tx.select().from(resellerInvitations).where(eq(resellerInvitations.tokenHash,invitationHash(token))).limit(1).for("update");
      if (!invite || invite.usedAt || invite.expiresAt <= now) return Response.json({error:"Convite inválido ou expirado. Solicite outro ao BKO."},{status:410,headers:privateResponseHeaders});
      const [user] = await tx.select({id:users.id,role:users.role,status:users.status})
        .from(users).where(eq(users.id,invite.userId)).limit(1).for("update");
      const [profile] = await tx.select({userId:resellerProfiles.userId,purchaseId:resellerProfiles.purchaseId})
        .from(resellerProfiles).where(eq(resellerProfiles.userId,invite.userId)).limit(1);
      if (!isUsableManualResellerInvitation(invite,user,profile,now)) return Response.json({error:"Convite indisponível."},{status:403,headers:privateResponseHeaders});
      await tx.update(users).set({passwordHash,mustChangePassword:0,failedLoginAttempts:0,lockedUntil:null,updatedAt:now}).where(eq(users.id,invite.userId));
      await tx.delete(authSessions).where(eq(authSessions.userId,invite.userId));
      await tx.update(resellerInvitations).set({usedAt:now}).where(eq(resellerInvitations.tokenHash,invite.tokenHash));
      await tx.delete(resellerInvitations).where(and(eq(resellerInvitations.userId,invite.userId),isNull(resellerInvitations.usedAt)));
      return Response.json({activated:true},{headers:privateResponseHeaders});
    });
  } catch (error) {
    console.error("reseller_activation_failed",error);
    return Response.json({error:"Não foi possível ativar o cadastro."},{status:500,headers:privateResponseHeaders});
  }
}
