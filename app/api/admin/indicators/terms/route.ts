import { getMysqlPool } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ensureIndicatorTermsSchema } from "@/lib/indicator-terms-store";
import { INDICATOR_TERMS_VERSION } from "@/lib/indicator-terms";
import { indicatedError, privateResponseHeaders } from "@/lib/indicator-security";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  await requireAdmin(request);
  const userId=new URL(request.url).searchParams.get("userId")||"";
  if(!/^[a-z0-9-]{30,80}$/i.test(userId))return Response.json({error:"Usuário inválido."},{status:400,headers:privateResponseHeaders});
  await ensureIndicatorTermsSchema();
  const [rows]=await getMysqlPool().execute("SELECT id,terms_version AS version,terms_sha256 AS sha256,terms_snapshot AS termsSnapshot,accepted_at AS acceptedAt,ip_address AS ipAddress,user_agent AS userAgent FROM indicator_terms_acceptances WHERE user_id=? ORDER BY accepted_at DESC LIMIT 30",[userId]);
  return Response.json({version:INDICATOR_TERMS_VERSION,events:rows},{headers:privateResponseHeaders});
 }catch(e){return indicatedError(e)}
}
