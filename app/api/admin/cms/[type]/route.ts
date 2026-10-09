import { requireAdmin } from "@/lib/auth";
import { getStudioDoc, isStudioDocType, publishStudioDoc, saveStudioDraft } from "@/lib/content-studio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ type: string }> }) {
  try {
    await requireAdmin(request);
    const { type } = await context.params;
    if (type === "landing") return Response.json({ error: "O Studio da landing foi removido. O conteúdo da LP agora é mantido no código." }, { status: 410 });
    if (!isStudioDocType(type)) return Response.json({ error: "Área inválida." }, { status: 404 });
    return Response.json(await getStudioDoc(type), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return Response.json({ error: message === "UNAUTHORIZED" ? "Faça login novamente." : message === "FORBIDDEN" ? "Acesso restrito ao BKO." : "Não foi possível carregar a edição." }, { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ type: string }> }) {
  try {
    await requireAdmin(request);
    const { type } = await context.params;
    if (type === "landing") return Response.json({ error: "O Studio da landing foi removido. O conteúdo da LP agora é mantido no código." }, { status: 410 });
    if (!isStudioDocType(type)) return Response.json({ error: "Área inválida." }, { status: 404 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || !("draft" in body)) return Response.json({ error: "Rascunho inválido." }, { status: 400 });
    return Response.json(await saveStudioDraft(type, (body as {draft: unknown}).draft));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return Response.json({ error: message === "UNAUTHORIZED" ? "Faça login novamente." : message === "FORBIDDEN" ? "Acesso restrito ao BKO." : message.startsWith("Studio bloqueou") ? message : "Não foi possível salvar o rascunho." }, { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message.startsWith("Studio bloqueou") ? 400 : 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ type: string }> }) {
  try {
    await requireAdmin(request);
    const { type } = await context.params;
    if (type === "landing") return Response.json({ error: "O Studio da landing foi removido. O conteúdo da LP agora é mantido no código." }, { status: 410 });
    if (!isStudioDocType(type)) return Response.json({ error: "Área inválida." }, { status: 404 });
    const body = await request.json().catch(() => ({})) as { action?: string };
    if (body.action !== "publish") return Response.json({ error: "Ação inválida." }, { status: 400 });
    return Response.json(await publishStudioDoc(type));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return Response.json({ error: message === "UNAUTHORIZED" ? "Faça login novamente." : message === "FORBIDDEN" ? "Acesso restrito ao BKO." : message.startsWith("Studio bloqueou") ? message : "Não foi possível publicar." }, { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message.startsWith("Studio bloqueou") ? 400 : 500 });
  }
}
