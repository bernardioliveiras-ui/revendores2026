import { buildPurchaseRequest, providerConfigured, type MeasuredPurchase, type PurchaseMeasurementConfig, type PurchaseProvider, type PurchaseRequest, type PurchaseSnapshot } from "./purchase-measurement-contract";
export type MeasurementJob = { id: string; provider: PurchaseProvider; status: string; attempts: number; nextAttemptAt: string; confirmedAt: string; lastError?: string | null; sentAt?: string | null };
export type DeliveryContext = { purchase: MeasuredPurchase | null; snapshot: PurchaseSnapshot | null; job: MeasurementJob; saveJob: (patch: Partial<MeasurementJob>) => Promise<void> };
export type MeasurementRepository = { listDue: (now: string, limit: number) => Promise<string[]>; withDelivery: (id: string, deliver: (context: DeliveryContext) => Promise<void>) => Promise<void> };
export type MeasurementSendResult = { accepted: boolean; retryable?: boolean; errorCode?: string };
export async function sendPurchaseRequest(request: PurchaseRequest): Promise<MeasurementSendResult> {
  const response = await fetch(request.url, { method: "POST", redirect: "error", headers: request.headers, body: JSON.stringify(request.body), signal: AbortSignal.timeout(5000) });
  if (!response.ok) return { accepted: false, retryable: response.status === 429 || response.status >= 500, errorCode: `http_${response.status}` };
  if (request.provider === "meta") {
    const result = await response.json().catch(() => null);
    if (result?.events_received !== 1) return { accepted: false, retryable: true, errorCode: "meta_not_accepted" };
  }
  // GA4 2xx confirms transport only; payload receipt must be checked in GA4 separately.
  return { accepted: true };
}
export async function drainPurchaseMeasurements(repo: MeasurementRepository, config: PurchaseMeasurementConfig, send = sendPurchaseRequest, now = Date.now(), limit = 10) {
  const summary = { sent: 0, retry: 0, failed: 0, suppressed: 0 };
  const ids = await repo.listDue(new Date(now).toISOString(), Math.min(Math.max(limit, 1), 10));
  for (const id of ids) {
    await repo.withDelivery(id, async ({ purchase, snapshot, job, saveJob }) => {
      if (!["pending", "retry"].includes(job.status) || Date.parse(job.nextAttemptAt) > now) return;
      if (!purchase || purchase.paymentStatus !== "paid" || !snapshot || Date.parse(snapshot.expiresAt) <= now || (job.provider === "ga4" ? !snapshot.analyticsConsent || !snapshot.clientId : !snapshot.adsConsent || (!snapshot.fbp && !snapshot.fbc))) {
        await saveJob({ status: "suppressed", lastError: "not_eligible" }); summary.suppressed++; return;
      }
      if (!providerConfigured(job.provider, config)) {
        await saveJob({ status: "retry", nextAttemptAt: new Date(now + 15 * 60000).toISOString(), lastError: "not_configured" }); summary.retry++; return;
      }
      const request = buildPurchaseRequest(job.provider, purchase, snapshot, job.confirmedAt, config, now);
      if (!request) { await saveJob({ status: "suppressed", lastError: "expired_or_invalid" }); summary.suppressed++; return; }
      const attempts = job.attempts + 1;
      let result: MeasurementSendResult;
      try { result = await send(request); } catch { result = { accepted: false, retryable: true, errorCode: "transport_failure" }; }
      if (result.accepted) { await saveJob({ status: "sent", attempts, sentAt: new Date(now).toISOString(), lastError: null }); summary.sent++; return; }
      const retry = result.retryable && attempts < 8;
      await saveJob({ status: retry ? "retry" : "failed", attempts, nextAttemptAt: new Date(now + Math.min(6 * 3600000, 60000 * 2 ** (attempts - 1))).toISOString(), lastError: result.errorCode || "not_accepted" });
      if (retry) summary.retry++; else summary.failed++;
    });
  }
  return summary;
}
