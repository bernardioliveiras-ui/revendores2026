import { getMysqlPool } from "@/db";
import { requireIndicator } from "@/lib/auth";
import { indicatedError, privateResponseHeaders } from "@/lib/indicator-security";
import { INDICATOR_TERMS, INDICATOR_TERMS_TITLE, INDICATOR_TERMS_VERSION, INDICATOR_CASHBACK_NOTICE, indicatorTermsPlainText } from "@/lib/indicator-terms";
import { currentTermsHash, ensureIndicatorTermsSchema, findTermsAcceptance } from "@/lib/indicator-terms-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={...privateResponseHeaders,"x-content-type-options":"nosniff"};
export async function GET(request:Request){
 try{const user=await requireIndicator(request);const record=await findTermsAcceptance(user.id);
  return Response.json({title:INDICATOR_TERMS_TITLE,version:INDICATOR_TERMS_VERSION,sha256:currentTermsHash(),sections:INDICATOR_TERMS,cashbackNotice:INDICATOR_CASHBACK_NOTICE,accepted:Boolean(record),acceptedAt:record?.acceptedAt||null},{headers});
 }catch(e){return indicatedError(e)}
}
export async function POST(request:Request){
 try{
  const user=await requireIndicator(request);
  // Browser mutation must come from this application's origin.
  const origin=request.headers.get("origin");
  const expectedHost=request.headers.get("host")||new URL(request.url).host;
  let sameOrigin=false;
  try{const parsed=new URL(origin||"");sameOrigin=parsed.host===expectedHost&&(parsed.protocol==="https:" || (parsed.protocol==="http:" && /^localhost(?::|$)|^127\.0\.0\.1(?::|$)/.test(expectedHost)))}catch{}
  if(!sameOrigin)return Response.json({error:"Origem de solicitação inválida."},{status:403,headers});
  const body=await request.json().catch(()=>null);
  if(body?.accepted!==true || body?.version!==INDICATOR_TERMS_VERSION || body?.sha256!==currentTermsHash())return Response.json({error:"Leia e aceite a versão atual do termo."},{status:400,headers});
  await ensureIndicatorTermsSchema();
  const now=new Date().toISOString();
  const ip=(request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]||"").trim().slice(0,64)||null;
  const agent=request.headers.get("user-agent")?.slice(0,512)||null;
  await getMysqlPool().execute(`INSERT INTO indicator_terms_acceptances (id,user_id,terms_version,terms_sha256,terms_snapshot,accepted_at,ip_address,user_agent)
   VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id`,[crypto.randomUUID(),user.id,INDICATOR_TERMS_VERSION,currentTermsHash(),indicatorTermsPlainText(),now,ip,agent]);
  const record=await findTermsAcceptance(user.id);
  if(!record)return Response.json({error:"Documento alterado: publique uma nova versão do termo antes de solicitar outro aceite."},{status:409,headers});
  return Response.json({accepted:true,version:INDICATOR_TERMS_VERSION,acceptedAt:record.acceptedAt},{headers});
 }catch(e){return indicatedError(e)}
}
