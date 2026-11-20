import { safeHashEqual } from "@/lib/auth";
import { getOptionalEnv } from "@/lib/env";
import { runPurchaseMeasurementQueue } from "@/lib/purchase-measurement";
export const maxDuration = 60;
export async function POST(request: Request) {
  const token = getOptionalEnv("MEASUREMENT_RETRY_TOKEN");
  if (!token || !safeHashEqual(`Bearer ${token}`, request.headers.get("authorization") || "")) return Response.json({ error: "Não autorizado." }, { status: 401 });
  try { return Response.json(await runPurchaseMeasurementQueue()); }
  catch { console.error("purchase_measurement_retry_pending"); return Response.json({ error: "Fila indisponível. Tente novamente." }, { status: 503 }); }
}
