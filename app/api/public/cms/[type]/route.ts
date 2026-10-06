import { getStudioDoc, isStudioDocType } from "@/lib/content-studio";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ type: string }> }) {
  const { type } = await context.params;
  if (!isStudioDocType(type)) return Response.json({ error: "Área inválida." }, { status: 404 });
  try {
    const doc = await getStudioDoc(type);
    const preview = new URL(request.url).searchParams.get("preview") === "draft";
    if (preview) {
      const user = await getSessionUser(request);
      if (user?.role === "admin") return Response.json({ content: doc.draft, mode: "draft" }, { headers: {"cache-control":"no-store"} });
    }
    return Response.json({ content: doc.published, mode: "published" }, { headers: {"cache-control":"no-store"} });
  } catch {
    return Response.json({ content: null, mode: "fallback" }, { headers: {"cache-control":"no-store"} });
  }
}
