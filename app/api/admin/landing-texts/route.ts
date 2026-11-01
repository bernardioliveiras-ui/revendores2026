import { requireAdmin } from "@/lib/auth";
import { getSiteUrl } from "@/lib/seo";
import { LandingTextError } from "@/lib/landing-texts";
import { readLandingTextDocument,writeLandingTextDocument } from "@/lib/landing-texts-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function authorize(request:Request,mutation=false){
  const user=await requireAdmin(request);
  if(user.mustChangePassword)throw new LandingTextError("Troque a senha inicial antes de usar o Studio.",403);
  if(mutation){
    const origin=request.headers.get("origin");
    if(request.headers.get("x-landing-studio")!=="1"||(origin&&![new URL(request.url).origin,getSiteUrl()].includes(origin)))throw new LandingTextError("Origem da edição não permitida.",403);
  }
}
function fail(error:unknown){
  const msg=error instanceof Error?error.message:"";
  if(msg==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});
  if(msg==="FORBIDDEN")return Response.json({error:"Acesso restrito ao BKO."},{status:403});
  if(error instanceof LandingTextError)return Response.json({error:error.message},{status:error.status});
  return Response.json({error:"Não foi possível acessar os textos. Confira a conexão com o banco."},{status:503});
}
export async function GET(request:Request){try{await authorize(request);return Response.json(await readLandingTextDocument(),{headers:{"cache-control":"private, no-store"}});}catch(error){return fail(error);}}
export async function PUT(request:Request){try{
  await authorize(request,true);
  if(!request.headers.get("content-type")?.startsWith("application/json"))throw new LandingTextError("Formato inválido.",415);
  if(Number(request.headers.get("content-length")||0)>180000)throw new LandingTextError("Conteúdo muito grande.",413);
  if(!request.body)throw new LandingTextError("Conteúdo inválido.");
  const reader=request.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>180000){await reader.cancel();throw new LandingTextError("Conteúdo muito grande.",413);}chunks.push(value);}}finally{reader.releaseLock();}
  let body;try{body=JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch{throw new LandingTextError("Conteúdo inválido.");}
  if(!body||typeof body!=="object"||Array.isArray(body)||typeof body.revision!=="string"||typeof body.publish!=="boolean")throw new LandingTextError("Rascunho inválido.");
  return Response.json(await writeLandingTextDocument(body.texts,body.revision,body.publish),{headers:{"cache-control":"private, no-store"}});
}catch(error){return fail(error);}}
