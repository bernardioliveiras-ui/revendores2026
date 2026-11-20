import { getAsaasConfig } from "@/lib/asaas";
import { and, desc, eq } from "drizzle-orm";
import { getDb, getMysqlPool } from "@/db";
import { ensureIndicatorTermsSchema, currentTermsHash } from "@/lib/indicator-terms-store";
import { INDICATOR_TERMS_VERSION } from "@/lib/indicator-terms";
import { authSessions, indicatedInvitations, indicatorCampaigns, indicatorProfiles, purchases, users } from "@/db/schema";
import { isAdminEmail, normalizeEmail, requireAdmin } from "@/lib/auth";
import { ensureIndicatorSchema } from "@/lib/indicator-schema";
import { ensureIndicatedSchema } from "@/lib/indicated-schema";
import { indicatorDeletionBlockers } from "@/lib/indicator-admin-delete-guards.mjs";
import { ensureCampaignSchema } from "@/lib/campaign-schema";
import { issueIndicatorInvitation } from "@/lib/indicator-invitations";
import { cleanPhone, cleanText, indicatedError, privateResponseHeaders } from "@/lib/indicator-security";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try {
  await requireAdmin(request);await ensureIndicatorSchema();await ensureCampaignSchema();await ensureIndicatorTermsSchema();
  const q=cleanText(new URL(request.url).searchParams.get("q")).toLowerCase();
  const db=getDb();
  const [all,campaigns,orders]=await Promise.all([
   db.select({userId:users.id,name:users.name,email:users.email,phone:users.phone,accessStatus:users.status,passwordHash:users.passwordHash})
    .from(indicatorProfiles).innerJoin(users,eq(users.id,indicatorProfiles.userId)),
   db.select().from(indicatorCampaigns).orderBy(desc(indicatorCampaigns.createdAt)),
   db.select({id:purchases.id,orderNumber:purchases.orderNumber,campaignId:purchases.campaignId,
    name:purchases.name,phone:purchases.phone,paymentMethod:purchases.paymentMethod,asaasPaymentId:purchases.asaasPaymentId,asaasInvoiceUrl:purchases.asaasInvoiceUrl,kit:purchases.kit,createdAt:purchases.createdAt,asaasVerifiedAt:purchases.asaasVerifiedAt,
    paymentStatus:purchases.paymentStatus,productTotalCents:purchases.productTotalCents,shippingCents:purchases.shippingCents,
    interestCents:purchases.interestCents,totalCents:purchases.totalCents,indicatorCashbackCents:purchases.indicatorCashbackCents,utmSource:purchases.utmSource,utmMedium:purchases.utmMedium})
    .from(purchases).orderBy(desc(purchases.createdAt)),
  ]);
  const [acceptanceRows]=await getMysqlPool().execute("SELECT user_id AS userId,terms_version AS version,terms_sha256 AS sha256,accepted_at AS acceptedAt FROM indicator_terms_acceptances WHERE terms_version=? AND terms_sha256=?",[INDICATOR_TERMS_VERSION,currentTermsHash()]);
  const acceptanceMap=new Map((acceptanceRows as Array<{userId:string;version:string;sha256:string;acceptedAt:string}>).map(r=>[r.userId,r]));
  return Response.json({termsVersion:INDICATOR_TERMS_VERSION,asaasEnvironment:getAsaasConfig().environment,campaigns,orders:orders.filter(o=>o.campaignId),indicators:all.filter(u=>!q || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q)).map(({passwordHash,...row})=>({...row,activated:!!passwordHash,termsAcceptedAt:acceptanceMap.get(row.userId)?.acceptedAt||null,termsAcceptedVersion:acceptanceMap.get(row.userId)?.version||null}))}, {headers:privateResponseHeaders});
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
  if(body?.convertExisting===true||body?.convertExisting==="on") return Response.json({error:"A conversão do perfil antigo foi encerrada. Cadastre um influenciador novo."},{status:400,headers:privateResponseHeaders});
  await getDb().transaction(async tx=>{
   const [existing]=await tx.select({id:users.id}).from(users).where(eq(users.email,email)).limit(1).for("update");
   if(existing)throw new Error("EMAIL_TAKEN");
   await tx.insert(users).values({id:userId,name,email,phone,role:"indicator",status:"active",passwordHash:null,mustChangePassword:0,createdAt:now,updatedAt:now});
   await tx.insert(indicatorProfiles).values({userId,createdAt:now});
  });
  try{return Response.json({created:true,userId,...await issueIndicatorInvitation(userId)},{status:201,headers:privateResponseHeaders})}
  catch{return Response.json({created:true,userId,activationPath:null,error:"Indicadora cadastrada. Gere o convite novamente."},{status:201,headers:privateResponseHeaders})}
 }catch(error){if(error instanceof Error&& (error.message==="EMAIL_TAKEN" || ("code" in error&&error.code==="ER_DUP_ENTRY")))return Response.json({error:"E-mail já utilizado; nenhum perfil foi alterado."},{status:409});return indicatedError(error)}
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

