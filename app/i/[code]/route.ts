import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatorLeads, users } from "@/db/schema";
import { ensureIndicatorSchema } from "@/lib/indicator-schema";
import { INDICATOR_PURCHASE_URL } from "@/lib/indicator-security";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request: Request, context: { params: Promise<{code:string}> }) {
  const {code}=await context.params;
  if(!/^[A-Za-z0-9_-]{32}$/.test(code))return new Response("Link indisponível.",{status:404});
  await ensureIndicatorSchema();
  const [eligible]=await getDb().select({id:indicatorLeads.id}).from(indicatorLeads)
    .innerJoin(users,eq(users.id,indicatorLeads.indicatorUserId))
    .where(eq(indicatorLeads.publicCode,code)).limit(1);
  // Deactivated profiles must not keep working as a sales channel.
  if(!eligible)return new Response("Link indisponível.",{status:404});
  const [owner]=await getDb().select({status:users.status,role:users.role}).from(users)
    .innerJoin(indicatorLeads,eq(indicatorLeads.indicatorUserId,users.id))
    .where(eq(indicatorLeads.publicCode,code)).limit(1);
  if(owner?.status!=="active"||owner.role!=="indicator")return new Response("Link indisponível.",{status:404});
  const now=new Date().toISOString();
  await getDb().update(indicatorLeads).set({clickCount:sql`click_count + 1`,lastClickedAt:now,
    status:sql`CASE WHEN status = 'LINK GERADO' THEN 'ENTROU NO LINK' ELSE status END`,updatedAt:now})
   .where(eq(indicatorLeads.publicCode,code));
  return new Response(null,{status:302,headers:{location:INDICATOR_PURCHASE_URL,'cache-control':'no-store',"referrer-policy":"no-referrer"}});
}
