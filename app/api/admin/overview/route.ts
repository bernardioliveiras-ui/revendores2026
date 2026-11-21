import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { affiliateReferrals, purchases, sales, stockMovements, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { repairPaidPurchaseStockForAllResellers } from "@/lib/stock-repair";

import { ensureOperationalSchema } from "@/lib/runtime-schema";
function signed(type: string, boxes: number) { if (type === "entry" || type === "adjustment_in") return boxes; if (type === "sale" || type === "adjustment_out") return -boxes; return 0; }

const purchaseFields = {
  id: purchases.id, orderNumber: purchases.orderNumber, name: purchases.name, email: purchases.email, phone: purchases.phone, cpfCnpj: purchases.cpfCnpj,
  postalCode: purchases.postalCode, street: purchases.street, number: purchases.number, complement: purchases.complement, district: purchases.district, city: purchases.city, state: purchases.state,
  kit: purchases.kit, boxes: purchases.boxes, totalCents: purchases.totalCents, productTotalCents:purchases.productTotalCents, shippingCents:purchases.shippingCents, interestCents:purchases.interestCents, asaasVerifiedAt:purchases.asaasVerifiedAt, campaignId:purchases.campaignId, paymentStatus: purchases.paymentStatus, shippingStatus: purchases.shippingStatus,
  carrier: purchases.carrier, postalEvent: purchases.postalEvent, postalEventAt: purchases.postalEventAt, postalCheckedAt: purchases.postalCheckedAt, postalAttemptAt: purchases.postalAttemptAt, postalIssue: purchases.postalIssue, trackingCode: purchases.trackingCode, accessReleasedAt: purchases.accessReleasedAt, userId: purchases.userId, welcomeStatus: purchases.welcomeStatus, createdAt: purchases.createdAt,
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    await ensureOperationalSchema();
    await repairPaidPurchaseStockForAllResellers();
    const db = getDb();
    const [purchaseRows, userRows, saleRows, stockRows] = await Promise.all([
      db.select(purchaseFields).from(purchases).orderBy(desc(purchases.createdAt)),
      db.select().from(users),
      db.select().from(sales).orderBy(desc(sales.soldAt)),
      db.select().from(stockMovements),
    ]);
    let referralRows: Array<typeof affiliateReferrals.$inferSelect> = [];
    try { referralRows = await db.select().from(affiliateReferrals); } catch (error) { console.error("admin_referrals_optional_failed", error); referralRows = []; }
    const paid = purchaseRows.filter((p) => p.paymentStatus === "paid");
    const asaasVerified = paid.filter(p=>!!p.asaasVerifiedAt);
    const stockByUser = new Map<string, number>();
    for (const row of stockRows) stockByUser.set(row.userId, (stockByUser.get(row.userId) || 0) + signed(row.type, row.boxes));
    const soldByUser = new Map<string, number>();
    const grossByUser = new Map<string, number>();
    for (const row of saleRows) {
      soldByUser.set(row.userId, (soldByUser.get(row.userId) || 0) + row.boxes);
      grossByUser.set(row.userId, (grossByUser.get(row.userId) || 0) + row.totalValueCents);
    }
    const metrics = {
      activeResellers: userRows.filter((u) => u.role === "reseller" && u.status === "active").length,
      paidPurchases: asaasVerified.length,
      pendingAccess: paid.filter((p) => !p.accessReleasedAt).length,
      kitRevenueCents: asaasVerified.reduce((sum, p) => sum + Math.max(0,p.productTotalCents || p.totalCents-p.shippingCents-p.interestCents), 0),
      boxesSold: saleRows.reduce((sum, row) => sum + row.boxes, 0),
      grossSalesCents: saleRows.reduce((sum, row) => sum + row.totalValueCents, 0),
      aggregateStock: stockRows.reduce((sum, row) => sum + signed(row.type, row.boxes), 0),
      affiliateLinks: referralRows.length,
      affiliateClicks: referralRows.reduce((sum, row) => sum + row.clickCount, 0),
    };
    return Response.json({
      metrics,
      purchases: purchaseRows,
      resellers: userRows.filter((u) => u.role === "reseller").map((u) => ({ id: u.id, email: u.email, name: u.name, phone: u.phone, status: u.status, createdAt: u.createdAt, stock: stockByUser.get(u.id) || 0, soldBoxes: soldByUser.get(u.id) || 0, grossSalesCents: grossByUser.get(u.id) || 0 })),
      sales: saleRows,
      referrals: referralRows,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return Response.json({ error: "Acesso restrito ao BKO." }, { status: 403 });
    console.error("admin_overview_failed", error);
    return Response.json({ error: "Não foi possível carregar o BKO. Verifique a conexão e a migração do banco de dados." }, { status: 500 });
  }
}
