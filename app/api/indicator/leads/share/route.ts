import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatorLeads } from "@/db/schema";
import { requireIndicator } from "@/lib/auth";
import { ensureIndicatorSchema } from "@/lib/indicator-schema";
import { cleanText, indicatedError, privateResponseHeaders } from "@/lib/indicator-security";

export const runtime="nodejs";
/** Registra apenas a intenção de abrir o compartilhamento: não prova envio/entrega pelo WhatsApp. */
export async function POST(request:Request){
 try{
  const user=await requireIndicator(request);await ensureIndicatorSchema();
  const data=await request.json().catch(()=>null),id=cleanText(data?.id,80);
  if(!id)return Response.json({error:"Indicação inválida."},{status:400});
  const db=getDb();
  const ownership=and(eq(indicatorLeads.id,id),eq(indicatorLeads.indicatorUserId,user.id));
  const [lead]=await db.select({id:indicatorLeads.id}).from(indicatorLeads).where(ownership).limit(1);
  if(!lead)return Response.json({error:"Indicação não encontrada."},{status:404});
  await db.update(indicatorLeads).set({shareAttempts:sql`share_attempts + 1`,lastSharedAt:new Date().toISOString()}).where(ownership);
  return Response.json({recorded:true,meaning:"intenção de compartilhar, envio não confirmado"},{headers:privateResponseHeaders});
 }catch(error){return indicatedError(error)}
}
