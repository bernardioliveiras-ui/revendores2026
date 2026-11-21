import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatorCampaigns, users } from "@/db/schema";
import { ensureCampaignSchema } from "@/lib/campaign-schema";

export const CAMPAIGN_COOKIE = "ln_campaign";
export const campaignPath = (code: string) => `/c/${encodeURIComponent(code)}`;
export const validCampaignCode = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
export const validCampaignSlug = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100;
export function campaignCookieFromRequest(request: Request) {
  const raw = request.headers.get("cookie") || "";
  const pair = raw.split(";").map(part=>part.trim()).find(part=>part.startsWith(`${CAMPAIGN_COOKIE}=`));
  const code = pair?.slice(CAMPAIGN_COOKIE.length+1) || "";
  return validCampaignCode(code) ? code : "";
}
export async function resolveCampaign(code: string) {
  if (!validCampaignCode(code) && !validCampaignSlug(code)) return null;
  await ensureCampaignSchema();
  const [row] = await getDb().select({id:indicatorCampaigns.id,code:indicatorCampaigns.publicCode,name:indicatorCampaigns.name})
    .from(indicatorCampaigns).innerJoin(users,eq(users.id,indicatorCampaigns.indicatorUserId))
    .where(and(eq(validCampaignCode(code) ? indicatorCampaigns.publicCode : indicatorCampaigns.publicSlug,code),eq(indicatorCampaigns.active,1),eq(users.status,"active"),eq(users.role,"indicator"))).limit(1);
  return row || null;
}
