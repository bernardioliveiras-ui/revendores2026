"use client";
import { ATTRIBUTION_KEY, CONSENT_EVENT, DENIED_CONSENT, captureAttribution, cleanTrackingUrl, createMeasurementRuntime, isTrackingPage, normalizeMeasurementConfig, readCheckoutAttribution, readConsent, saveConsent, type TrackingConsent } from "./measurement";
import { PURCHASE_RECEIPTS_KEY, collectPurchaseIdentifiers, rememberPurchaseReceipt, syncPurchaseReceipts } from "./purchase-measurement-browser";

export const measurementConfig = normalizeMeasurementConfig({
  ga4Id: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
  googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
  checkoutLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_LABEL,
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
});
export const measurementEnabled = Boolean(measurementConfig.ga4Id || measurementConfig.googleAdsId || measurementConfig.metaPixelId);
type PixelFunction = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; push?: PixelFunction; loaded: boolean; version: string };
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; fbq?: PixelFunction; _fbq?: PixelFunction; }
}
let runtime: ReturnType<typeof createMeasurementRuntime> | null = null;
let memoryConsent: TrackingConsent | null = null;
let originalLanding = "";
function consent() {
  if (memoryConsent) return memoryConsent;
  try { return readConsent(window.localStorage) || DENIED_CONSENT; } catch { return DENIED_CONSENT; }
}
function loadScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id; script.async = true; script.src = src; script.referrerPolicy = "origin";
  document.head.appendChild(script);
}
function google(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = google;
  // Google consumes the official arguments-object command format.
  // eslint-disable-next-line prefer-rest-params
  if (args.length) window.dataLayer.push(arguments);
}
function meta(...args: unknown[]) {
  if (!window.fbq) {
    const fbq: PixelFunction = Object.assign(function (...values: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...values); else fbq.queue.push(values);
    }, { queue: [] as unknown[][], loaded: true, version: "2.0" });
    fbq.push = fbq;
    window.fbq = fbq; window._fbq = fbq;
  }
  window.fbq(...args);
}
export function currentConsent(): TrackingConsent | null {
  if (memoryConsent) return memoryConsent;
  try { return readConsent(window.localStorage); } catch { return null; }
}
export function initializeMeasurement() {
  void syncPurchasePrivacy();
  if (!measurementEnabled || !isTrackingPage(window.location.pathname)) {
    runtime?.start(DENIED_CONSENT, window.location.href);
    return;
  }
  if (!originalLanding) originalLanding = window.location.href;
  runtime ||= createMeasurementRuntime(measurementConfig, { google, meta, loadScript });
  const choice = consent();
  memoryConsent = choice;
  try { captureAttribution(window.localStorage, originalLanding, choice); } catch { /* Restricted storage. */ }
  if (choice.analytics || choice.ads) {
    // External SDKs may read document.location. Remove all arbitrary parameters before loading either SDK.
    const safe = cleanTrackingUrl(window.location.href);
    if (safe !== window.location.href) window.history.replaceState(window.history.state, "", safe);
  }
  runtime.start(choice, window.location.href);
}
export function chooseConsent(choice: TrackingConsent) {
  const previous = consent();
  memoryConsent = choice;
  try {
    saveConsent(window.localStorage, choice);
    if (!choice.analytics && !choice.ads) window.localStorage.removeItem(ATTRIBUTION_KEY);
  } catch { /* Current choice remains active. */ }
  initializeMeasurement();
  window.dispatchEvent(new Event(CONSENT_EVENT));
  // A new document unloads SDKs after withdrawal instead of leaving listeners alive.
  if ((previous.analytics && !choice.analytics) || (previous.ads && !choice.ads)) window.location.reload();
}
async function syncPurchasePrivacy() {
  if (typeof window === "undefined") return;
  try {
    await syncPurchaseReceipts(window.localStorage, consent(), async body => {
      const response = await fetch("/api/public/measurement/consent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true, signal: AbortSignal.timeout(5000) });
      return response.status;
    });
  } catch { /* Storage/network restrictions never block the purchase. */ }
}
export async function checkoutMeasurement() {
  try {
    if (!measurementEnabled || !isTrackingPage(window.location.pathname)) return undefined;
    if (!consent().analytics && !consent().ads) return undefined;
    // Durable server delivery requires a durable local withdrawal receipt.
    const stored = window.localStorage.getItem(PURCHASE_RECEIPTS_KEY);
    window.localStorage.setItem(PURCHASE_RECEIPTS_KEY, stored || "[]");
    return await collectPurchaseIdentifiers(measurementConfig, consent, field => new Promise(resolve => {
      const timer = window.setTimeout(() => resolve(undefined), 350);
      if (!window.gtag) { window.clearTimeout(timer); resolve(undefined); return; }
      window.gtag("get", measurementConfig.ga4Id, field, (value: unknown) => { window.clearTimeout(timer); resolve(value); });
    }), () => document.cookie);
  } catch { return undefined; }
}
export function rememberCheckoutMeasurement(value: unknown) {
  try { rememberPurchaseReceipt(window.localStorage, value); } catch { /* Restricted storage. */ }
  void syncPurchasePrivacy();
}
export function handleConsentStorageChange() {
  const previous = consent();
  memoryConsent = null;
  const updated = consent();
  initializeMeasurement();
  if ((previous.analytics && !updated.analytics) || (previous.ads && !updated.ads)) window.location.reload();
}
export function checkoutAttribution() {
  if (!measurementEnabled) return {};
  try { return readCheckoutAttribution(window.localStorage, originalLanding || window.location.href, consent()); } catch { return {}; }
}
export function trackCheckout(event: "begin_checkout" | "order_created", details: { kit: "kit20" | "kit50" | "mix10-unit"; totalCents: number; orderNumber?: string }) {
  try {
    if (!measurementEnabled || !isTrackingPage(window.location.pathname)) return;
    initializeMeasurement();
    runtime?.checkout(event, details);
  } catch { /* Tag errors never interrupt payment. */ }
}
export function installMeasurementNavigationGuard() {
  function click(event: MouseEvent) {
    if (!runtime?.hasLoadedTags() || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!(anchor instanceof HTMLAnchorElement) || anchor.download || (anchor.target && anchor.target !== "_self")) return;
    const url = new URL(anchor.href);
    if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
    // Full document navigation keeps marketing SDKs out of the authenticated portal.
    event.preventDefault(); event.stopPropagation(); window.location.assign(url.href);
  }
  function popstate() {
    if (runtime?.hasLoadedTags() && !isTrackingPage(window.location.pathname)) {
      runtime.start(DENIED_CONSENT, window.location.href);
      window.location.reload();
    }
  }
  document.addEventListener("click", click, true);
  window.addEventListener("popstate", popstate);
  return () => { document.removeEventListener("click", click, true); window.removeEventListener("popstate", popstate); };
}
