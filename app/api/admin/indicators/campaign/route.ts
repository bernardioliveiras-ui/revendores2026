import { randomBytes } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatorCampaigns, indicatorProfiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ensureCampaignSchema } from "@/lib/campaign-schema";
import { validCampaignCashback } from "@/lib/indicator-cashback.mjs";
import { cleanText, indicatedError, privateResponseHeaders } from "@/lib/indicator-security";
export const runtime="nodejs";
export async function POST(request:Request) {
 try {
  await requireAdmin(request);await ensureCampaignSchema();
  const body=await request.json().catch(()=>null),indicatorUserId=cleanText(body?.indicatorUserId,80),name=cleanText(body?.name,120);
  if(!indicatorUserId||name.length<3)return Response.json({error:"Informe o parceiro e a campanha (mínimo 3 caracteres)."},{status:400});
  const db=getDb();
  return await db.transaction(async tx=>{
   const [owner]=await tx.select({id:users.id}).from(indicatorProfiles).innerJoin(users,eq(users.id,indicatorProfiles.userId))
    .where(and(eq(indicatorProfiles.userId,indicatorUserId),eq(users.role,"indicator"),eq(users.status,"active"))).limit(1);
   if(!owner)return Response.json({error:"Parceiro inativo ou inexistente."},{status:404});
   const [existing]=await tx.select().from(indicatorCampaigns).where(eq(indicatorCampaigns.indicatorUserId,indicatorUserId)).limit(1).for("update");
   const now=new Date().toISOString();
   if(existing){await tx.update(indicatorCampaigns).set({name,active:1,updatedAt:now}).where(eq(indicatorCampaigns.id,existing.id));
    return Response.json({saved:true,publicPath:`/c/${existing.publicCode}`,code:existing.publicCode},{headers:privateResponseHeaders});}
   const id=crypto.randomUUID(),code=randomBytes(16).toString("hex");
   await tx.insert(indicatorCampaigns).values({id,indicatorUserId,name,publicCode:code,active:1,clickCount:0,createdAt:now,updatedAt:now});
   return Response.json({saved:true,publicPath:`/c/${code}`,code},{status:201,headers:privateResponseHeaders});
  });
 }catch(error){return indicatedError(error)}
}
export async function PATCH(request:Request) {
 try{await requireAdmin(request);await ensureCampaignSchema();const body=await request.json().catch(()=>null);
  const id=cleanText(body?.id,80);
  const hasRate=Boolean(body&&typeof body==="object"&&("cashbackMode" in body || "cashbackValue" in body));
  const hasAccess=typeof body?.active==="boolean";
  if(!id||(!hasRate&&!hasAccess)|| (hasRate&&!validCampaignCashback(body.cashbackMode,body.cashbackValue)))return Response.json({error:"Informe campanha e uma regra válida de cashback."},{status:400});
  const changes:Partial<typeof indicatorCampaigns.$inferInsert>={updatedAt:new Date().toISOString()};
  if(hasAccess)changes.active=body.active?1:0;
  if(hasRate){changes.cashbackMode=body.cashbackMode;changes.cashbackValue=body.cashbackValue;}
  const [existing]=await getDb().select({id:indicatorCampaigns.id}).from(indicatorCampaigns).where(eq(indicatorCampaigns.id,id)).limit(1);
  if(!existing)return Response.json({error:"Campanha não localizada."},{status:404});
  await getDb().update(indicatorCampaigns).set(changes).where(eq(indicatorCampaigns.id,id));
  return Response.json({updated:true},{headers:privateResponseHeaders});
 }catch(error){return indicatedError(error)}
}
