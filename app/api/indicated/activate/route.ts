import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { authSessions, indicatedClients, indicatedInvitations, indicatorProfiles, users } from "@/db/schema";
import { ensureIndicatorSchema } from "@/lib/indicator-schema";
import { ensureIndicatedSchema } from "@/lib/indicated-schema";
import { invitationHash, privateResponseHeaders } from "@/lib/indicated-security";
import { hashPassword } from "@/lib/passwords";

export const runtime="nodejs";
export async function POST(request:Request) {
  try {
    await ensureIndicatedSchema(); await ensureIndicatorSchema();
    const body = await request.json().catch(()=>null);
    const token=typeof body?.token==="string"?body.token:"";
    const password=typeof body?.password==="string"?body.password:"";
    const confirm=typeof body?.confirm==="string"?body.confirm:"";
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return Response.json({error:"Convite inválido ou expirado."},{status:400});
    if (password.length < 10 || password.length > 256 || password !== confirm) return Response.json({error:"A senha precisa ter 10 a 256 caracteres e ser confirmada."},{status:400});
    const hash=await hashPassword(password);
    const now=new Date().toISOString();
    return await getDb().transaction(async tx=>{
      const [invite] = await tx.select().from(indicatedInvitations).where(eq(indicatedInvitations.tokenHash,invitationHash(token))).limit(1).for("update");
      if (!invite || invite.usedAt || invite.expiresAt <= now) return Response.json({error:"Convite inválido ou expirado. Peça um novo convite ao BKO."},{status:410});
      const [user]=await tx.select().from(users).where(eq(users.id,invite.clientUserId)).limit(1).for("update");
      const [indication]=await tx.select({id:indicatedClients.id}).from(indicatedClients).where(eq(indicatedClients.clientUserId,invite.clientUserId)).limit(1);
      const [profile]=await tx.select({userId:indicatorProfiles.userId}).from(indicatorProfiles).where(eq(indicatorProfiles.userId,invite.clientUserId)).limit(1);
      if (!user || user.status !== "active" || !(user.role === "client_indicated" && indication || user.role === "indicator" && profile)) return Response.json({error:"Convite indisponível."},{status:403});
      await tx.update(users).set({passwordHash:hash,mustChangePassword:0,failedLoginAttempts:0,lockedUntil:null,updatedAt:now}).where(eq(users.id,user.id));
      await tx.delete(authSessions).where(eq(authSessions.userId,user.id));
      await tx.update(indicatedInvitations).set({usedAt:now}).where(eq(indicatedInvitations.tokenHash,invite.tokenHash));
      // All other pending invites for this user become unusable after activation.
      await tx.delete(indicatedInvitations).where(and(eq(indicatedInvitations.clientUserId,user.id),isNull(indicatedInvitations.usedAt),gt(indicatedInvitations.expiresAt,now)));
      return Response.json({activated:true},{headers:privateResponseHeaders});
    });
  } catch(error){console.error("indicated_activate_failed",error);return Response.json({error:"Não foi possível ativar o convite."},{status:500});}
}
