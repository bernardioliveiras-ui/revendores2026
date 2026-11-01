import { eq } from "drizzle-orm";
import { getDb, getMysqlPool } from "@/db";
import { authSessions, users } from "@/db/schema";
import { isAdminEmail, normalizeEmail, requireAdmin } from "@/lib/auth";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
import { validateResellerEdit } from "@/lib/reseller-edit-validation.mjs";
import { resellerDeletionBlockers } from "@/lib/reseller-delete-guards.mjs";
import { cleanText, indicatedError, privateResponseHeaders } from "@/lib/indicator-security";

export const runtime="nodejs";
function sameOrigin(request:Request) {
  try {
    const origin=request.headers.get("origin"),host=request.headers.get("host")||new URL(request.url).host;
    const url=new URL(origin||"");
    return url.host===host&&(url.protocol==="https:"||(url.protocol==="http:"&&/^(localhost|127\.0\.0\.1)(:|$)/.test(host)));
  } catch {return false;}
}

export async function PATCH(request:Request){
 try {
  await requireAdmin(request);
  if(!sameOrigin(request))return Response.json({error:"Origem não autorizada."},{status:403,headers:privateResponseHeaders});
  await ensureOperationalSchema();
  const data=await request.json().catch(()=>null),id=cleanText(data?.userId,80);
  if(!id||typeof data?.active!=="boolean")return Response.json({error:"Informe um revendedor e o estado do acesso."},{status:400});
  return await getDb().transaction(async tx=>{
   const [person]=await tx.select({id:users.id,role:users.role}).from(users).where(eq(users.id,id)).limit(1).for("update");
   if(!person||person.role!=="reseller")return Response.json({error:"Revendedor não encontrado."},{status:404});
   await tx.update(users).set({status:data.active?"active":"inactive",updatedAt:new Date().toISOString()}).where(eq(users.id,id));
   if(!data.active)await tx.delete(authSessions).where(eq(authSessions.userId,id));
   return Response.json({updated:true},{headers:privateResponseHeaders});
  });
 }catch(error){return indicatedError(error)}
}


/** Edição do cadastro (não edita pedidos financeiros nem permissões). */
export async function PUT(request:Request){
 try {
  const actor=await requireAdmin(request);
  if(!sameOrigin(request))return Response.json({error:"Origem não autorizada."},{status:403,headers:privateResponseHeaders});
  await ensureOperationalSchema();
  const data=await request.json().catch(()=>null),id=cleanText(data?.userId,80);
  if(!id)return Response.json({error:"Selecione um revendedor."},{status:400,headers:privateResponseHeaders});
  const result=validateResellerEdit(data,normalizeEmail,isAdminEmail);
  if(result.error)return Response.json({error:result.error},{status:400,headers:privateResponseHeaders});
  const fields=result.value!;
  try{
   const response=await getDb().transaction(async tx=>{
    const [person]=await tx.select({id:users.id,role:users.role,email:users.email}).from(users).where(eq(users.id,id)).limit(1).for("update");
    if(!person||person.role!=="reseller")return Response.json({error:"Conta de revendedor não encontrada."},{status:404,headers:privateResponseHeaders});
    await tx.update(users).set({...fields,updatedAt:new Date().toISOString()}).where(eq(users.id,id));
    if(person.email.toLowerCase()!==fields.email)await tx.delete(authSessions).where(eq(authSessions.userId,id));
    return Response.json({updated:true,loginChanged:person.email.toLowerCase()!==fields.email},{headers:privateResponseHeaders});
   });
   if(response.ok)console.info("bko_reseller_profile_updated",{actor:actor.id,userId:id,at:new Date().toISOString()});
   return response;
  }catch(error){
   if(error instanceof Error&&"code" in error&&String(error.code)==="ER_DUP_ENTRY")return Response.json({error:"Este e-mail já está em uso."},{status:409,headers:privateResponseHeaders});
   throw error;
  }
 }catch(error){return indicatedError(error)}
}

