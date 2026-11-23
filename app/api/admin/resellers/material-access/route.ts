import { getMysqlPool } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { appendManualMaterialDecision, ensureManualMaterialAccessTable, getManualMaterialDecision } from "@/lib/manual-material-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const userIdOk = (id: unknown): id is string => typeof id === "string" && /^[a-zA-Z0-9:_-]{1,80}$/.test(id);

function sameOrigin(request: Request) {
  try {
    const origin = request.headers.get("origin"), host = request.headers.get("host") || new URL(request.url).host;
    const parsed = new URL(origin || "");
    return parsed.host === host && (parsed.protocol === "https:" || (parsed.protocol === "http:" && /^(localhost|127\.0\.0\.1)(:|$)/.test(host)));
  } catch { return false; }
}

function denied(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401, headers });
  if (error instanceof Error && error.message === "FORBIDDEN") return Response.json({ error: "Acesso restrito ao administrador." }, { status: 403, headers });
  console.error("manual_material_access_failed", { category: "internal_error", reason: error instanceof Error ? error.message : "unknown" });
  return Response.json({ error: "Não foi possível consultar a liberação manual." }, { status: 503, headers });
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userIdOk(userId)) return Response.json({ error: "Revendedor inválido." }, { status: 400, headers });
    const latest = await getManualMaterialDecision(userId);
    return Response.json({ active: latest?.action === "grant", lastAction: latest?.action || null, changedAt: latest?.createdAt || null }, { headers });
  } catch (error) { return denied(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request);
    if (!sameOrigin(request)) return Response.json({ error: "Origem não autorizada." }, { status: 403, headers });
    const body = await request.json().catch(() => null);
    const userId = body?.userId, action = body?.action;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const proofReference = typeof body?.proofReference === "string" ? body.proofReference.trim() : "";
    if (!userIdOk(userId) || !["grant", "revoke"].includes(action) || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 ||
      reason.length < 12 || reason.length > 500 || (action === "grant" && (proofReference.length < 8 || proofReference.length > 200)) ||
      proofReference.length > 200 || body?.confirm !== (action === "grant" ? "LIBERAR" : "REVOGAR")) {
      return Response.json({ error: "Confira o revendedor, o motivo, a referência do comprovante e a confirmação." }, { status: 400, headers });
    }
    await ensureManualMaterialAccessTable();
    const connection = await getMysqlPool().getConnection();
    try {
      await connection.beginTransaction();
      const [users] = await connection.execute("SELECT id,email,role,status FROM users WHERE id=? FOR UPDATE", [userId]);
      const owner = (users as Array<{ id: string; email: string; role: string; status: string }>)[0];
      if (!owner || owner.email.toLowerCase() !== email) {
        await connection.rollback();
        return Response.json({ error: "Cadastro ou e-mail divergente; nenhuma alteração realizada." }, { status: 409, headers });
      }
      if (owner.role !== "reseller" || (action === "grant" && owner.status !== "active")) {
        await connection.rollback();
        return Response.json({ error: "A concessão exige um revendedor ativo." }, { status: 409, headers });
      }
      const latest = await getManualMaterialDecision(userId, connection);
      const active = latest?.action === "grant";
      if (active === (action === "grant")) {
        await connection.rollback();
        return Response.json({ error: active ? "A liberação manual já está ativa." : "Não há liberação manual ativa para revogar." }, { status: 409, headers });
      }
      const changedAt = await appendManualMaterialDecision(connection, { userId, action, actorId: actor.id, reason, proofReference });
      await connection.commit();
      console.info("bko_manual_material_access_decision", { actorId: actor.id, userId, action, at: changedAt });
      return Response.json({ active: action === "grant", changedAt }, { headers });
    } catch (error) {
      await connection.rollback().catch(() => {});
      throw error;
    } finally { connection.release(); }
  } catch (error) { return denied(error); }
}
