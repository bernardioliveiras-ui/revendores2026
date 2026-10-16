import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatorLeads, indicatorProfiles } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ensureIndicatorSchema } from "@/lib/indicator-schema";
import { cleanText, indicatedError, privateResponseHeaders, INDICATOR_STATUSES, INDICATOR_CASHBACK_STATUSES } from "@/lib/indicator-security";
import { mayMarkBought, RECEIPT_REVIEWS, validChoice } from "@/lib/indicated-security";
export const runtime="nodejs";
export async function PATCH(request:Request){
 try{
  const admin=await requireAdmin(request);await ensureIndicatorSchema();
  const data=await request.json().catch(()=>null);
  const id=cleanText(data?.id,80);
  if(!id)return Response.json({error:"Indicação inválida."},{status:400});
  return await getDb().transaction(async tx=>{
   const [lead]=await tx.select().from(indicatorLeads).where(eq(indicatorLeads.id,id)).limit(1).for("update");
   if(!lead)return Response.json({error:"Indicação não encontrada."},{status:404});
   const [profile]=await tx.select({userId:indicatorProfiles.userId}).from(indicatorProfiles)
    .where(eq(indicatorProfiles.userId,lead.indicatorUserId)).limit(1);
   if(!profile)return Response.json({error:"Indicador sem perfil válido."},{status:409});
   const patch:Partial<typeof indicatorLeads.$inferInsert>={updatedAt:new Date().toISOString()};
   if("receiptReview" in data){
    if(!validChoice(data.receiptReview,RECEIPT_REVIEWS)||!lead.receiptId)return Response.json({error:"É preciso receber um comprovante para conferir."},{status:409});
    patch.receiptReview=data.receiptReview;patch.reviewedBy=admin.id;patch.reviewedAt=patch.updatedAt;
    patch.verificationNotes=cleanText(data.verificationNotes,500);
    if(data.receiptReview==="REJEITADO"&&!patch.verificationNotes)return Response.json({error:"Explique o motivo da rejeição."},{status:400});
    if(data.receiptReview!=="APROVADO"&&lead.status==="COMPROU"&&data.status!=="ENTROU NO LINK"&&data.status!=="ESPERANDO NO CARRINHO")return Response.json({error:"Remova COMPROU ao reverter uma conferência."},{status:409});
   }
   if("status" in data){
    if(!validChoice(data.status,INDICATOR_STATUSES))return Response.json({error:"Status inválido."},{status:400});
    if(data.status==="COMPROU"&&!mayMarkBought(patch.receiptReview||lead.receiptReview,!!lead.receiptId))return Response.json({error:"COMPROU requer comprovante aprovado pelo BKO."},{status:409});
    patch.status=data.status;
   }
   if("cashbackCents" in data){
    if(data.cashbackCents!==null&&(!Number.isSafeInteger(data.cashbackCents)||data.cashbackCents<0||data.cashbackCents>2147483647))return Response.json({error:"Valor de cashback inválido."},{status:400});
    patch.cashbackCents=data.cashbackCents;
   }
   if("cashbackStatus" in data){if(!validChoice(data.cashbackStatus,INDICATOR_CASHBACK_STATUSES))return Response.json({error:"Estado de cashback inválido."},{status:400});patch.cashbackStatus=data.cashbackStatus;}
   if("name" in data){const name=cleanText(data.name);if(!name)return Response.json({error:"Nome inválido."},{status:400});patch.name=name}
   await tx.update(indicatorLeads).set(patch).where(eq(indicatorLeads.id,id));
   return Response.json({updated:true},{headers:privateResponseHeaders});
  });
 }catch(error){return indicatedError(error)}
}