/** Conta de teste sem pedidos, estoque, vendas ou qualquer movimentação financeira. */
export async function DELETE(request:Request){
 try {
  const actor=await requireAdmin(request);
  if(!sameOrigin(request))return Response.json({error:"Origem não autorizada."},{status:403,headers:privateResponseHeaders});
  await ensureOperationalSchema();
  const data=await request.json().catch(()=>null),id=cleanText(data?.userId,80),email=normalizeEmail(data?.email);
  if(!id||!email||data?.confirm!=="EXCLUIR")return Response.json({error:"E-mail e confirmação EXCLUIR são obrigatórios."},{status:400});
  const connection=await getMysqlPool().getConnection();
  try {
   await connection.beginTransaction();
   const [found]=await connection.execute("SELECT id,email,role FROM users WHERE id=? FOR UPDATE",[id]);
   const person=(found as Array<{id:string;email:string;role:string}>)[0];
   if(!person||person.role!=="reseller"||person.email.toLowerCase()!==email){
    await connection.rollback();return Response.json({error:"Conta não é de revendedor ou o e-mail não confere."},{status:404});
   }
   const queries:Record<string,string>={
    purchases:"SELECT COUNT(*) AS n FROM purchases WHERE user_id=? OR email=?",
    profiles:"SELECT COUNT(*) AS n FROM reseller_profiles WHERE user_id=?",
    sales:"SELECT COUNT(*) AS n FROM sales WHERE user_id=?",
    stock:"SELECT COUNT(*) AS n FROM stock_movements WHERE user_id=?",
    referrals:"SELECT COUNT(*) AS n FROM affiliate_referrals WHERE user_id=?",
    cashbacks:"SELECT COUNT(*) AS n FROM affiliate_cashbacks WHERE reseller_user_id=?",
   };
   const [tables]=await connection.execute("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'");
   const existing=new Set((tables as Array<{name:string}>).map(t=>t.name));
   const names:Record<string,string>={purchases:"purchases",profiles:"reseller_profiles",sales:"sales",stock:"stock_movements",referrals:"affiliate_referrals",cashbacks:"affiliate_cashbacks"};
   const counts:Record<string,number>={};
   for(const [field,query] of Object.entries(queries)){
    if(!existing.has(names[field]))continue;
    const [result]=await connection.execute(query,field==="purchases"?[id,email]:[id]);
    counts[field]=Number((result as Array<{n:number}>)[0]?.n||0);
   }
   const blockers=resellerDeletionBlockers(counts);
   if(blockers.length){await connection.rollback();return Response.json({error:`Cadastro com ${blockers.join(", ")}. Para zerar dados comerciais de TESTE com pedidos ou estoque, execute a rotina de limpeza com backup.`,code:"HAS_HISTORY",blockers},{status:409,headers:privateResponseHeaders});}
   await connection.execute("DELETE FROM auth_sessions WHERE user_id=?",[id]);
   const [result]=await connection.execute("DELETE FROM users WHERE id=? AND role='reseller' AND email=?",[id,email]);
   if((result as {affectedRows:number}).affectedRows!==1)throw Error("A conta mudou durante a exclusão; transação revertida.");
   await connection.commit();
   console.info("bko_reseller_deleted",{actor:actor.id,userId:id,at:new Date().toISOString()});
   return Response.json({deleted:true},{headers:privateResponseHeaders});
  }catch(error){await connection.rollback().catch(()=>{});
   if(error instanceof Error && "code" in error && ["ER_ROW_IS_REFERENCED_2","ER_ROW_IS_REFERENCED"].includes(String(error.code)))return Response.json({error:"Existem outros registros vinculados. Nenhuma exclusão realizada."},{status:409});
   throw error;
  }finally{connection.release()}
 }catch(error){return indicatedError(error)}
}
