export type PurchaseProvider = "ga4" | "meta";
export type PurchaseMeasurementConfig = { enabled: boolean; ga4Id?: string; ga4Secret?: string; metaPixelId?: string; metaToken?: string; metaVersion?: string; metaTestCode?: string; appUrl: string };
export type PurchaseSnapshot = { analyticsConsent: boolean; adsConsent: boolean; capturedAt: string; expiresAt: string; ga4Id?: string; clientId?: string; sessionId?: string; metaPixelId?: string; fbp?: string; fbc?: string; userAgent?: string; gclid?: string; gbraid?: string; wbraid?: string };
export type MeasuredPurchase = { id: string; orderNumber: string; paymentStatus: string; kit: string; boxes: number; productTotalCents: number; shippingCents: number; interestCents: number; totalCents: number };
export type PurchaseRequest = { provider: PurchaseProvider; url: string; headers: Record<string, string>; body: Record<string, unknown> };
export const SNAPSHOT_TTL_MS = 30 * 86400000;
const text = (value: unknown) => typeof value === "string" ? value : "";
const token = (value: unknown, max = 250) => text(value).length <= max && /^[A-Za-z0-9_-]+$/.test(text(value)) ? text(value) : undefined;
function pixelCookie(value: unknown, kind: "fbp" | "fbc", now: number) {
  const v = text(value);
  if (v.length > 350 || !(kind === "fbp" ? /^fb\.\d\.\d{13}\.\d{1,30}$/ : /^fb\.\d\.\d{13}\.[A-Za-z0-9_-]{1,250}$/).test(v)) return undefined;
  const timestamp = Number(v.split(".")[2]);
  return timestamp <= now + 300000 && now - timestamp <= SNAPSHOT_TTL_MS ? v : undefined;
}
export function sanitizePurchaseSnapshot(input: unknown, config: PurchaseMeasurementConfig, userAgent: string, now = Date.now()): PurchaseSnapshot | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const data = input as Record<string, unknown>;
  const analyticsConsent = data.analyticsConsent === true;
  const adsConsent = data.adsConsent === true;
  if (!analyticsConsent && !adsConsent) return null;
  const snapshot: PurchaseSnapshot = { analyticsConsent, adsConsent, capturedAt: new Date(now).toISOString(), expiresAt: new Date(now + SNAPSHOT_TTL_MS).toISOString() };
  if (analyticsConsent && /^G-[A-Z0-9]+$/.test(config.ga4Id || "") && data.ga4Id === config.ga4Id && /^\d{1,20}\.\d{1,20}$/.test(text(data.clientId))) {
    snapshot.ga4Id = config.ga4Id; snapshot.clientId = text(data.clientId);
    const session = Number(data.sessionId);
    if (/^\d{1,16}$/.test(text(data.sessionId)) && Number.isSafeInteger(session) && session > 0) snapshot.sessionId = text(data.sessionId);
  }
  if (adsConsent) {
    if (/^\d{5,30}$/.test(config.metaPixelId || "") && data.metaPixelId === config.metaPixelId) {
      const fbp = pixelCookie(data.fbp, "fbp", now), fbc = pixelCookie(data.fbc, "fbc", now);
      if (fbp || fbc) {
        snapshot.metaPixelId = config.metaPixelId;
        if (fbp) snapshot.fbp = fbp; if (fbc) snapshot.fbc = fbc;
        if (userAgent.length <= 500 && /^[\x20-\x7e]+$/.test(userAgent) && !userAgent.includes("@")) snapshot.userAgent = userAgent;
      }
    }
    for (const field of ["gclid", "gbraid", "wbraid"] as const) { const value = token(data[field]); if (value) snapshot[field] = value; }
  }
  return snapshot.clientId || snapshot.fbp || snapshot.fbc ? snapshot : null;
}
export function withdrawPurchaseConsent(snapshot: PurchaseSnapshot, choice: { analytics: boolean; ads: boolean }): PurchaseSnapshot {
  const updated = { ...snapshot, analyticsConsent: snapshot.analyticsConsent && choice.analytics, adsConsent: snapshot.adsConsent && choice.ads };
  if (!updated.analyticsConsent) { delete updated.ga4Id; delete updated.clientId; delete updated.sessionId; }
  if (!updated.adsConsent) { delete updated.metaPixelId; delete updated.fbp; delete updated.fbc; delete updated.userAgent; delete updated.gclid; delete updated.gbraid; delete updated.wbraid; }
  return updated;
}
export function providerConfigured(provider: PurchaseProvider, config: PurchaseMeasurementConfig) {
  return config.enabled && (provider === "ga4" ? /^G-[A-Z0-9]+$/.test(config.ga4Id || "") && Boolean(config.ga4Secret) : /^\d{5,30}$/.test(config.metaPixelId || "") && Boolean(config.metaToken) && /^v\d{1,3}\.0$/.test(config.metaVersion || ""));
}
export function buildPurchaseRequest(provider: PurchaseProvider, purchase: MeasuredPurchase, snapshot: PurchaseSnapshot | null, confirmedAt: string, config: PurchaseMeasurementConfig, now = Date.now()): PurchaseRequest | null {
  const confirmed = Date.parse(confirmedAt);
  if (!providerConfigured(provider, config) || !snapshot || purchase.paymentStatus !== "paid" || Date.parse(snapshot.expiresAt) <= now || !Number.isFinite(confirmed) || confirmed > now || now - confirmed > (provider === "ga4" ? 72 * 3600000 : 7 * 86400000)) return null;
  if (!["kit20", "kit50"].includes(purchase.kit) || !token(purchase.id, 80) || !token(purchase.orderNumber, 60) || ![purchase.productTotalCents, purchase.shippingCents, purchase.interestCents, purchase.totalCents].every(value => Number.isSafeInteger(value) && value >= 0)) return null;
  const page = new URL("/", config.appUrl).href;
  if (provider === "ga4") {
    if (!snapshot.analyticsConsent || !snapshot.clientId || snapshot.ga4Id !== config.ga4Id) return null;
    const url = new URL("https://www.google-analytics.com/mp/collect");
    url.searchParams.set("measurement_id", config.ga4Id!); url.searchParams.set("api_secret", config.ga4Secret!);
    return { provider, url: url.href, headers: { "content-type": "application/json" }, body: {
      client_id: snapshot.clientId, timestamp_micros: confirmed * 1000,
      consent: { ad_user_data: snapshot.adsConsent ? "GRANTED" : "DENIED", ad_personalization: "DENIED" },
      events: [{ name: "purchase", params: { transaction_id: purchase.orderNumber, currency: "BRL", value: purchase.productTotalCents / 100, shipping: purchase.shippingCents / 100, payment_interest: purchase.interestCents / 100, payment_total: purchase.totalCents / 100, ...(snapshot.sessionId ? { session_id: Number(snapshot.sessionId) } : {}), page_location: page, items: [{ item_id: purchase.kit, item_name: purchase.kit.toUpperCase(), price: purchase.productTotalCents / 100, quantity: 1 }] } }],
    } };
  }
  if (!snapshot.adsConsent || snapshot.metaPixelId !== config.metaPixelId || (!snapshot.fbp && !snapshot.fbc)) return null;
  return { provider, url: `https://graph.facebook.com/${config.metaVersion}/${config.metaPixelId}/events`, headers: { "content-type": "application/json", authorization: `Bearer ${config.metaToken}` }, body: {
    ...(config.metaTestCode ? { test_event_code: config.metaTestCode } : {}),
    data: [{ event_name: "Purchase", event_id: `purchase:${purchase.id}`, event_time: Math.floor(confirmed / 1000), action_source: "website", event_source_url: page, user_data: { ...(snapshot.fbp ? { fbp: snapshot.fbp } : {}), ...(snapshot.fbc ? { fbc: snapshot.fbc } : {}), ...(snapshot.userAgent ? { client_user_agent: snapshot.userAgent } : {}) }, custom_data: { currency: "BRL", value: purchase.totalCents / 100, order_id: purchase.orderNumber, content_ids: [purchase.kit], content_type: "product", contents: [{ id: purchase.kit, quantity: 1, item_price: purchase.productTotalCents / 100 }], num_items: 1 } }],
  } };
}
