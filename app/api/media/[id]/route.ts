import { getMysqlPool } from "@/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{id:string}> }) {
  const {id}=await context.params;
  try {
    const [rows]=await getMysqlPool().execute("SELECT mime_type,bytes FROM media_assets WHERE id=? LIMIT 1",[id]);
    const row=(rows as Array<{mime_type:string;bytes:Buffer}>)[0];
    if(!row) return new Response("Not found",{status:404});
    return new Response(new Uint8Array(row.bytes),{headers:{"content-type":row.mime_type,"cache-control":"public, max-age=31536000, immutable"}});
  } catch { return new Response("Not found",{status:404}); }
}
