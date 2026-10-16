import { eq, sql } from "drizzle-orm";
import { getDb, getMysqlPool } from "@/db";
import { indicatedClients } from "@/db/schema";
import { requireIndicatedClient, requireSession } from "@/lib/auth";
import { ensureIndicatedSchema } from "@/lib/indicated-schema";
import { clientOwnsIndication, indicatedError, MAX_RECEIPT_BYTES, privateResponseHeaders, safeReceiptMime } from "@/lib/indicated-security";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request) {
  try {
    const client=await requireIndicatedClient(request);await ensureIndicatedSchema();
    const length=Number(request.headers.get("content-length")||0);
    if (length > MAX_RECEIPT_BYTES+100_000) return Response.json({error:"O arquivo deve ter até 8 MB."},{status:413});
    const data=await request.formData(); const file=data.get("file");
    if (!(file instanceof File) || file.size<=0 || file.size>MAX_RECEIPT_BYTES) return Response.json({error:"Envie um arquivo PDF, JPG ou PNG com no máximo 8 MB."},{status:400});
    const bytes=Buffer.from(await file.arrayBuffer());const mime=safeReceiptMime(bytes);
    if (!mime || (file.type && file.type!==mime && !(mime==="image/jpeg" && file.type==="image/jpg"))) return Response.json({error:"Formato inválido. Envie PDF, JPG ou PNG."},{status:400});
    const now=new Date().toISOString();const id=crypto.randomUUID();
    return await getDb().transaction(async tx=>{
      const [row]=await tx.select().from(indicatedClients).where(eq(indicatedClients.clientUserId,client.id)).limit(1).for("update");
      if(!row)return Response.json({error:"Indicação não encontrada."},{status:404});
      if (row.status==="COMPROU" && row.receiptReview==="APROVADO") return Response.json({error:"Comprovante já aprovado. Solicite orientação ao BKO."},{status:409});
      // Preserve older submissions as audit history; only the most recent receipt is downloadable.
      await tx.execute(sql`INSERT INTO indicated_receipts (id,indication_id,filename,mime_type,size_bytes,bytes,created_at) VALUES (${id},${row.id},${file.name.slice(0,255)},${mime},${bytes.length},${bytes},${now})`);
      await tx.update(indicatedClients).set({receiptId:id,receiptSentAt:now,receiptReview:"PENDENTE",receiptGuidance:"",reviewedBy:null,reviewedAt:null,updatedAt:now}).where(eq(indicatedClients.id,row.id));
      return Response.json({uploaded:true,receiptSentAt:now,receiptReview:"PENDENTE"},{headers:privateResponseHeaders});
    });
  } catch(error){return indicatedError(error);}
}
export async function GET(request:Request) {
  try {
    const user=await requireSession(request);await ensureIndicatedSchema();
    const id=new URL(request.url).searchParams.get("id")||"";
    if (!/^[0-9a-f-]{36}$/i.test(id))return Response.json({error:"Arquivo não encontrado."},{status:404});
    const [row]=await getDb().select({clientUserId:indicatedClients.clientUserId,receiptId:indicatedClients.receiptId}).from(indicatedClients).where(eq(indicatedClients.id,id)).limit(1);
    if(!row || !row.receiptId || !(user.role==="admin" || clientOwnsIndication(user.role,user.id,row.clientUserId)))return Response.json({error:"Arquivo não encontrado."},{status:404});
    const [files]=await getMysqlPool().execute("SELECT mime_type,filename,bytes FROM indicated_receipts WHERE id=? AND indication_id=? LIMIT 1",[row.receiptId,id]);
    const asset=(files as Array<{mime_type:string;filename:string;bytes:Buffer}>)[0];
    if(!asset)return Response.json({error:"Arquivo não encontrado."},{status:404});
    const extension=asset.mime_type==="application/pdf"?"pdf":asset.mime_type==="image/png"?"png":"jpg";
    return new Response(new Uint8Array(asset.bytes),{headers:{...privateResponseHeaders,"content-type":asset.mime_type,
      "content-disposition":`attachment; filename="comprovante-${id}.${extension}"`,"content-security-policy":"sandbox"}});
  } catch(error){return indicatedError(error);}
}
