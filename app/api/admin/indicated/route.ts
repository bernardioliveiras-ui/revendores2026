import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { authSessions, indicatedClients, indicatedInvitations, users } from "@/db/schema";
import { isAdminEmail, normalizeEmail, requireAdmin } from "@/lib/auth";
import { ensureIndicatedSchema } from "@/lib/indicated-schema";
import { sendIndicatedInvitation, invitationReady } from "@/lib/indicated-invitations";
import { cleanPhone, cleanText, indicatedError, INDICATED_STATUSES, MANUAL_CASHBACK_STATUSES, mayMarkBought, privateResponseHeaders, RECEIPT_REVIEWS, validChoice } from "@/lib/indicated-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request); await ensureIndicatedSchema();
    const query = new URL(request.url).searchParams;
    const needle = cleanText(query.get("q"),120).toLowerCase().replace(/\D/g, "");
    const rawQuery = cleanText(query.get("q"),120).toLowerCase();
    const status = query.get("status") || "";
    const access = query.get("access") || "";
    const rows = await getDb().select({
      id:indicatedClients.id, clientUserId:indicatedClients.clientUserId, name:indicatedClients.name,
      phone:indicatedClients.phone, channel:indicatedClients.channel, responsible:indicatedClients.responsible,
      status:indicatedClients.status, receiptId:indicatedClients.receiptId, receiptSentAt:indicatedClients.receiptSentAt,
      receiptReview:indicatedClients.receiptReview, receiptGuidance:indicatedClients.receiptGuidance,
      cashbackCents:indicatedClients.cashbackCents, cashbackStatus:indicatedClients.cashbackStatus,
      createdAt:indicatedClients.createdAt, updatedAt:indicatedClients.updatedAt,
      email:users.email, accessStatus:users.status, passwordHash:users.passwordHash,
    }).from(indicatedClients).innerJoin(users,eq(indicatedClients.clientUserId,users.id)).orderBy(desc(indicatedClients.createdAt));
    return Response.json({ clients:rows.filter(r =>
      (!rawQuery || r.name.toLowerCase().includes(rawQuery) || r.phone.includes(needle) || r.email.toLowerCase().includes(rawQuery)) &&
      (!status || r.status === status) && (!access || r.accessStatus === access)
    ).map(({passwordHash, ...row}) => ({...row, activationStatus:passwordHash ? "activated" : "awaiting_activation"})) }, {headers:privateResponseHeaders});
  } catch (error) { return indicatedError(error); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request); await ensureIndicatedSchema();
    if (!invitationReady()) return Response.json({error:"Configure RESEND_API_KEY, WELCOME_EMAIL_FROM e NEXT_PUBLIC_APP_URL (HTTPS) nas variáveis da Hostinger antes de criar convites."},{status:503});
    const data = await request.json().catch(()=>null);
    const name = cleanText(data?.name), email = normalizeEmail(data?.email), phone = cleanPhone(data?.phone);
    const channel = cleanText(data?.channel), responsible = cleanText(data?.responsible);
    if (!name || !email || !phone || !channel || !responsible) return Response.json({error:"Informe nome, e-mail, telefone, canal e responsável."},{status:400});
    if (isAdminEmail(email)) return Response.json({error:"Este e-mail é reservado ao BKO."},{status:409});
    const now = new Date().toISOString();
    const userId = crypto.randomUUID(), id = crypto.randomUUID();
    await getDb().transaction(async tx => {
      const [existing] = await tx.select({id:users.id}).from(users).where(eq(users.email,email)).limit(1);
      if (existing) throw new Error("EMAIL_TAKEN");
      await tx.insert(users).values({id:userId,email,name,phone,role:"client_indicated",status:"active",passwordHash:null,mustChangePassword:0,createdAt:now,updatedAt:now});
      await tx.insert(indicatedClients).values({id,clientUserId:userId,name,phone,channel,responsible,status:"ENTROU NO LINK",receiptReview:"PENDENTE",cashbackStatus:"PENDENTE",createdAt:now,updatedAt:now});
    });
    try {
      await sendIndicatedInvitation(userId);
      return Response.json({created:true,id,inviteSent:true},{status:201,headers:privateResponseHeaders});
    } catch (error) {
      console.error("indicated_invite_failed", error);
      return Response.json({created:true,id,inviteSent:false,error:"Indicação cadastrada, mas o envio do convite falhou. Reenvie em Acessos."},{status:201,headers:privateResponseHeaders});
    }
  } catch (error) {
    if (error instanceof Error && (error.message === "EMAIL_TAKEN" || ("code" in error && error.code === "ER_DUP_ENTRY"))) return Response.json({error:"Este e-mail já possui um acesso. Nenhum perfil foi alterado."},{status:409});
    return indicatedError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request); await ensureIndicatedSchema();
    const data = await request.json().catch(()=>null);
    const id = cleanText(data?.id,80);
    if (!id) return Response.json({error:"Indicação inválida."},{status:400});
    return await getDb().transaction(async tx => {
      const [row] = await tx.select().from(indicatedClients).where(eq(indicatedClients.id,id)).limit(1).for("update");
      if (!row) return Response.json({error:"Indicação não encontrada."},{status:404});
      const [client] = await tx.select({id:users.id,role:users.role}).from(users).where(eq(users.id,row.clientUserId)).limit(1).for("update");
      if (!client || client.role !== "client_indicated") return Response.json({error:"Perfil não é cliente indicado."},{status:409});
      const patch: Partial<typeof indicatedClients.$inferInsert> = {updatedAt:new Date().toISOString()};
      const updateUser: Partial<typeof users.$inferInsert> = {updatedAt:patch.updatedAt};
      if ("name" in data) { const name=cleanText(data.name); if(!name)return Response.json({error:"Nome inválido."},{status:400});patch.name=name;updateUser.name=name; }
      if ("phone" in data) {const phone=cleanPhone(data.phone);if(!phone)return Response.json({error:"Telefone inválido."},{status:400});patch.phone=phone;updateUser.phone=phone;}
      if ("channel" in data) {const channel=cleanText(data.channel);if(!channel)return Response.json({error:"Canal inválido."},{status:400});patch.channel=channel;}
      if ("responsible" in data) {const responsible=cleanText(data.responsible);if(!responsible)return Response.json({error:"Responsável inválido."},{status:400});patch.responsible=responsible;}
      if ("receiptReview" in data) {
        if (!validChoice(data.receiptReview,RECEIPT_REVIEWS) || !row.receiptId) return Response.json({error:"É necessário ter um comprovante para conferir."},{status:409});
        patch.receiptReview=data.receiptReview;
        patch.reviewedAt=new Date().toISOString(); patch.reviewedBy=admin.id;
        patch.receiptGuidance=cleanText(data.receiptGuidance,500);
        if (data.receiptReview === "REJEITADO" && !patch.receiptGuidance) return Response.json({error:"Informe a orientação da rejeição."},{status:400});
        if (data.receiptReview === "REJEITADO" && row.status === "COMPROU" && !("status" in data)) return Response.json({error:"Altere também o status da indicação ao rejeitar um comprovante aprovado."},{status:409});
      }
      if ("status" in data) {
        if (!validChoice(data.status,INDICATED_STATUSES)) return Response.json({error:"Status de indicação inválido."},{status:400});
        if (data.status === "COMPROU" && !mayMarkBought(patch.receiptReview || row.receiptReview,Boolean(row.receiptId))) return Response.json({error:"Só marque COMPROU após aprovar o comprovante."},{status:409});
        patch.status=data.status;
      }
      if ("cashbackCents" in data) {
        if (data.cashbackCents !== null && (!Number.isSafeInteger(data.cashbackCents) || data.cashbackCents < 0 || data.cashbackCents > 2_147_483_647)) return Response.json({error:"Valor de cashback inválido."},{status:400});
        patch.cashbackCents=data.cashbackCents;
      }
      if ("cashbackStatus" in data) { if (!validChoice(data.cashbackStatus,MANUAL_CASHBACK_STATUSES)) return Response.json({error:"Estado do cashback inválido."},{status:400});patch.cashbackStatus=data.cashbackStatus; }
      if ("active" in data) {
        if (typeof data.active !== "boolean") return Response.json({error:"Estado do acesso inválido."},{status:400});
        updateUser.status=data.active ? "active":"inactive";
        if (!data.active) {
          await tx.delete(authSessions).where(eq(authSessions.userId,row.clientUserId));
          await tx.delete(indicatedInvitations).where(and(eq(indicatedInvitations.clientUserId,row.clientUserId)));
        }
      }
      await tx.update(indicatedClients).set(patch).where(eq(indicatedClients.id,id));
      await tx.update(users).set(updateUser).where(eq(users.id,row.clientUserId));
      return Response.json({updated:true},{headers:privateResponseHeaders});
    });
  } catch (error) { return indicatedError(error); }
}
