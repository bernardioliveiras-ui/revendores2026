import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { affiliateCashbacks, affiliateReferrals } from "@/db/schema";
import { getOptionalEnv } from "@/lib/env";
import { isMysqlDuplicateKeyError } from "@/lib/mysql-errors";

function text(value: unknown, max = 180) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

/**
 * Bridge for the external mix10pro.com.br/lp-v2 checkout.
 * The LP must call this only after Asaas confirms the payment as received/confirmed.
 */
export async function POST(request: Request) {
  const expected = getOptionalEnv("AFFILIATE_WEBHOOK_TOKEN") || "";
  const received = request.headers.get("x-affiliate-token") || "";
  if (!expected || received !== expected) return Response.json({ error: "Endpoint não autorizado." }, { status: 401 });
  try {
    const body = await request.json() as { referralCode?: unknown; externalOrderId?: unknown; buyerEmail?: unknown; boxes?: unknown; paymentStatus?: unknown };
    const referralCode = text(body.referralCode, 64).toUpperCase();
    const externalOrderId = text(body.externalOrderId, 80);
    const buyerEmail = text(body.buyerEmail, 254).toLowerCase();
    const boxes = typeof body.boxes === "number" && Number.isFinite(body.boxes) ? Math.max(1, Math.floor(body.boxes)) : 1;
    if (!referralCode || !externalOrderId || body.paymentStatus !== "paid") return Response.json({ error: "Compra não qualificada." }, { status: 400 });
    const db = getDb();
    const [referral] = await db.select({ id: affiliateReferrals.id, userId: affiliateReferrals.userId }).from(affiliateReferrals).where(eq(affiliateReferrals.publicCode, referralCode)).limit(1);
    if (!referral) return Response.json({ error: "Indicação não encontrada." }, { status: 404 });
    const now = new Date().toISOString();
    const purchaseId = `external:${externalOrderId}`;
    try {
      await db.insert(affiliateCashbacks).values({ id: crypto.randomUUID(), referralId: referral.id, resellerUserId: referral.userId, purchaseId, amountCents: 1500, status: "pending", qualifyingBoxes: boxes, notes: buyerEmail ? `Compra confirmada pela LP; comprador: ${buyerEmail}` : "Compra confirmada pela LP.", createdAt: now, updatedAt: now });
    } catch (error) {
      if (isMysqlDuplicateKeyError(error)) return Response.json({ qualified: true, duplicate: true, cashbackCents: 1500 });
      throw error;
    }
    return Response.json({ qualified: true, cashbackCents: 1500 });
  } catch (error) {
    console.error("affiliate_qualification_failed", error);
    return Response.json({ error: "Não foi possível registrar a indicação." }, { status: 500 });
  }
}
