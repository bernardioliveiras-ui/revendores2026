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
import { campaignSlug } from "@/lib/campaign-slug.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
 try {
  const user=await requireIndicator(request);await requireIndicatorTerms(user.id);await ensureCampaignSchema();
  const [campaign]=await getDb().select().from(indicatorCampaigns).where(eq(indicatorCampaigns.indicatorUserId,user.id)).limit(1);
  if(!campaign)return Response.json({asaasEnvironment:getAsaasConfig().environment,campaign:null},{headers:privateResponseHeaders});
  const orders=await getDb().select({id:purchases.id,campaignId:purchases.campaignId,paymentStatus:purchases.paymentStatus,paymentMethod:purchases.paymentMethod,asaasPaymentId:purchases.asaasPaymentId,
    productTotalCents:purchases.productTotalCents,totalCents:purchases.totalCents,shippingCents:purchases.shippingCents,
    interestCents:purchases.interestCents,asaasVerifiedAt:purchases.asaasVerifiedAt,indicatorCashbackCents:purchases.indicatorCashbackCents})
    .from(purchases).where(eq(purchases.campaignId,campaign.id));
  const externalOrders=await getDb().select({campaignId:indicatorExternalOrders.campaignId,
    paymentStatus:indicatorExternalOrders.paymentStatus,productTotalCents:indicatorExternalOrders.productTotalCents,
    asaasVerifiedAt:indicatorExternalOrders.asaasVerifiedAt,indicatorCashbackCents:indicatorExternalOrders.indicatorCashbackCents})
    .from(indicatorExternalOrders).where(eq(indicatorExternalOrders.campaignId,campaign.id));
  return Response.json({asaasEnvironment:getAsaasConfig().environment,campaign:{...summarizeCampaign(campaign,[...orders,...externalOrders.map(order=>({...order,totalCents:order.productTotalCents,shippingCents:0,interestCents:0}))]),cashbackMode:campaign.cashbackMode,cashbackValue:campaign.cashbackValue,publicPath:`/c/${campaign.publicSlug||campaign.publicCode}`,salesPath:`/v/${campaign.publicSlug||campaign.publicCode}`}}, {headers:privateResponseHeaders});
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
    const base=campaignSlug(name);let slug=base;
    for(let n=2;;n++){
     const [owner]=await tx.select({id:indicatorCampaigns.id}).from(indicatorCampaigns).where(eq(indicatorCampaigns.publicSlug,slug)).limit(1);
     if(!owner||owner.id===existing.id)break;
     slug=`${base}-${n}`;
    }
    await tx.update(indicatorCampaigns).set({name,publicSlug:slug,updatedAt:now}).where(eq(indicatorCampaigns.id,existing.id));
    return Response.json({saved:true,publicPath:`/c/${slug}`,salesPath:`/v/${slug}`},{headers:privateResponseHeaders});}
   const code=randomBytes(16).toString("hex");
   const base=campaignSlug(name);let slug=base;
   for(let n=2;(await tx.select({id:indicatorCampaigns.id}).from(indicatorCampaigns).where(eq(indicatorCampaigns.publicSlug,slug)).limit(1)).length;n++)slug=`${base}-${n}`;
   await tx.insert(indicatorCampaigns).values({id:crypto.randomUUID(),indicatorUserId:user.id,
    name,publicCode:code,publicSlug:slug,active:1,clickCount:0,createdAt:now,updatedAt:now});
   return Response.json({saved:true,publicPath:`/c/${slug}`,salesPath:`/v/${slug}`},{status:201,headers:privateResponseHeaders});
  });
 }catch(error){return indicatedError(error)}
}
