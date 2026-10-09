export type TrackingConsent = { analytics: boolean; ads: boolean };
export type MeasurementConfig = { ga4Id?: string; googleAdsId?: string; checkoutLabel?: string; metaPixelId?: string };
export const CONSENT_KEY = "lordnutri_consent_v1";
export const ATTRIBUTION_KEY = "mix10_attribution";
export const CONSENT_EVENT = "lordnutri:consent";
export const DENIED_CONSENT: TrackingConsent = { analytics: false, ads: false };
const ATTRIBUTION_TTL = 30 * 86400000;
const CONSENT_TTL = 180 * 86400000;
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const campaignFields = { utm_source: "utmSource", utm_medium: "utmMedium", utm_campaign: "utmCampaign", utm_content: "utmContent", utm_term: "utmTerm" } as const;
const clickFields = ["gclid", "gbraid", "wbraid", "fbclid"] as const;
const token = (value: string | null, max = 250) => value && value.length <= max && /^[A-Za-z0-9_-]+$/.test(value) ? value : "";
export function isTrackingPage(pathname: string) { return ["/", "/comprar"].includes(pathname); }
export function normalizeMeasurementConfig(config: MeasurementConfig): MeasurementConfig {
  const valid: MeasurementConfig = {};
  if (/^G-[A-Z0-9]+$/.test(config.ga4Id || "")) valid.ga4Id = config.ga4Id;
  if (/^AW-\d+$/.test(config.googleAdsId || "")) valid.googleAdsId = config.googleAdsId;
  if (token(config.checkoutLabel || null)) valid.checkoutLabel = config.checkoutLabel;
  if (/^\d{5,30}$/.test(config.metaPixelId || "")) valid.metaPixelId = config.metaPixelId;
  return valid;
}
export function readConsent(storage: StorageLike, now = Date.now()): TrackingConsent | null {
  try {
    const value = JSON.parse(storage.getItem(CONSENT_KEY) || "null");
    if (!value || typeof value.analytics !== "boolean" || typeof value.ads !== "boolean" || !Number.isFinite(value.savedAt) || value.savedAt > now || now - value.savedAt > CONSENT_TTL) return null;
    return { analytics: value.analytics, ads: value.ads };
  } catch { return null; }
}
export function saveConsent(storage: StorageLike, consent: TrackingConsent, now = Date.now()) {
  try { storage.setItem(CONSENT_KEY, JSON.stringify({ ...consent, savedAt: now })); } catch { /* The current-page choice still works without storage. */ }
}
export function cleanTrackingUrl(href: string) {
  const url = new URL(href);
  const safe = new URL(url.origin + url.pathname);
  const kit = url.searchParams.get("kit");
  if (kit === "kit20" || kit === "kit50") safe.searchParams.set("kit", kit);
  for (const key of clickFields) { const value = token(url.searchParams.get(key)); if (value) safe.searchParams.set(key, value); }
  return safe.href;
}
function attributionFromUrl(href: string, consent: TrackingConsent): Record<string, string> {
  const url = new URL(href);
  if (!isTrackingPage(url.pathname) || (!consent.analytics && !consent.ads)) return {};
  const result: Record<string, string> = {};
  for (const [query, field] of Object.entries(campaignFields)) {
    // Campaign labels belong in operational attribution, never in tag payloads.
    const value = url.searchParams.get(query)?.trim();
    if (value && value.length <= 180 && !/[@\u0000-\u001f]/.test(value)) result[field] = value;
  }
  if (consent.ads) for (const key of clickFields) { const value = token(url.searchParams.get(key)); if (value) result[key] = value; }
  if (Object.keys(result).length) result.landingPage = url.pathname;
  return result;
}
export function captureAttribution(storage: StorageLike, href: string, consent: TrackingConsent, now = Date.now()) {
  try {
    if (!consent.analytics && !consent.ads) { storage.removeItem(ATTRIBUTION_KEY); return; }
    const values = attributionFromUrl(href, consent);
    if (Object.keys(values).length) storage.setItem(ATTRIBUTION_KEY, JSON.stringify({ values, savedAt: now }));
  } catch { /* Storage or malformed URL must never interrupt checkout. */ }
}
export function readCheckoutAttribution(storage: StorageLike, href: string, consent: TrackingConsent, now = Date.now()): Record<string, string> {
  if (!consent.analytics && !consent.ads) return {};
  let saved: Record<string, string> = {};
  try {
    const record = JSON.parse(storage.getItem(ATTRIBUTION_KEY) || "null");
    if (record && Number.isFinite(record.savedAt) && record.savedAt <= now && now - record.savedAt < ATTRIBUTION_TTL && record.values && typeof record.values === "object") {
      // Revalidate stored values and reject the legacy unbounded format.
      const url = new URL("https://attribution.invalid/");
      for (const [query, field] of Object.entries(campaignFields)) if (typeof record.values[field] === "string") url.searchParams.set(query, record.values[field]);
      for (const key of clickFields) if (typeof record.values[key] === "string") url.searchParams.set(key, record.values[key]);
      saved = attributionFromUrl(url.href, consent);
      if (["/", "/comprar"].includes(record.values.landingPage)) saved.landingPage = record.values.landingPage;
    } else storage.removeItem(ATTRIBUTION_KEY);
  } catch { /* Empty fallback. */ }
  return { ...saved, ...attributionFromUrl(href, consent) };
}
type Commands = { google: (...args: unknown[]) => void; meta: (...args: unknown[]) => void; loadScript: (id: string, src: string) => void };
type CheckoutEvent = "begin_checkout" | "order_created";
type CheckoutDetails = { kit: "kit20" | "kit50"; totalCents: number; orderNumber?: string };
function googleConsent(consent: TrackingConsent) {
  return { analytics_storage: consent.analytics ? "granted" : "denied", ad_storage: consent.ads ? "granted" : "denied", ad_user_data: consent.ads ? "granted" : "denied", ad_personalization: consent.ads ? "granted" : "denied" };
}
export function createMeasurementRuntime(input: MeasurementConfig, commands: Commands) {
  const config = normalizeMeasurementConfig(input);
  let currentConsent = DENIED_CONSENT;
  let location = "";
  let googleLoaded = false, analyticsConfigured = false, adsConfigured = false, metaLoaded = false;
  let lastAnalyticsPage = "", lastMetaPage = "";
  const orderIds = new Set<string>();
  return {
    start(consent: TrackingConsent, href: string) {
      const url = new URL(href);
      const permitted = isTrackingPage(url.pathname);
      currentConsent = permitted ? consent : DENIED_CONSENT;
      location = url.origin + url.pathname;
      if (googleLoaded) commands.google("consent", "update", googleConsent(currentConsent));
      if (metaLoaded) commands.meta("consent", currentConsent.ads ? "grant" : "revoke");
      if (!permitted || (!consent.analytics && !consent.ads)) { lastAnalyticsPage = ""; lastMetaPage = ""; return; }
      if ((consent.analytics && config.ga4Id) || (consent.ads && config.googleAdsId)) {
        if (!googleLoaded) {
          commands.google("consent", "default", googleConsent(DENIED_CONSENT));
          commands.google("set", { ads_data_redaction: true, allow_google_signals: false, allow_ad_personalization_signals: false, page_referrer: "", page_location: location, send_page_view: false });
          commands.google("consent", "update", googleConsent(consent));
          commands.google("js", new Date());
          commands.loadScript("lordnutri-google-tag", `https://www.googletagmanager.com/gtag/js?id=${consent.analytics && config.ga4Id ? config.ga4Id : config.googleAdsId}`);
          googleLoaded = true;
        }
        commands.google("set", { page_location: location, page_referrer: "" });
        if (consent.analytics && config.ga4Id && !analyticsConfigured) {
          commands.google("config", config.ga4Id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: location, page_referrer: "" });
          analyticsConfigured = true;
        }
        if (consent.ads && config.googleAdsId && !adsConfigured) {
          commands.google("config", config.googleAdsId, { send_page_view: false, allow_ad_personalization_signals: false, page_location: location, page_referrer: "" });
          adsConfigured = true;
        }
      }
      if (consent.ads && config.metaPixelId && !metaLoaded) {
        commands.meta("consent", "grant");
        commands.meta("set", "autoConfig", false, config.metaPixelId);
        commands.meta("init", config.metaPixelId);
        commands.loadScript("lordnutri-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
        metaLoaded = true;
      }
      if (consent.analytics && config.ga4Id && lastAnalyticsPage !== location) {
        commands.google("event", "page_view", { send_to: config.ga4Id, page_location: location, page_referrer: "" });
        lastAnalyticsPage = location;
      }
      if (consent.ads && config.metaPixelId && lastMetaPage !== location) {
        commands.meta("trackSingle", config.metaPixelId, "PageView");
        lastMetaPage = location;
      }
    },
    checkout(event: CheckoutEvent, details: CheckoutDetails) {
      if (!currentConsent.analytics && !currentConsent.ads) return;
      if (!["kit20", "kit50"].includes(details.kit) || !Number.isSafeInteger(details.totalCents) || details.totalCents < 0) return;
      const orderId = token(details.orderNumber || null, 80);
      if (event === "order_created" && orderId) { if (orderIds.has(orderId)) return; orderIds.add(orderId); }
      const value = details.totalCents / 100;
      const parameters = { currency: "BRL", value, items: [{ item_id: details.kit, item_name: details.kit.toUpperCase(), quantity: 1, ...(event === "begin_checkout" ? { price: value } : {}) }], page_location: location, page_referrer: "" };
      if (currentConsent.analytics && config.ga4Id) commands.google("event", event, { ...parameters, send_to: config.ga4Id });
      if (currentConsent.ads && config.metaPixelId) commands.meta(event === "begin_checkout" ? "trackSingle" : "trackSingleCustom", config.metaPixelId, event === "begin_checkout" ? "InitiateCheckout" : "OrderCreated", { currency: "BRL", value, content_ids: [details.kit], content_type: "product", num_items: 1 });
      if (event === "order_created" && currentConsent.ads && config.googleAdsId && config.checkoutLabel) commands.google("event", "conversion", { send_to: `${config.googleAdsId}/${config.checkoutLabel}`, currency: "BRL", value: 0, ...(orderId ? { transaction_id: orderId } : {}), page_location: location, page_referrer: "" });
    },
    hasLoadedTags() { return googleLoaded || metaLoaded; },
  };
}
