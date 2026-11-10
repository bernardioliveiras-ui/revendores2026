import { getMysqlPool } from "@/db";
import { authorizeMaterials, ensureMaterialsTable, materialError } from "@/lib/reseller-materials";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await authorizeMaterials(request);
    await ensureMaterialsTable();
    const [rows] = await getMysqlPool().query("SELECT id,title,file_name,mime_type,size_bytes,created_at FROM reseller_materials ORDER BY created_at DESC LIMIT 200");
    return Response.json({ materials: rows }, { headers: {"cache-control":"private, no-store"} });
  } catch (error) { return materialError(error); }
}
