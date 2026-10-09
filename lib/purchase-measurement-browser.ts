type Consent = { analytics: boolean; ads: boolean };
type Config = { ga4Id?: string; metaPixelId?: string };
type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;
type Receipt = { purchaseId: string; withdrawalToken: string; expiresAt: string; analytics: boolean; ads: boolean; pending: boolean };
export const PURCHASE_RECEIPTS_KEY = "lordnutri_purchase_privacy_v1";

function cookie(source: string, name: string) {
  const value = source.split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
  try { return value ? decodeURIComponent(value) : undefined; } catch { return undefined; }
}
/** Values are validated again by the server; no identity is invented if a tag is blocked. */
export async function collectPurchaseIdentifiers(config: Config, getConsent: () => Consent, getGoogle: (field: string) => Promise<unknown>, getCookies: () => string) {
  const initial = getConsent();
  if (!initial.analytics && !initial.ads) return undefined;
  let clientId: unknown, sessionId: unknown;
  if (initial.analytics && config.ga4Id) {
    [clientId, sessionId] = await Promise.all([getGoogle("client_id"), getGoogle("session_id")]);
  }
  // The visitor can withdraw a purpose while callbacks are outstanding.
  const current = getConsent();
  const analytics = initial.analytics && current.analytics;
  const ads = initial.ads && current.ads;
  const result: Record<string, unknown> = { analyticsConsent: analytics, adsConsent: ads };
  if (analytics && config.ga4Id && /^\d{1,20}\.\d{1,20}$/.test(String(clientId ?? ""))) {
    result.ga4Id = config.ga4Id; result.clientId = String(clientId);
    if (/^\d{1,16}$/.test(String(sessionId ?? ""))) result.sessionId = String(sessionId);
  }
  if (ads && config.metaPixelId) {
    const source = getCookies();
    const fbp = cookie(source, "_fbp"), fbc = cookie(source, "_fbc");
    if (fbp || fbc) { result.metaPixelId = config.metaPixelId; if (fbp) result.fbp = fbp; if (fbc) result.fbc = fbc; }
  }
  return result.clientId || result.fbp || result.fbc ? result : undefined;
}

function readReceipts(storage: Storage, now: number): Receipt[] {
  try {
    const rows: unknown = JSON.parse(storage.getItem(PURCHASE_RECEIPTS_KEY) || "[]");
    if (!Array.isArray(rows)) return [];
    return rows.filter((row): row is Receipt => Boolean(row) && typeof row === "object" &&
      /^[A-Za-z0-9_-]{1,80}$/.test(row.purchaseId) && /^[a-f0-9]{64}$/.test(row.withdrawalToken) &&
      Date.parse(row.expiresAt) > now && Date.parse(row.expiresAt) <= now + 31 * 86400000 &&
      typeof row.analytics === "boolean" && typeof row.ads === "boolean" && typeof row.pending === "boolean");
  } catch { return []; }
}
export function rememberPurchaseReceipt(storage: Storage, input: unknown, now = Date.now()) {
  if (!input || typeof input !== "object") return;
  const data = input as Record<string, unknown>;
  if (typeof data.purchaseId !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(data.purchaseId) || typeof data.withdrawalToken !== "string" || !/^[a-f0-9]{64}$/.test(data.withdrawalToken) || typeof data.expiresAt !== "string" || !(Date.parse(data.expiresAt) > now && Date.parse(data.expiresAt) <= now + 31 * 86400000)) return;
  const rows = readReceipts(storage, now).filter(row => row.purchaseId !== data.purchaseId);
  rows.push({ purchaseId: data.purchaseId, withdrawalToken: data.withdrawalToken, expiresAt: data.expiresAt, analytics: data.analytics === true, ads: data.ads === true, pending: true });
  storage.setItem(PURCHASE_RECEIPTS_KEY, JSON.stringify(rows));
}
export async function syncPurchaseReceipts(storage: Storage, consent: Consent, send: (body: Omit<Receipt, "pending" | "expiresAt">) => Promise<number>, now = Date.now()) {
  const rows = readReceipts(storage, now);
  for (const row of rows) {
    const analytics = row.analytics && consent.analytics, ads = row.ads && consent.ads;
    row.pending ||= analytics !== row.analytics || ads !== row.ads;
    row.analytics = analytics; row.ads = ads;
  }
  // Persist a withdrawal before the request: a reload/offline period cannot silently regrant it.
  storage.setItem(PURCHASE_RECEIPTS_KEY, JSON.stringify(rows));
  for (const row of rows.filter(item => item.pending)) {
    try {
      const status = await send({ purchaseId: row.purchaseId, withdrawalToken: row.withdrawalToken, analytics: row.analytics, ads: row.ads });
      if (status === 200 || status === 404) {
        // Re-read: another tab may have withdrawn an additional purpose meanwhile.
        const latest = readReceipts(storage, now);
        const saved = latest.find(item => item.purchaseId === row.purchaseId);
        if (saved && saved.analytics === row.analytics && saved.ads === row.ads) saved.pending = false;
        storage.setItem(PURCHASE_RECEIPTS_KEY, JSON.stringify(latest));
      }
    } catch { /* Keep the pending withdrawal for the next visit. */ }
  }
}
