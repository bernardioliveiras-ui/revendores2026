import { requireAdmin } from "@/lib/auth";
import { runPostalSync } from "@/lib/correios-sync";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const result = await runPostalSync();
    return Response.json(result, {
      status: result.errors ? 502 : 200,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
    if (message === "FORBIDDEN") return Response.json({ error: "Acesso restrito ao BKO." }, { status: 403 });
    console.error("admin_correios_sync_failed", error instanceof Error ? error.name : "unknown");
    return Response.json({ error: "Falha ao consultar os Correios. Confira as credenciais em Integrações." }, { status: 503 });
  }
}
