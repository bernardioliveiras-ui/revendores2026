import { randomUUID } from "node:crypto";
import { getMysqlPool } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ensureMaterialsTable, ensureManualPdfTable, getManualPdfMetadata, materialError } from "@/lib/reseller-materials";
import { validateMaterialUpload } from "@/lib/material-file-validation.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: Request) {
  try {
    const origin = request.headers.get("origin"), host = request.headers.get("host") || new URL(request.url).host;
    const url = new URL(origin || "");
    return url.host === host && (url.protocol === "https:" || (url.protocol === "http:" && /^(localhost|127\.0\.0\.1)(:|$)/.test(host)));
  } catch { return false; }
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const manual = await getManualPdfMetadata();
    return Response.json({manual},{headers:{"cache-control":"private, no-store"}});
  } catch(error) { return materialError(error); }
}

export async function PUT(request: Request) {
  try {
    const actor = await requireAdmin(request);
    if (!sameOrigin(request)) return Response.json({error:"Origem não autorizada."},{status:403});
    const data = await request.formData();
    const id = String(data.get("id") || "").trim();
    const title = String(data.get("title") || "").trim().slice(0,180);
    const kind = String(data.get("kind") || "");
    const file = data.get("file");
    if (!title) return Response.json({error:"Informe o título do material."},{status:400});
    if (kind !== "manual" && !/^[0-9a-f-]{36}$/i.test(id)) return Response.json({error:"Material inválido."},{status:400});
    // Um input sem escolha tem nome vazio; um arquivo nomeado com zero bytes é inválido.
    if (file instanceof File && file.size === 0 && file.name) return Response.json({error:"O arquivo selecionado está vazio."},{status:400});
    const providedFile = file instanceof File && file.size > 0 ? file : null;
    if (kind === "manual" && !providedFile) return Response.json({error:"Escolha o PDF para substituir o Manual do Revendedor."},{status:400});
    let bytes: Buffer | null = null;
    if (providedFile) {
      if (providedFile.size > 20*1024*1024) return Response.json({error:"Arquivo acima de 20 MB."},{status:400});
      bytes = Buffer.from(await providedFile.arrayBuffer());
      const error = validateMaterialUpload(providedFile, bytes);
      if (error) return Response.json({error},{status:400});
    }
    const pool = getMysqlPool();
    if (kind === "manual") {
      if (!providedFile || !bytes || providedFile.type !== "application/pdf") return Response.json({error:"O manual deve ser um PDF válido."},{status:400});
      await ensureManualPdfTable();
      await pool.execute(`INSERT INTO bko_manual_pdfs (id,title,file_name,size_bytes,file_bytes,updated_by,updated_at)
        VALUES (1,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),file_name=VALUES(file_name),size_bytes=VALUES(size_bytes),file_bytes=VALUES(file_bytes),updated_by=VALUES(updated_by),updated_at=VALUES(updated_at)`,
      [title,providedFile.name.slice(0,255),bytes.byteLength,bytes,actor.id,new Date().toISOString()]);
      console.info("bko_manual_pdf_replaced",{actorId:actor.id,bytes:bytes.byteLength});
      return Response.json({updated:true,url:"/api/reseller/manual?edition=material"},{headers:{"cache-control":"no-store"}});
    }
    await ensureMaterialsTable();
    const [rows] = await pool.execute("SELECT id FROM reseller_materials WHERE id=? LIMIT 1",[id]);
    if (!(rows as Array<{id:string}>).length) return Response.json({error:"Material não encontrado."},{status:404});
    if (bytes && providedFile) {
      await pool.execute("UPDATE reseller_materials SET title=?,file_name=?,mime_type=?,size_bytes=?,file_bytes=? WHERE id=?",[title,providedFile.name.slice(0,255),providedFile.type,bytes.byteLength,bytes,id]);
    } else {
      await pool.execute("UPDATE reseller_materials SET title=? WHERE id=?",[title,id]);
    }
    return Response.json({updated:true,url:`/api/reseller/materials/${id}`},{headers:{"cache-control":"no-store"}});
  } catch(error) { return materialError(error); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    if (!sameOrigin(request)) return Response.json({error:"Origem não autorizada."},{status:403});
    const data = await request.formData();
    const file = data.get("file");
    const title = String(data.get("title") || "").trim().slice(0,180);
    if (!(file instanceof File) || !title || !file.size || file.size > 20*1024*1024)
      return Response.json({error:"Informe título e arquivo JPG, PNG, WebP, GIF, PDF ou MP4/WebM de até 20 MB."},{status:400});
    const bytes = Buffer.from(await file.arrayBuffer());
    const validationError = validateMaterialUpload(file, bytes);
    if (validationError) return Response.json({error:validationError},{status:400});
    await ensureMaterialsTable();
    await getMysqlPool().execute("INSERT INTO reseller_materials (id,title,file_name,mime_type,size_bytes,file_bytes,created_at) VALUES (?,?,?,?,?,?,?)",[
      randomUUID(), title, file.name.slice(0,255), file.type, file.size, bytes, new Date().toISOString()
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
