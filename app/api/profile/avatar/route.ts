import { getMysqlPool } from "@/db";
import { requireSession } from "@/lib/auth";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
import { identifyAvatar,MAX_AVATAR_BYTES } from "@/lib/user-profile-validation.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
function failed(error:unknown){if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});console.error("profile_avatar_failed",error);return Response.json({error:"Não foi possível atualizar a foto."},{status:500});}
export async function GET(request:Request){
  try{
    const user=await requireSession(request);
    const requested=new URL(request.url).searchParams.get("userId");
    if(requested&&requested!==user.id&&user.role!=="admin")return Response.json({error:"Acesso negado."},{status:403});
    if(user.role!=="reseller"&&user.role!=="indicator"&&user.role!=="admin")return Response.json({error:"Acesso negado."},{status:403});
    await ensureOperationalSchema();
    const [rows]=await getMysqlPool().execute("SELECT avatar_mime,avatar_bytes FROM user_public_profiles WHERE user_id=? LIMIT 1",[requested||user.id]);
    const row=(rows as Array<{avatar_mime:string|null;avatar_bytes:Buffer|null}>)[0];
    if(!row?.avatar_mime||!row.avatar_bytes)return new Response(null,{status:404});
    return new Response(new Uint8Array(row.avatar_bytes),{headers:{"content-type":row.avatar_mime,"cache-control":"private, no-store","x-content-type-options":"nosniff"}});
  }catch(error){return failed(error);}
}
export async function POST(request:Request){
  try{
    const user=await requireSession(request);
    if(user.role!=="reseller"&&user.role!=="indicator")return Response.json({error:"Acesso negado."},{status:403});
    const form=await request.formData();const file=form.get("photo");
    if(!(file instanceof File))return Response.json({error:"Selecione uma foto."},{status:400});
    if(file.size>MAX_AVATAR_BYTES||file.size<4)return Response.json({error:"A foto deve ter até 2 MB."},{status:400});
    const bytes=Buffer.from(await file.arrayBuffer());
    let mime:string;
    try{mime=identifyAvatar(bytes,file.type,file.size);}catch(error){return Response.json({error:error instanceof Error?error.message:"Imagem inválida."},{status:400});}
    await ensureOperationalSchema();const now=new Date().toISOString();
    await getMysqlPool().execute("INSERT INTO user_public_profiles (user_id,bio,avatar_mime,avatar_bytes,updated_at) VALUES (?,'',?,?,?) ON DUPLICATE KEY UPDATE avatar_mime=VALUES(avatar_mime),avatar_bytes=VALUES(avatar_bytes),updated_at=VALUES(updated_at)",[user.id,mime,bytes,now]);
    return Response.json({saved:true,avatarUrl:`/api/profile/avatar?v=${encodeURIComponent(now)}`});
  }catch(error){return failed(error);}
}
export async function DELETE(request:Request){
  try{
    const user=await requireSession(request);
    if(user.role!=="reseller"&&user.role!=="indicator")return Response.json({error:"Acesso negado."},{status:403});
    await ensureOperationalSchema();
    await getMysqlPool().execute("UPDATE user_public_profiles SET avatar_mime=NULL,avatar_bytes=NULL,updated_at=? WHERE user_id=?",[new Date().toISOString(),user.id]);
    return Response.json({removed:true});
  }catch(error){return failed(error);}
}
