import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatorProfiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ensureIndicatorSchema } from "@/lib/indicator-schema";
import { issueIndicatedInvitation } from "@/lib/indicated-invitations";
import { cleanText, indicatedError, privateResponseHeaders } from "@/lib/indicator-security";
export async function POST(request:Request){
 try{
  await requireAdmin(request);await ensureIndicatorSchema();
  const data=await request.json().catch(()=>null),userId=cleanText(data?.userId,80);
  if(!userId)return Response.json({error:"Indicadora inválida."},{status:400});
  const [row]=await getDb().select({id:users.id,status:users.status,role:users.role}).from(indicatorProfiles)
  .innerJoin(users,eq(users.id,indicatorProfiles.userId)).where(eq(users.id,userId)).limit(1);
  if(!row||row.role!=="indicator"||row.status!=="active")return Response.json({error:"Indicadora não encontrada ou inativa."},{status:403});
  return Response.json(await issueIndicatedInvitation(userId),{headers:privateResponseHeaders});
 }catch(error){return indicatedError(error)}
}
