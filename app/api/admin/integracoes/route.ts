import { requireAdmin } from "@/lib/auth";
import { inspectAsaasConnection } from "@/lib/asaas";
import { correiosConfig, postalToken, trackParcel, validPostalCode } from "@/lib/correios";
import { getMysqlPool } from "@/db";
import type { RowDataPacket } from "mysql2/promise";

async function inspectPostal(code: string) {
  if (!correiosConfig()) return "Preencha as credenciais dos Correios na hospedagem.";
  try {
    const token = await postalToken();
    if (!code) return "Contrato autenticado. Informe um código postado para testar o rastreio.";
    const event = await trackParcel(code,token);
    return event ? event.description + " · " + event.at.replace("T"," ") : "Objeto sem evento disponível para este contrato.";
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return /^Correios HTTP \d{3}$/.test(message) ? message : "Não foi possível consultar os Correios.";
  }
}

async function evidence() {
  const pool = getMysqlPool();
  const [sync] = await pool.query<RowDataPacket[]>("SELECT finished_at, result FROM postal_sync_state WHERE id=1");
  const [events] = await pool.query<RowDataPacket[]>(`SELECT IF(p.kit='mix10-unit','influenciadores','revendedores') AS channel, MAX(e.received_at) AS at
    FROM asaas_events e JOIN purchases p ON p.id=e.purchase_id
    WHERE e.event_id NOT LIKE 'reconcile:%' AND e.event_type IN ('PAYMENT_CONFIRMED','PAYMENT_RECEIVED') GROUP BY channel`);
  return { sync:sync[0] ? { at:String(sync[0].finished_at), result:String(sync[0].result) } : null,
    inbound:Object.fromEntries(events.map(e => [e.channel,e.at])) as Record<string,string> };
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => null);
    const code = typeof body?.code === "string" ? body.code.toUpperCase().trim() : "";
    if (code && !validPostalCode.test(code)) return Response.json({ error:"Use o código de 13 caracteres da etiqueta." }, { status:400 });
    const [asaas, correios, history] = await Promise.all([
      inspectAsaasConnection(process.env.NEXT_PUBLIC_APP_URL || ""), inspectPostal(code),
      evidence().catch(() => null),
    ]);
    return Response.json({ asaas, correios, history, checkedAt:new Date().toISOString() }, { headers:{ "cache-control":"private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") return Response.json({ error:"Acesso exclusivo do BKO." }, { status:message === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json({ error:"Diagnóstico indisponível." }, { status:503 });
  }
}
