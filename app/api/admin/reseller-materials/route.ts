import { randomUUID } from "node:crypto";
import { getMysqlPool } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ensureMaterialsTable, materialError } from "@/lib/reseller-materials";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const allowed = new Set(["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/webm","application/pdf"]);
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const data = await request.formData();
    const file = data.get("file");
    const title = String(data.get("title") || "").trim().slice(0,180);
    if (!(file instanceof File) || !title || !allowed.has(file.type) || !file.size || file.size > 20*1024*1024)
      return Response.json({error:"Informe título e arquivo JPG, PNG, WebP, GIF, PDF ou MP4/WebM de até 20 MB."},{status:400});
    await ensureMaterialsTable();
    await getMysqlPool().execute("INSERT INTO reseller_materials (id,title,file_name,mime_type,size_bytes,file_bytes,created_at) VALUES (?,?,?,?,?,?,?)",[
      randomUUID(), title, file.name.slice(0,255), file.type, file.size, Buffer.from(await file.arrayBuffer()), new Date().toISOString()
    ]);
    return Response.json({ok:true});
  } catch(error) { return materialError(error); }
}
export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(()=>null);
    if (!body || typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) return Response.json({error:"Arquivo inválido."},{status:400});
    await ensureMaterialsTable();
    await getMysqlPool().execute("DELETE FROM reseller_materials WHERE id=?",[body.id]);
    return Response.json({ok:true});
  } catch(error) { return materialError(error); }
}
