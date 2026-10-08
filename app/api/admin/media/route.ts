import { randomUUID } from "node:crypto";
import { getMysqlPool } from "@/db";
import { requireAdmin } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function ensure() {
  await getMysqlPool().query(`CREATE TABLE IF NOT EXISTS \`media_assets\` (
    \`id\` varchar(80) NOT NULL, \`name\` varchar(255) NOT NULL, \`mime_type\` varchar(120) NOT NULL,
    \`bytes\` longblob NOT NULL, \`size_bytes\` int NOT NULL, \`created_at\` varchar(40) NOT NULL,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}
export async function GET(request: Request) {
  try { await requireAdmin(request); await ensure(); const [rows] = await getMysqlPool().query("SELECT id,name,mime_type,size_bytes,created_at FROM media_assets ORDER BY created_at DESC LIMIT 200"); return Response.json({assets:rows},{headers:{"cache-control":"no-store"}}); }
  catch (error) { const m=error instanceof Error?error.message:""; return Response.json({error:m==="UNAUTHORIZED"?"Faça login novamente.":m==="FORBIDDEN"?"Acesso restrito ao BKO.":"Não foi possível listar a mídia."},{status:m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500}); }
}
export async function POST(request: Request) {
  try {
    await requireAdmin(request); await ensure();
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File)) return Response.json({error:"Selecione uma imagem ou vídeo."},{status:400});
    const isImage=file.type.startsWith("image/");
    const isVideo=["video/mp4","video/webm","video/ogg"].includes(file.type);
    if (!isImage&&!isVideo) return Response.json({error:"Envie uma imagem ou vídeo MP4/WebM/Ogg."},{status:400});
    const max=isImage?8*1024*1024:12*1024*1024;
    if (file.size > max) return Response.json({error:isImage?"A imagem deve ter no máximo 8 MB.":"O vídeo enviado ao servidor deve ter no máximo 12 MB. Para arquivos maiores, use um link do YouTube, Vimeo ou MP4 hospedado."},{status:400});
    const id=randomUUID(); const bytes=Buffer.from(await file.arrayBuffer());
    await getMysqlPool().execute("INSERT INTO media_assets (id,name,mime_type,bytes,size_bytes,created_at) VALUES (?,?,?,?,?,?)",[id,file.name.slice(0,255),file.type,bytes,file.size,new Date().toISOString()]);
    return Response.json({id,name:file.name,mimeType:file.type,sizeBytes:file.size,url:`/api/media/${id}`,kind:isVideo?"video":"image"});
  } catch (error) { const m=error instanceof Error?error.message:""; return Response.json({error:m==="UNAUTHORIZED"?"Faça login novamente.":m==="FORBIDDEN"?"Acesso restrito ao BKO.":"Não foi possível enviar a mídia."},{status:m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500}); }
}
