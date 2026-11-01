import { createHash, randomBytes } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "@/db";
import { getOptionalEnv } from "@/lib/env";
import { sanitizePurchaseSnapshot, withdrawPurchaseConsent, providerConfigured, type PurchaseMeasurementConfig, type PurchaseSnapshot, type MeasuredPurchase } from "./purchase-measurement-contract";
import { drainPurchaseMeasurements, type MeasurementRepository, type MeasurementJob } from "./purchase-measurement-worker";

export function purchaseMeasurementConfig(): PurchaseMeasurementConfig {
  return {
    enabled: getOptionalEnv("PURCHASE_MEASUREMENT_ENABLED") === "true" && (getOptionalEnv("ASAAS_ENVIRONMENT") === "production" || getOptionalEnv("PURCHASE_MEASUREMENT_ALLOW_SANDBOX") === "true"),
    ga4Id: getOptionalEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID"), ga4Secret: getOptionalEnv("GA4_API_SECRET"),
    metaPixelId: getOptionalEnv("NEXT_PUBLIC_META_PIXEL_ID"), metaToken: getOptionalEnv("META_CAPI_ACCESS_TOKEN"), metaVersion: getOptionalEnv("META_GRAPH_API_VERSION"), metaTestCode: getOptionalEnv("META_CAPI_TEST_EVENT_CODE"),
    appUrl: getOptionalEnv("NEXT_PUBLIC_APP_URL") || "https://revendedores.mix10pro.com.br",
  };
}
async function transaction<T>(callback: (connection: PoolConnection) => Promise<T>) {
  const connection = await getMysqlPool().getConnection();
  try { await connection.beginTransaction(); const value = await callback(connection); await connection.commit(); return value; }
  catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
function decodeSnapshot(value: unknown): PurchaseSnapshot | null {
  try { const parsed = JSON.parse(typeof value === "string" ? value : "null"); return parsed && typeof parsed.analyticsConsent === "boolean" && typeof parsed.adsConsent === "boolean" && Number.isFinite(Date.parse(parsed.expiresAt)) ? parsed as PurchaseSnapshot : null; } catch { return null; }
}
export async function capturePurchaseMeasurement(purchaseId: string, input: unknown, request: Request) {
  const config = purchaseMeasurementConfig();
  if (!providerConfigured("ga4", config) && !providerConfigured("meta", config)) return null;
  const snapshot = sanitizePurchaseSnapshot(input, { ...config, ga4Id: providerConfigured("ga4", config) ? config.ga4Id : undefined, metaPixelId: providerConfigured("meta", config) ? config.metaPixelId : undefined }, request.headers.get("user-agent") || "");
  if (!snapshot) return null;
  const withdrawalToken = randomBytes(32).toString("hex");
  try {
    await getMysqlPool().execute("INSERT INTO purchase_measurement (purchase_id, snapshot, withdrawal_token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)", [purchaseId, JSON.stringify(snapshot), hashToken(withdrawalToken), snapshot.expiresAt, snapshot.capturedAt]);
    return { purchaseId, withdrawalToken, expiresAt: snapshot.expiresAt, analytics: snapshot.analyticsConsent, ads: snapshot.adsConsent };
  } catch { console.error("purchase_measurement_capture_pending"); return null; }
}
/** Optional failures must not change a payment, checkout or access result. */
export async function enqueueConfirmedPurchase(purchaseId: string) {
  if (!purchaseMeasurementConfig().enabled) return;
  try {
    await transaction(async connection => {
      const [purchases] = await connection.execute<RowDataPacket[]>("SELECT id, payment_status FROM purchases WHERE id = ? FOR UPDATE", [purchaseId]);
      if (purchases[0]?.payment_status !== "paid") return;
      const [snapshots] = await connection.execute<RowDataPacket[]>("SELECT snapshot, expires_at, confirmed_at, activated_at FROM purchase_measurement WHERE purchase_id = ? FOR UPDATE", [purchaseId]);
      const row = snapshots[0], snapshot = decodeSnapshot(row?.snapshot);
      if (!snapshot || !row.activated_at || Date.parse(row.expires_at) <= Date.now()) return;
      // Only authenticated Asaas confirmations accepted by our webhook qualify;
      // a manual BKO status change alone is not evidence for advertising revenue.
      const [events] = await connection.execute<RowDataPacket[]>("SELECT MIN(received_at) AS confirmed_at FROM asaas_events WHERE purchase_id = ? AND event_type IN ('PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED')", [purchaseId]);
      const confirmedAt = row.confirmed_at || events[0]?.confirmed_at;
      if (!confirmedAt) return;
      await connection.execute("UPDATE purchase_measurement SET confirmed_at = COALESCE(confirmed_at, ?) WHERE purchase_id = ?", [confirmedAt, purchaseId]);
      const now = new Date().toISOString();
      for (const provider of ["ga4", "meta"] as const) {
        const eligible = provider === "ga4" ? snapshot.analyticsConsent && snapshot.clientId : snapshot.adsConsent && (snapshot.fbp || snapshot.fbc);
        if (eligible) await connection.execute("INSERT IGNORE INTO measurement_outbox (id, purchase_id, provider, status, attempts, next_attempt_at, created_at) VALUES (?, ?, ?, 'pending', 0, ?, ?)", [`purchase:${provider}:${purchaseId}`, purchaseId, provider, now, now]);
      }
    });
  } catch { console.error("purchase_measurement_enqueue_pending"); }
}
export const mysqlMeasurementRepository: MeasurementRepository = {
  async listDue(now, limit) {
    const [rows] = await getMysqlPool().execute<RowDataPacket[]>("SELECT id FROM measurement_outbox WHERE status IN ('pending', 'retry') AND next_attempt_at <= ? ORDER BY next_attempt_at, id LIMIT ?", [now, limit]);
    return rows.map(row => String(row.id));
  },
  async withDelivery(id, deliver) {
    await transaction(async connection => {
      const [identities] = await connection.execute<RowDataPacket[]>("SELECT purchase_id FROM measurement_outbox WHERE id = ?", [id]);
      const purchaseId = identities[0]?.purchase_id;
      if (!purchaseId) return;
      // Lock purchase first (same order as webhook/cancellation), then outbox and
      // consent. A cancellation committed before this lock prevents dispatch.
      const [purchases] = await connection.execute<RowDataPacket[]>("SELECT id, order_number AS orderNumber, payment_status AS paymentStatus, kit, boxes, product_total_cents AS productTotalCents, shipping_cents AS shippingCents, interest_cents AS interestCents, total_cents AS totalCents FROM purchases WHERE id = ? FOR UPDATE", [purchaseId]);
      const [jobs] = await connection.execute<RowDataPacket[]>("SELECT id, provider, status, attempts, next_attempt_at AS nextAttemptAt FROM measurement_outbox WHERE id = ? FOR UPDATE", [id]);
      const [snapshots] = await connection.execute<RowDataPacket[]>("SELECT snapshot, confirmed_at, activated_at FROM purchase_measurement WHERE purchase_id = ? FOR UPDATE", [purchaseId]);
      if (!jobs[0]) return;
      const job = { ...jobs[0], confirmedAt: snapshots[0]?.confirmed_at || "" } as MeasurementJob;
      await deliver({ purchase: purchases[0] as MeasuredPurchase || null, snapshot: snapshots[0]?.activated_at ? decodeSnapshot(snapshots[0]?.snapshot) : null, job, saveJob: async patch => {
        Object.assign(job, patch);
        await connection.execute("UPDATE measurement_outbox SET status = ?, attempts = ?, next_attempt_at = ?, sent_at = ?, last_error = ? WHERE id = ?", [job.status, job.attempts, job.nextAttemptAt, job.sentAt || null, job.lastError || null, id]);
      } });
    });
  },
};
export async function runPurchaseMeasurementQueue(limit = 10) {
  const config = purchaseMeasurementConfig();
  const now = new Date().toISOString();
  // Keep erasure working even after an operator disables delivery.
  await getMysqlPool().execute("UPDATE purchase_measurement SET snapshot = '{}', withdrawal_token_hash = NULL WHERE expires_at <= ? AND withdrawal_token_hash IS NOT NULL", [now]);
  if (!config.enabled) return { disabled: true };
  // Durable recovery handles a process crash between payment commit and enqueue.
  const [unqueued] = await getMysqlPool().execute<RowDataPacket[]>("SELECT s.purchase_id FROM purchase_measurement s JOIN purchases p ON p.id = s.purchase_id WHERE p.payment_status = 'paid' AND s.activated_at IS NOT NULL AND s.confirmed_at IS NULL AND s.expires_at > ? AND EXISTS (SELECT 1 FROM asaas_events e WHERE e.purchase_id = s.purchase_id AND e.event_type IN ('PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED')) ORDER BY s.created_at LIMIT 20", [now]);
  for (const row of unqueued) await enqueueConfirmedPurchase(String(row.purchase_id));
  const result = await drainPurchaseMeasurements(mysqlMeasurementRepository, config, undefined, Date.now(), limit);
  return result;
}
export async function revokePurchaseMeasurement(purchaseId: string, token: string, choice: { analytics: boolean; ads: boolean }) {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(purchaseId) || !/^[a-f0-9]{64}$/.test(token)) return false;
  return transaction(async connection => {
    await connection.execute("SELECT id FROM purchases WHERE id = ? FOR UPDATE", [purchaseId]);
    const [rows] = await connection.execute<RowDataPacket[]>("SELECT snapshot FROM purchase_measurement WHERE purchase_id = ? AND withdrawal_token_hash = ? FOR UPDATE", [purchaseId, hashToken(token)]);
    const snapshot = decodeSnapshot(rows[0]?.snapshot);
    if (!snapshot) return false;
    const updated = withdrawPurchaseConsent(snapshot, choice);
    // First ACK proves the browser received and retained its withdrawal capability.
    // Lost checkout responses/reloads leave the snapshot ineligible for delivery.
    await connection.execute("UPDATE purchase_measurement SET snapshot = ?, activated_at = COALESCE(activated_at, ?) WHERE purchase_id = ?", [JSON.stringify(updated), new Date().toISOString(), purchaseId]);
    // Sent events cannot be recalled here; only queued deliveries are suppressed.
    for (const provider of ["ga4", "meta"] as const) if (provider === "ga4" ? !updated.analyticsConsent : !updated.adsConsent) await connection.execute("UPDATE measurement_outbox SET status = 'suppressed', last_error = 'consent_withdrawn' WHERE purchase_id = ? AND provider = ? AND status IN ('pending', 'retry')", [purchaseId, provider]);
    return true;
  });
}
