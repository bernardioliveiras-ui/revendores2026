import { revokePurchaseMeasurement } from "@/lib/purchase-measurement";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.purchaseId !== "string" || typeof body.withdrawalToken !== "string" || typeof body.analytics !== "boolean" || typeof body.ads !== "boolean") return Response.json({ error: "Dados inválidos." }, { status: 400 });
  try {
    const revoked = await revokePurchaseMeasurement(body.purchaseId, body.withdrawalToken, { analytics: body.analytics, ads: body.ads });
    return Response.json({ revoked }, { status: revoked ? 200 : 404 });
  } catch { return Response.json({ error: "Não foi possível atualizar a preferência." }, { status: 503 }); }
}
