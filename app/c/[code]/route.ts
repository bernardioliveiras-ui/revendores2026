import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatorCampaigns } from "@/db/schema";
import { CAMPAIGN_COOKIE, resolveCampaign } from "@/lib/campaigns";
import { INDICATOR_PURCHASE_URL } from "@/lib/indicator-security";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request, context:{params:Promise<{code:string}>}) {
  const {code}=await context.params;
  const campaign=await resolveCampaign(code);
  if(!campaign)return new Response("Campanha indisponível.",{status:404,headers:{"cache-control":"no-store"}});
  await getDb().update(indicatorCampaigns).set({clickCount:sql`click_count + 1`}).where(eq(indicatorCampaigns.id,campaign.id));
  const target=new URL(INDICATOR_PURCHASE_URL);
  target.searchParams.set("campanha",code);
  // Parâmetro na URL atravessa domínios; cookie cobre navegação no mesmo domínio.
  const secure=new URL(request.url).protocol==="https:" ? "; Secure" : "";
  return new Response(null,{status:302,headers:{
    location:target.toString(),"cache-control":"no-store","referrer-policy":"strict-origin-when-cross-origin",
    "set-cookie":`${CAMPAIGN_COOKIE}=${code}; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax${secure}`,
  }});
}
