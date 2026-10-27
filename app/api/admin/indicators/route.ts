import { getAsaasConfig } from "@/lib/asaas";
import { and, desc, eq } from "drizzle-orm";
import { getDb, getMysqlPool } from "@/db";
import { ensureIndicatorTermsSchema, currentTermsHash } from "@/lib/indicator-terms-store";
import { INDICATOR_TERMS_VERSION } from "@/lib/indicator-terms";
import { authSessions, indicatedClients, indicatedInvitations, indicatorCampaigns, indicatorLeads, indicatorProfiles, purchases, users } from "@/db/schema";
import { isAdminEmail, normalizeEmail, requireAdmin } from "@/lib/auth";
import { ensureIndicatorSchema } from "@/lib/indicator-schema";
import { ensureCampaignSchema } from "@/lib/campaign-schema";
import { issueIndicatedInvitation } from "@/lib/indicated-invitations";
import { indicatorProofTotals } from "@/lib/indicator-accounting";
import { cleanPhone, cleanText, indicatedError, privateResponseHeaders } from "@/lib/indicator-security";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try {
  await requireAdmin(request);await ensureIndicatorSchema();await ensureCampaignSchema();await ensureIndicatorTermsSchema();
  const q=cleanText(new URL(request.url).searchParams.get("q")).toLowerCase();
  const db=getDb();
  const [all,leads,campaigns,orders]=await Promise.all([
   db.select({userId:users.id,name:users.name,email:users.email,phone:users.phone,accessStatus:users.status,passwordHash:users.passwordHash})
    .from(indicatorProfiles).innerJoin(users,eq(users.id,indicatorProfiles.userId)),
   db.select().from(indicatorLeads).orderBy(desc(indicatorLeads.createdAt)),
   db.select().from(indicatorCampaigns).orderBy(desc(indicatorCampaigns.createdAt)),
   db.select({id:purchases.id,orderNumber:purchases.orderNumber,campaignId:purchases.campaignId,
    name:purchases.name,kit:purchases.kit,createdAt:purchases.createdAt,asaasVerifiedAt:purchases.asaasVerifiedAt,
    paymentStatus:purchases.paymentStatus,productTotalCents:purchases.productTotalCents,shippingCents:purchases.shippingCents,
    interestCents:purchases.interestCents,totalCents:purchases.totalCents,utmSource:purchases.utmSource,utmMedium:purchases.utmMedium})
    .from(purchases).orderBy(desc(purchases.createdAt)),
  ]);
  const [acceptanceRows]=await getMysqlPool().execute("SELECT user_id AS userId,terms_version AS version,terms_sha256 AS sha256,accepted_at AS acceptedAt FROM indicator_terms_acceptances WHERE terms_version=? AND terms_sha256=?",[INDICATOR_TERMS_VERSION,currentTermsHash()]);
  const acceptanceMap=new Map((acceptanceRows as Array<{userId:string;version:string;sha256:string;acceptedAt:string}>).map(r=>[r.userId,r]));
  return Response.json({termsVersion:INDICATOR_TERMS_VERSION,asaasEnvironment:getAsaasConfig().environment,campaigns,orders:orders.filter(o=>o.campaignId),totals:indicatorProofTotals(leads),indicators:all.filter(u=>!q || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q)).map(({passwordHash,...row})=>({...row,activated:!!passwordHash,termsAcceptedAt:acceptanceMap.get(row.userId)?.acceptedAt||null,termsAcceptedVersion:acceptanceMap.get(row.userId)?.version||null})),leads:leads.map(({publicCode,...row})=>({...row,indicatorName:all.find(u=>u.userId===row.indicatorUserId)?.name||"Indicador"}))}, {headers:privateResponseHeaders});
 }catch(error){return indicatedError(error)}
}
export async function POST(request:Request){
 try{
  await requireAdmin(request);await ensureIndicatorSchema();
  const body=await request.json().catch(()=>null);
  const name=cleanText(body?.name),email=normalizeEmail(body?.email),phone=cleanPhone(body?.phone);
  if(!name||!email||!phone)return Response.json({error:"Informe nome, e-mail e telefone válidos."},{status:400});
  if(isAdminEmail(email))return Response.json({error:"E-mail reservado ao BKO."},{status:409});
  const now=new Date().toISOString();let userId=crypto.randomUUID();
  const convertExisting=body?.convertExisting===true||body?.convertExisting==="on";
  await getDb().transaction(async tx=>{
   const [existing]=await tx.select({id:users.id,role:users.role,status:users.status}).from(users).where(eq(users.email,email)).limit(1).for("update");
   if(convertExisting){
    if(!existing||existing.role!=="client_indicated")throw new Error("NOT_CONVERTIBLE");
    const [old]=await tx.select({receiptId:indicatedClients.receiptId}).from(indicatedClients).where(eq(indicatedClients.clientUserId,existing.id)).limit(1);
    if(!old||old.receiptId)throw new Error("HAS_RECEIPT");
    userId=existing.id;
    // Preserve the original indication record for history, but change this
    // person's access to the explicitly restricted indicator role.
    await tx.update(users).set({role:"indicator",status:"active",name,phone,passwordHash:null,mustChangePassword:0,updatedAt:now}).where(eq(users.id,userId));
    await tx.delete(authSessions).where(eq(authSessions.userId,userId));
    await tx.delete(indicatedInvitations).where(eq(indicatedInvitations.clientUserId,userId));
   }else{
    if(existing)throw new Error("EMAIL_TAKEN");
    await tx.insert(users).values({id:userId,name,email,phone,role:"indicator",status:"active",passwordHash:null,mustChangePassword:0,createdAt:now,updatedAt:now});
   }
   await tx.insert(indicatorProfiles).values({userId,createdAt:now});
  });
  try{return Response.json({created:true,userId,...await issueIndicatedInvitation(userId)},{status:201,headers:privateResponseHeaders})}
  catch{return Response.json({created:true,userId,activationPath:null,error:"Indicadora cadastrada. Gere o convite novamente."},{status:201,headers:privateResponseHeaders})}
 }catch(error){if(error instanceof Error&&error.message==="NOT_CONVERTIBLE")return Response.json({error:"Para converter, o e-mail deve pertencer a um cliente indicado existente, nunca a revendedor ou BKO."},{status:409});if(error instanceof Error&&error.message==="HAS_RECEIPT")return Response.json({error:"Este cliente já tem comprovante. Não é possível converter o acesso e perder seu acompanhamento."},{status:409});if(error instanceof Error&& (error.message==="EMAIL_TAKEN" || ("code" in error&&error.code==="ER_DUP_ENTRY")))return Response.json({error:"E-mail já utilizado; nenhum perfil foi alterado."},{status:409});return indicatedError(error)}
}
export async function PATCH(request:Request){
 try{
  await requireAdmin(request);await ensureIndicatorSchema();
  const body=await request.json().catch(()=>null),userId=cleanText(body?.userId,80);
  if(!userId)return Response.json({error:"Indicadora inválida."},{status:400});
  return await getDb().transaction(async tx=>{
   const [user]=await tx.select().from(users).where(eq(users.id,userId)).limit(1).for("update");
   const [profile]=await tx.select({userId:indicatorProfiles.userId}).from(indicatorProfiles).where(eq(indicatorProfiles.userId,userId)).limit(1);
   if(!user||user.role!=="indicator"||!profile)return Response.json({error:"Acesso não é de indicador."},{status:404});
   const patch:Partial<typeof users.$inferInsert>={updatedAt:new Date().toISOString()};
   if("name" in body){const name=cleanText(body.name);if(!name)return Response.json({error:"Nome inválido."},{status:400});patch.name=name}
   if("phone" in body){const phone=cleanPhone(body.phone);if(!phone)return Response.json({error:"Telefone inválido."},{status:400});patch.phone=phone}
   if("active" in body){if(typeof body.active!=="boolean")return Response.json({error:"Estado inválido."},{status:400});patch.status=body.active?"active":"inactive";
    if(!body.active){await tx.delete(authSessions).where(eq(authSessions.userId,userId));await tx.delete(indicatedInvitations).where(eq(indicatedInvitations.clientUserId,userId));}
   }
   await tx.update(users).set(patch).where(eq(users.id,userId));
   return Response.json({updated:true},{headers:privateResponseHeaders});
  });
 }catch(error){return indicatedError(error)}
}
