import { getMysqlPool } from "@/db";
import { requireSession } from "@/lib/auth";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
import { validateBio } from "@/lib/user-profile-validation.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
function errorResponse(error:unknown){if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});console.error("profile_failed",error);return Response.json({error:"Não foi possível carregar ou atualizar o perfil."},{status:500});}
export async function GET(request:Request){
  try{
    const user=await requireSession(request);
    if(!["reseller","indicator"].includes(user.role))return Response.json({error:"Perfil indisponível."},{status:403});
    await ensureOperationalSchema();
    const [rows]=await getMysqlPool().execute("SELECT bio,avatar_mime,updated_at FROM user_public_profiles WHERE user_id=? LIMIT 1",[user.id]);
    const row=(rows as Array<{bio:string;avatar_mime:string|null;updated_at:string}>)[0];
    return Response.json({bio:row?.bio||"",avatarUrl:row?.avatar_mime?`/api/profile/avatar?v=${encodeURIComponent(row.updated_at)}`:null},{headers:{"cache-control":"no-store"}});
  }catch(error){return errorResponse(error);}
}
export async function PATCH(request:Request){
  try{
    const user=await requireSession(request);
    if(!["reseller","indicator"].includes(user.role))return Response.json({error:"Perfil indisponível."},{status:403});
    const body=await request.json().catch(()=>null);
    let bio:string;
    try{bio=validateBio(body?.bio);}catch(error){return Response.json({error:error instanceof Error?error.message:"Biografia inválida."},{status:400});}
    await ensureOperationalSchema();
    await getMysqlPool().execute("INSERT INTO user_public_profiles (user_id,bio,updated_at) VALUES (?,?,?) ON DUPLICATE KEY UPDATE bio=VALUES(bio),updated_at=VALUES(updated_at)",[user.id,bio,new Date().toISOString()]);
    return Response.json({saved:true,bio});
  }catch(error){return errorResponse(error);}
}
