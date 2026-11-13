import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatorCampaigns } from "@/db/schema";
import { resolveCampaign } from "@/lib/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attributionKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "fbclid", "gclid", "ttclid"];
const headers = { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" };

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const campaign = await resolveCampaign(code);
  if (!campaign) return new Response("Campanha indisponível.", { status: 404, headers });

  const query = new URLSearchParams({ venda: code });
  const incoming = new URL(request.url).searchParams;
  for (const key of attributionKeys) {
    const value = incoming.get(key);
    if (value) query.set(key, value.slice(0, 500));
  }
  await getDb().update(indicatorCampaigns)
    .set({ clickCount: sql`click_count + 1` }).where(eq(indicatorCampaigns.id, campaign.id));
  return new Response(null, { status: 302, headers: { ...headers, location: `/comprar?${query}` } });
}
