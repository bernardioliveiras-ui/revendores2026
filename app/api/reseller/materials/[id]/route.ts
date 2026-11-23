import { getMysqlPool } from "@/db";
import { authorizeMaterials, ensureMaterialsTable, materialError } from "@/lib/reseller-materials";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: {params: Promise<{id:string}>}) {
  try {
    await authorizeMaterials(request);
    const {id} = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Não encontrado",{status:404});
    await ensureMaterialsTable();
    const [rows] = await getMysqlPool().execute("SELECT file_name,mime_type,file_bytes FROM reseller_materials WHERE id=? LIMIT 1",[id]);
    const result = (rows as Array<{file_name:string;mime_type:string;file_bytes:Buffer}>)[0];
    if (!result) return new Response("Não encontrado",{status:404});
    const filename = result.file_name.replace(/[\r\n"\\]/g,"_");
    return new Response(new Uint8Array(result.file_bytes),{headers:{
      "content-type":result.mime_type,"content-disposition":`${result.mime_type === "application/pdf" ? "inline" : "attachment"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(result.file_name)}`,
      "cache-control":"private, no-store","x-content-type-options":"nosniff","x-robots-tag":"noindex"
    }});
  } catch(error) { return materialError(error); }
}
