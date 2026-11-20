import { requireAdmin } from "@/lib/auth";
import { indicatedError, privateResponseHeaders } from "@/lib/indicator-security";
import { nextCashbackFriday } from "@/lib/cashback-schedule";

/** Prévia administrativa. Nenhuma transferência ou reserva financeira é criada. */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => null);
    if (!Number.isSafeInteger(body?.amountCents) || body.amountCents < 10000 ||
        typeof body?.availableAt !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(body.availableAt) ||
        !Number.isFinite(Date.parse(body.availableAt)) || Date.parse(body.availableAt) > Date.now()) {
      return Response.json({ error: "Informe saldo liberado de pelo menos R$ 100 e a data com fuso em que atingiu o mínimo." }, { status: 400 });
    }
    return Response.json({
      mode: "preview", automaticTransfersEnabled: false,
      amountCents: body.amountCents, scheduleDate: nextCashbackFriday(body.availableAt),
      requirements: ["Conciliar valores liberados e repasses anteriores", "Validar chave PIX do beneficiário", "Registrar lote e chave de idempotência", "Confirmar saldo Asaas e acompanhar webhook de transferência"],
    }, { headers: privateResponseHeaders });
  } catch (error) { return indicatedError(error); }
}
