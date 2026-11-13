import { getAsaasConfig } from "@/lib/asaas";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatorCampaigns, indicatorExternalOrders, purchases } from "@/db/schema";
import { requireIndicator } from "@/lib/auth";
import { requireIndicatorTerms } from "@/lib/indicator-terms-store";
import { ensureCampaignSchema } from "@/lib/campaign-schema";
import { cleanText, indicatedError, privateResponseHeaders } from "@/lib/indicator-security";
import { summarizeCampaign } from "@/lib/campaign-metrics.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
 try {
  const user=await requireIndicator(request);await requireIndicatorTerms(user.id);await ensureCampaignSchema();
  const [campaign]=await getDb().select().from(indicatorCampaigns).where(eq(indicatorCampaigns.indicatorUserId,user.id)).limit(1);
  if(!campaign)return Response.json({asaasEnvironment:getAsaasConfig().environment,campaign:null},{headers:privateResponseHeaders});
  const orders=await getDb().select({id:purchases.id,campaignId:purchases.campaignId,paymentStatus:purchases.paymentStatus,
    productTotalCents:purchases.productTotalCents,totalCents:purchases.totalCents,shippingCents:purchases.shippingCents,
    interestCents:purchases.interestCents,asaasVerifiedAt:purchases.asaasVerifiedAt,indicatorCashbackCents:purchases.indicatorCashbackCents})
    .from(purchases).where(eq(purchases.campaignId,campaign.id));
  const externalOrders=await getDb().select({campaignId:indicatorExternalOrders.campaignId,
    paymentStatus:indicatorExternalOrders.paymentStatus,productTotalCents:indicatorExternalOrders.productTotalCents,
    asaasVerifiedAt:indicatorExternalOrders.asaasVerifiedAt,indicatorCashbackCents:indicatorExternalOrders.indicatorCashbackCents})
    .from(indicatorExternalOrders).where(eq(indicatorExternalOrders.campaignId,campaign.id));
  return Response.json({asaasEnvironment:getAsaasConfig().environment,campaign:{...summarizeCampaign(campaign,[...orders,...externalOrders.map(order=>({...order,totalCents:order.productTotalCents,shippingCents:0,interestCents:0}))]),cashbackMode:campaign.cashbackMode,cashbackValue:campaign.cashbackValue,publicPath:`/c/${campaign.publicCode}`}}, {headers:privateResponseHeaders});
 }catch(error){return indicatedError(error)}
}
export async function POST(request:Request) {
 try {
  const user=await requireIndicator(request);await requireIndicatorTerms(user.id);await ensureCampaignSchema();
  const body=await request.json().catch(()=>null),name=cleanText(body?.name,120);
  if(name.length<3)return Response.json({error:"Informe uma campanha com pelo menos 3 letras."},{status:400});
  const db=getDb();
  return await db.transaction(async tx=>{
   const [existing]=await tx.select().from(indicatorCampaigns).where(eq(indicatorCampaigns.indicatorUserId,user.id)).limit(1).for("update");
   const now=new Date().toISOString();
   if(existing){if(!existing.active)return Response.json({error:"Campanha pausada pelo BKO."},{status:403});
    await tx.update(indicatorCampaigns).set({name,updatedAt:now}).where(eq(indicatorCampaigns.id,existing.id));
    return Response.json({saved:true,publicPath:`/c/${existing.publicCode}`},{headers:privateResponseHeaders});}
   const code=randomBytes(16).toString("hex");
   await tx.insert(indicatorCampaigns).values({id:crypto.randomUUID(),indicatorUserId:user.id,
    name,publicCode:code,active:1,clickCount:0,createdAt:now,updatedAt:now});
   return Response.json({saved:true,publicPath:`/c/${code}`},{status:201,headers:privateResponseHeaders});
  });
 }catch(error){return indicatedError(error)}
}
