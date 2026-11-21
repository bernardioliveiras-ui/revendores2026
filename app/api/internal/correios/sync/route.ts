import { safeHashEqual } from "@/lib/auth";
import { runPostalSync } from "@/lib/correios-sync";

export async function POST(request: Request) {
  const token = process.env.CORREIOS_CRON_TOKEN?.trim();
  if (!token || token.length < 32 || !safeHashEqual("Bearer " + token, request.headers.get("authorization") || "")) {
    return Response.json({ error:"Acesso não autorizado." }, { status:401 });
  }
  try {
    const result = await runPostalSync();
    return Response.json(result, { status:result.errors ? 502 : 200 });
  } catch {
    return Response.json({ error:"Falha na sincronização. Consulte Integrações no BKO." }, { status:503 });
  }
}
