import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatedClients, users } from "@/db/schema";
import { requireIndicatedClient } from "@/lib/auth";
import { ensureIndicatedSchema } from "@/lib/indicated-schema";
import { cleanPhone, cleanText, indicatedError, privateResponseHeaders, PURCHASE_URL } from "@/lib/indicated-security";

export async function GET(request:Request) {
  try {
    const user=await requireIndicatedClient(request); await ensureIndicatedSchema();
    const [row] = await getDb().select().from(indicatedClients).where(eq(indicatedClients.clientUserId,user.id)).limit(1);
    if (!row)return Response.json({error:"Indicação não encontrada."},{status:404});
    return Response.json({indication:{id:row.id,name:row.name,phone:row.phone,channel:row.channel,responsible:row.responsible,status:row.status,
      receiptUploaded:Boolean(row.receiptId),receiptSentAt:row.receiptSentAt,receiptReview:row.receiptReview,
      receiptGuidance:row.receiptReview==="REJEITADO"?row.receiptGuidance:""},purchaseUrl:PURCHASE_URL},{headers:privateResponseHeaders});
  } catch(error){return indicatedError(error);}
}
export async function PATCH(request:Request) {
  try {
    const user=await requireIndicatedClient(request);await ensureIndicatedSchema();
    const body=await request.json().catch(()=>null);
    const name=cleanText(body?.name),phone=cleanPhone(body?.phone);
    if (!name || !phone)return Response.json({error:"Informe nome e telefone válidos."},{status:400});
    return await getDb().transaction(async tx=>{
      const [indication]=await tx.select({id:indicatedClients.id}).from(indicatedClients).where(eq(indicatedClients.clientUserId,user.id)).limit(1).for("update");
      if (!indication)return Response.json({error:"Indicação não encontrada."},{status:404});
      const updatedAt=new Date().toISOString();
      await tx.update(indicatedClients).set({name,phone,updatedAt}).where(eq(indicatedClients.id,indication.id));
      await tx.update(users).set({name,phone,updatedAt}).where(eq(users.id,user.id));
      return Response.json({updated:true},{headers:privateResponseHeaders});
    });
  } catch(error){return indicatedError(error);}
}
