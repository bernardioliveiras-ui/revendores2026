import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatedClients } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ensureIndicatedSchema } from "@/lib/indicated-schema";
import { issueIndicatedInvitation } from "@/lib/indicated-invitations";
import { cleanText, indicatedError, privateResponseHeaders } from "@/lib/indicated-security";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    await ensureIndicatedSchema();
    const body = await request.json().catch(() => null);
    const id = cleanText(body?.id, 80);
    if (!id) return Response.json({ error: "Indicação inválida." }, { status: 400 });
    const [row] = await getDb().select({ clientUserId: indicatedClients.clientUserId })
      .from(indicatedClients).where(eq(indicatedClients.id, id)).limit(1);
    if (!row) return Response.json({ error: "Indicação não encontrada." }, { status: 404 });
    const invitation = await issueIndicatedInvitation(row.clientUserId);
    return Response.json({ generated: true, ...invitation }, { headers: privateResponseHeaders });
  } catch (error) {
    if (error instanceof Error && error.message === "INVITE_FORBIDDEN") {
      return Response.json({ error: "Ative o acesso do cliente indicado antes de gerar o link." }, { status: 409 });
    }
    return indicatedError(error);
  }
}
