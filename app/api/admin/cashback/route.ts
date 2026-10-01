import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { affiliateCashbacks } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const allowed = new Set(["approved", "paid", "cancelled"]);
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json() as { id?: unknown; status?: unknown; notes?: unknown };
    const id = typeof body.id === "string" ? body.id : "";
    const status = typeof body.status === "string" ? body.status : "";
    if (!id || !allowed.has(status)) return Response.json({ error: "Status de cashback inválido." }, { status: 400 });
    const now = new Date().toISOString();
    const patch: Record<string, string> = { status, updatedAt: now };
    if (status === "approved") { patch.approvedAt = now; patch.approvedBy = admin.id; }
    if (status === "paid") patch.paidAt = now;
    if (typeof body.notes === "string") patch.notes = body.notes.slice(0, 500);
    await getDb().update(affiliateCashbacks).set(patch).where(eq(affiliateCashbacks.id, id));
    return Response.json({ updated: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return Response.json({ error: "Acesso restrito ao BKO." }, { status: 403 });
    console.error("admin_cashback_update_failed", error);
    return Response.json({ error: "Não foi possível atualizar o cashback." }, { status: 500 });
  }
}
