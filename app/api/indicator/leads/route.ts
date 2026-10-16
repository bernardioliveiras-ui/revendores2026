import { desc, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "@/db";
import { indicatorLeads, indicatorProfiles } from "@/db/schema";
import { requireIndicator } from "@/lib/auth";
import { ensureIndicatorSchema } from "@/lib/indicator-schema";
import { cleanPhone, cleanText, indicatedError, indicatorLink, privateResponseHeaders } from "@/lib/indicator-security";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const user=await requireIndicator(request);await ensureIndicatorSchema();
  const leads=await getDb().select().from(indicatorLeads).where(eq(indicatorLeads.indicatorUserId,user.id)).orderBy(desc(indicatorLeads.createdAt));
  return Response.json({leads:leads.map(row=>({id:row.id,name:row.name,phone:row.phone,channel:row.channel,status:row.status,clickCount:row.clickCount,createdAt:row.createdAt,publicPath:indicatorLink(row.publicCode),receiptSentAt:row.receiptSentAt,receiptReview:row.receiptReview,hasReceipt:!!row.receiptId,receiptGuidance:row.verificationNotes,cashbackCents:row.cashbackCents,cashbackStatus:row.cashbackStatus}))},{headers:privateResponseHeaders});
 }catch(error){return indicatedError(error)}
}
export async function POST(request:Request){
 try{
  const user=await requireIndicator(request);await ensureIndicatorSchema();
  const data=await request.json().catch(()=>null);
  const name=cleanText(data?.name),phone=cleanPhone(data?.phone),channel=cleanText(data?.channel)||"WhatsApp";
  if(!name||!phone)return Response.json({error:"Informe nome e telefone do comprador."},{status:400});
  const [profile]=await getDb().select({userId:indicatorProfiles.userId}).from(indicatorProfiles).where(eq(indicatorProfiles.userId,user.id)).limit(1);
  if(!profile)return Response.json({error:"Indicador não habilitado."},{status:403});
  const now=new Date().toISOString(),id=crypto.randomUUID(),publicCode=randomBytes(24).toString("base64url");
  await getDb().insert(indicatorLeads).values({id,indicatorUserId:user.id,publicCode,name,phone,channel,status:"LINK GERADO",clickCount:0,cashbackStatus:"PENDENTE",createdAt:now,updatedAt:now});
  return Response.json({created:true,id,publicPath:indicatorLink(publicCode)},{status:201,headers:privateResponseHeaders});
 }catch(error){return indicatedError(error)}
}
