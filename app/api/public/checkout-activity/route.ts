import { getMysqlPool } from "@/db";
import { resolveCampaign } from "@/lib/campaigns";
import { ensureCheckoutActivity } from "@/lib/checkout-activity";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Origem inválida." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || !/^[0-9a-f-]{36}$/.test(body.id || "") || !["visit", "start", "contact"].includes(body.event)) {
    return Response.json({ error: "Evento inválido." }, { status: 400 });
  }
  const campaign = await resolveCampaign(body.code);
  if (!campaign) return Response.json({ error: "Campanha indisponível." }, { status: 404 });
  await ensureCheckoutActivity();
  const now = new Date().toISOString();
  const started = body.event === "visit" ? null : now;
  const name = body.event === "contact" && typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const phone = body.event === "contact" && typeof body.phone === "string" ? body.phone.replace(/\D/g, "").slice(0, 15) : "";
  const validPhone = /^\d{10,13}$/.test(phone) ? phone : "";
  await getMysqlPool().execute(`INSERT INTO checkout_activity
    (id,campaign_id,name,phone,started_at,last_seen_at,created_at)
    VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
    started_at=IF(campaign_id=VALUES(campaign_id),COALESCE(started_at,VALUES(started_at)),started_at),
    last_seen_at=IF(campaign_id=VALUES(campaign_id),VALUES(last_seen_at),last_seen_at),
    name=IF(campaign_id=VALUES(campaign_id) AND VALUES(name)<>'',VALUES(name),name),
    phone=IF(campaign_id=VALUES(campaign_id) AND VALUES(phone)<>'',VALUES(phone),phone)`,
    [body.id,campaign.id,name,validPhone,started,now,now]);
  return Response.json({ recorded: true }, { headers: { "cache-control": "no-store" } });
}
