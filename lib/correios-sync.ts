import { getMysqlPool } from "@/db";
import type { RowDataPacket } from "mysql2/promise";
import { postalToken, trackParcel } from "@/lib/correios";
import { updatePurchaseShipping } from "@/lib/shipping";
import { updateManualShipmentShipping } from "@/lib/manual-shipments";
import { ensureOperationalSchema } from "@/lib/runtime-schema";

type Parcel = RowDataPacket & { id: string; carrier: string | null; tracking_code: string; source?:"manual" };
export async function runPostalSync() {
  await ensureOperationalSchema();
  const connection = await getMysqlPool().getConnection();
  let locked = false;
  const summary = { selected:0, verified:0, waiting:0, errors:0, skipped:0 };
  async function record(message: string) {
    await connection.execute("INSERT INTO postal_sync_state (id,finished_at,result) VALUES (1,?,?) ON DUPLICATE KEY UPDATE finished_at=VALUES(finished_at), result=VALUES(result)", [new Date().toISOString(), message]);
  }
  try {
    const [lock] = await connection.query<RowDataPacket[]>("SELECT GET_LOCK('lordnutri-correios-sync',0) AS acquired");
    locked = Number(lock[0]?.acquired) === 1;
    if (!locked) return { busy:true, ...summary };
    const [rows] = await connection.query<Parcel[]>(`
      SELECT id, carrier, tracking_code FROM purchases
      WHERE payment_status='paid' AND shipping_status IN ('separating','shipped')
        AND (COALESCE(TRIM(carrier),'') = '' OR LOWER(carrier) REGEXP '(^|[^a-z])(correios|sedex|pac)([^a-z]|$)')
        AND UPPER(TRIM(tracking_code)) REGEXP '^[A-Z]{2}[0-9]{9}[A-Z]{2}$'
      ORDER BY postal_attempt_at IS NOT NULL, postal_attempt_at, id LIMIT 12`);
    const [manualRows] = await connection.query<Parcel[]>(`
      SELECT id, carrier, tracking_code FROM manual_shipments
      WHERE shipping_status IN ('separating','shipped')
        AND (COALESCE(TRIM(carrier),'') = '' OR LOWER(carrier) REGEXP '(^|[^a-z])(correios|sedex|pac)([^a-z]|$)')
        AND UPPER(TRIM(tracking_code)) REGEXP '^[A-Z]{2}[0-9]{9}[A-Z]{2}$'
      ORDER BY postal_attempt_at IS NOT NULL, postal_attempt_at, id LIMIT 12`);
    const work:Parcel[] = [...rows.slice(0,8), ...manualRows.slice(0,12-rows.slice(0,8).length).map(row=>({...row,source:"manual" as const}))];
    summary.selected = work.length;
    if (work.length) {
      const token = await postalToken();
      for (let start = 0; start < work.length; start += 4) {
        const batch = await Promise.allSettled(work.slice(start,start+4).map(async row => {
          const code = row.tracking_code.trim().toUpperCase();
          let event = null;
          let issue: string | undefined;
          let failed = false;
          try {
            event = await trackParcel(code,token);
            if (!event) issue = "Objeto sem evento disponível para este contrato.";
          } catch (error) {
            failed = true;
            const message = error instanceof Error ? error.message : "";
            issue = /^Correios HTTP \d{3}$/.test(message) ? message : "Consulta aos Correios indisponível.";
          }
          const updater=row.source==="manual"?updateManualShipmentShipping:updatePurchaseShipping;
          const result = await updater(row.id, "", undefined, undefined, {
            originalCode:row.tracking_code, originalCarrier:row.carrier, event, issue, failed,
          });
          if (result.ignored) summary.skipped++;
          else if (failed) summary.errors++;
          else if (event) summary.verified++;
          else summary.waiting++;
        }));
        const failure = batch.find(item => item.status === "rejected");
        if (failure?.status === "rejected") throw failure.reason;
      }
    }
    await record(`${summary.selected} selecionado(s), ${summary.verified} com evento, ${summary.waiting} sem evento, ${summary.errors} com erro e ${summary.skipped} alterado(s) durante a consulta.`);
    return { busy:false, ...summary };
  } catch (error) {
    if (locked) await record("Falha na execução. Confira o acesso ao banco e a autenticação dos Correios.");
    throw error;
  } finally {
    try {
      if (locked) await connection.query("SELECT RELEASE_LOCK('lordnutri-correios-sync')");
    } finally { connection.release(); }
  }
}
