import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { affiliateCashbacks } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireSession(request);
    if (user.role !== "reseller") return Response.json({ error: "Área do revendedor." }, { status: 403 });
    const rows = await getDb().select().from(affiliateCashbacks).where(eq(affiliateCashbacks.resellerUserId, user.id)).orderBy(desc(affiliateCashbacks.createdAt));
    const totals = rows.reduce((acc, row) => {
      acc.totalCents += row.amountCents;
      if (row.status === "pending") acc.pendingCents += row.amountCents;
      if (row.status === "approved") acc.approvedCents += row.amountCents;
      if (row.status === "paid") acc.paidCents += row.amountCents;
      return acc;
    }, { totalCents: 0, pendingCents: 0, approvedCents: 0, paidCents: 0 });
    return Response.json({ totals, cashbacks: rows }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
    console.error("cashback_load_failed", error);
    return Response.json({ error: "Não foi possível carregar o cashback." }, { status: 500 });
  }
}
