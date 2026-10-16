import { eq, sql } from "drizzle-orm";
import { getDb, getMysqlPool } from "@/db";
import { indicatorLeads } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ensureIndicatorSchema } from "@/lib/indicator-schema";
import { indicatedError, privateResponseHeaders } from "@/lib/indicator-security";
import { MAX_RECEIPT_BYTES, safeReceiptMime } from "@/lib/indicated-security";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request) {
 try{
  const user=await requireSession(request);
  if(user.role!=="indicator")throw new Error("FORBIDDEN");
  await ensureIndicatorSchema();
  const length=Number(request.headers.get("content-length")||0);
  if(length>MAX_RECEIPT_BYTES+100_000)return Response.json({error:"Arquivo acima de 8 MB."},{status:413});
  const data=await request.formData(),id=String(data.get("id")||""),file=data.get("file");
  if(!/^[0-9a-f-]{36}$/i.test(id))return Response.json({error:"Indicação inválida."},{status:400});
  if(!(file instanceof File)||file.size<1||file.size>MAX_RECEIPT_BYTES)return Response.json({error:"Envie PDF, JPG ou PNG de até 8 MB."},{status:400});
  const bytes=Buffer.from(await file.arrayBuffer()),mime=safeReceiptMime(bytes);
  if(!mime||(file.type&&file.type!==mime&&!(mime==="image/jpeg"&&file.type==="image/jpg")))return Response.json({error:"Formato inválido. Envie PDF, JPG ou PNG."},{status:400});
  const now=new Date().toISOString(),fileId=crypto.randomUUID();
  return await getDb().transaction(async tx=>{
   const [lead]=await tx.select().from(indicatorLeads).where(eq(indicatorLeads.id,id)).limit(1).for("update");
   if(!lead||lead.indicatorUserId!==user.id)return Response.json({error:"Indicação não encontrada."},{status:404});
   if(lead.receiptReview==="APROVADO"&&lead.status==="COMPROU")return Response.json({error:"Compra já aprovada pelo BKO."},{status:409});
   await tx.execute(sql`INSERT INTO indicator_receipts (id,lead_id,filename,mime_type,size_bytes,bytes,created_at) VALUES (${fileId},${id},${file.name.slice(0,255)},${mime},${bytes.length},${bytes},${now})`);
   await tx.update(indicatorLeads).set({receiptId:fileId,receiptSentAt:now,receiptReview:"PENDENTE",verificationNotes:"",reviewedAt:null,reviewedBy:null,updatedAt:now}).where(eq(indicatorLeads.id,id));
   return Response.json({uploaded:true,review:"PENDENTE"},{headers:privateResponseHeaders});
  });
 }catch(error){return indicatedError(error)}
}
export async function GET(request:Request){
 try{
  const user=await requireSession(request);await ensureIndicatorSchema();
  const id=new URL(request.url).searchParams.get("id")||"";
  if(!/^[0-9a-f-]{36}$/i.test(id))return Response.json({error:"Arquivo não encontrado."},{status:404});
  const [lead]=await getDb().select({indicatorUserId:indicatorLeads.indicatorUserId,receiptId:indicatorLeads.receiptId}).from(indicatorLeads).where(eq(indicatorLeads.id,id)).limit(1);
  if(!lead||!lead.receiptId||!(user.role==="admin"||user.role==="indicator"&&lead.indicatorUserId===user.id))return Response.json({error:"Arquivo não encontrado."},{status:404});
  const [rows]=await getMysqlPool().execute("SELECT mime_type,bytes FROM indicator_receipts WHERE id=? AND lead_id=? LIMIT 1",[lead.receiptId,id]);
  const proof=(rows as Array<{mime_type:string,bytes:Buffer}>)[0];
  if(!proof)return Response.json({error:"Arquivo não encontrado."},{status:404});
  const ext=proof.mime_type==="application/pdf"?"pdf":proof.mime_type==="image/png"?"png":"jpg";
  return new Response(new Uint8Array(proof.bytes),{headers:{...privateResponseHeaders,"content-type":proof.mime_type,"content-disposition":`attachment; filename="comprovante-${id}.${ext}"`,"content-security-policy":"sandbox"}});
 }catch(error){return indicatedError(error)}
}