/**
 * Exclusão individual de indicador sem histórico financeiro. Toda operação ocorre
 * na mesma transação, com checagem de pedidos e FKs habilitadas. Exclusão ampla de
 * dados de teste deve usar o script backup-first, não esta API.
 */
export async function DELETE(request:Request){
 try{
  const admin=await requireAdmin(request);
  const origin=request.headers.get("origin");
  const trustedHost=request.headers.get("host")||new URL(request.url).host;
  let safeOrigin=false;
  try { const parsed=new URL(origin||"");safeOrigin=parsed.host===trustedHost&&(parsed.protocol==="https:"||(parsed.protocol==="http:"&&/^(localhost|127\.0\.0\.1)(:|$)/.test(trustedHost))); }catch{}
  if(!safeOrigin)return Response.json({error:"Origem não autorizada para exclusão."},{status:403,headers:privateResponseHeaders});
  await ensureIndicatorSchema();await ensureIndicatedSchema();await ensureCampaignSchema();await ensureIndicatorTermsSchema();
  const data=await request.json().catch(()=>null);
  const userId=cleanText(data?.userId,80);
  const email=normalizeEmail(data?.email);
  if(!userId||!email||data?.confirm!=="EXCLUIR")return Response.json({error:"Informe o e-mail do indicador e confirme EXCLUIR."},{status:400,headers:privateResponseHeaders});
  const pool=getMysqlPool();const conn=await pool.getConnection();
  try{
   await conn.beginTransaction();
   const [found]=await conn.execute("SELECT id,email,role FROM users WHERE id=? FOR UPDATE",[userId]);
   const account=(found as Array<{id:string;email:string;role:string}>)[0];
   const [profile]=await conn.execute("SELECT user_id FROM indicator_profiles WHERE user_id=? LIMIT 1",[userId]);
   if(!account||account.role!=="indicator"||account.email.toLowerCase()!==email||(profile as unknown[]).length===0){
    await conn.rollback();return Response.json({error:"Indicador não encontrado ou e-mail divergente. Nenhum cadastro foi excluído."},{status:404,headers:privateResponseHeaders});
   }
   const [linkedOrders]=await conn.execute(`SELECT COUNT(*) AS n FROM purchases
    WHERE user_id=? OR campaign_id IN (SELECT id FROM indicator_campaigns WHERE indicator_user_id=?)`,[userId,userId]);
   const counts:Record<string,number>={purchases:Number((linkedOrders as Array<{n:number}>)[0]?.n||0)};
   const checks:Record<string,string>={
    affiliateReferrals:"SELECT COUNT(*) AS n FROM affiliate_referrals WHERE user_id=?",
    affiliateCashbacks:"SELECT COUNT(*) AS n FROM affiliate_cashbacks WHERE reseller_user_id=?",
    resellerProfiles:"SELECT COUNT(*) AS n FROM reseller_profiles WHERE user_id=?",
    sales:"SELECT COUNT(*) AS n FROM sales WHERE user_id=?",
    stockMovements:"SELECT COUNT(*) AS n FROM stock_movements WHERE user_id=?",
    indicatorReceipts:"SELECT COUNT(*) AS n FROM indicator_receipts WHERE lead_id IN (SELECT id FROM indicator_leads WHERE indicator_user_id=?)",
    indicatedReceipts:"SELECT COUNT(*) AS n FROM indicated_receipts WHERE indication_id IN (SELECT id FROM indicated_clients WHERE client_user_id=?)",
    financialLeads:"SELECT COUNT(*) AS n FROM indicator_leads WHERE indicator_user_id=? AND (receipt_id IS NOT NULL OR receipt_review='APROVADO' OR cashback_status IN ('LIBERADO','PAGO') OR status='COMPROU')",
    financialIndications:"SELECT COUNT(*) AS n FROM indicated_clients WHERE client_user_id=? AND (receipt_id IS NOT NULL OR receipt_review='APROVADO' OR cashback_status IN ('LIBERADO','PAGO') OR status='COMPROU')",
   };
   const [tables]=await conn.execute("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'");
   const present=new Set((tables as Array<{name:string}>).map(r=>r.name));
   const relevant:Record<string,string>={affiliateReferrals:"affiliate_referrals",affiliateCashbacks:"affiliate_cashbacks",resellerProfiles:"reseller_profiles",sales:"sales",stockMovements:"stock_movements",indicatorReceipts:"indicator_receipts",indicatedReceipts:"indicated_receipts",financialLeads:"indicator_leads",financialIndications:"indicated_clients"};
   for(const [key,query] of Object.entries(checks)){
    if(!present.has(relevant[key]))continue;
    const [rows]=await conn.execute(query,[userId]);counts[key]=Number((rows as Array<{n:number}>)[0]?.n||0);
   }
   const blockers=indicatorDeletionBlockers(counts);
   if(blockers.length){await conn.rollback();return Response.json({error:`Não é possível excluir este indicador: ${blockers.join(", ")}. Preserve o histórico ou utilize a limpeza supervisionada com backup.`,code:"HAS_FINANCIAL_HISTORY",blockers},{status:409,headers:privateResponseHeaders});}
   // Não remova nem desvincule pedidos. Dados financeiros nunca são apagados por esta rota.
   await conn.execute("DELETE FROM indicator_terms_acceptances WHERE user_id=?",[userId]);
   await conn.execute("DELETE FROM indicator_receipts WHERE lead_id IN (SELECT id FROM indicator_leads WHERE indicator_user_id=?)",[userId]);
   await conn.execute("DELETE FROM indicator_leads WHERE indicator_user_id=?",[userId]);
   if(present.has("indicated_receipts"))await conn.execute("DELETE FROM indicated_receipts WHERE indication_id IN (SELECT id FROM indicated_clients WHERE client_user_id=?)",[userId]);
   if(present.has("indicated_clients"))await conn.execute("DELETE FROM indicated_clients WHERE client_user_id=?",[userId]);
   await conn.execute("DELETE FROM indicated_invitations WHERE client_user_id=?",[userId]);
   await conn.execute("DELETE FROM indicator_campaigns WHERE indicator_user_id=?",[userId]);
   await conn.execute("DELETE FROM indicator_profiles WHERE user_id=?",[userId]);
   await conn.execute("DELETE FROM auth_sessions WHERE user_id=?",[userId]);
   const [result]=await conn.execute("DELETE FROM users WHERE id=? AND role='indicator' AND email=?",[userId,email]);
   if((result as {affectedRows:number}).affectedRows!==1)throw Error("Indicador mudou durante a exclusão. A operação será revertida.");
   await conn.commit();
   console.info("bko_indicator_deleted",{actor:admin.id,indicatorId:userId,at:new Date().toISOString()});
   return Response.json({deleted:true,userId},{headers:privateResponseHeaders});
  }catch(error){
   await conn.rollback().catch(()=>{});
   if(error instanceof Error && "code" in error && ["ER_ROW_IS_REFERENCED_2","ER_ROW_IS_REFERENCED"].includes(String(error.code)))return Response.json({error:"O indicador possui registros vinculados a outro módulo. Nenhum dado foi apagado. Para zerar o ambiente inteiro, utilize a rotina supervisionada com backup."},{status:409,headers:privateResponseHeaders});
   throw error;
  }
  finally{conn.release()}
 }catch(error){return indicatedError(error)}
}
