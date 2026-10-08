"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { ProfitSimulator } from "@/components/profit-simulator";
import { GoogleReviews, GoogleReviewsDynamic } from "@/components/google-reviews";

type Device = "desktop" | "mobile";
type StyleMap = Record<string, Partial<Record<Device, Record<string, string>>>>;
type RuntimeTargets = Partial<Record<"google-dynamic" | "simulator" | "checkout", HTMLElement>>;
type RuntimeReady = { google: boolean; simulator: boolean; checkout: boolean };

function kebab(value: string) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

const studioBlockedLayoutProps = new Set([
  "position", "left", "top", "right", "bottom", "zIndex", "order",
  "minWidth", "height", "minHeight", "maxHeight", "gridColumn", "gridRow",
  "alignSelf", "justifySelf",
]);
const geometryProps = new Set([
  "width", "maxWidth", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "gap", "columnGap", "rowGap",
]);

function stableStudioValue(property: string, raw: string) {
  const value = raw.trim();
  if (!value || studioBlockedLayoutProps.has(property)) return "";
  if (geometryProps.has(property) && /(?:vw|vh|vmin|vmax)/i.test(value)) return "";
  if (/^margin/i.test(property) && /^-/.test(value)) return "0";
  if (property === "width" || property === "maxWidth") {
    const percent = value.match(/^([0-9.]+)%$/);
    if (percent) return `${Math.max(10, Math.min(100, Number(percent[1]) || 100))}%`;
    const px = value.match(/^([0-9.]+)px$/);
    if (px) return `${Math.max(24, Math.min(1120, Number(px[1]) || 24))}px`;
  }
  return value;
}

export function buildStudioCss(styles: StyleMap | undefined) {
  if (!styles) return "";
  const desktop: string[] = [];
  const mobile: string[] = [];
  const make = (id: string, values: Record<string, string> | undefined) => {
    if (!values || !Object.keys(values).length) return "";
    const body = Object.entries(values)
      .map(([property, value]) => [property, stableStudioValue(property, value)] as const)
      .filter(([, value]) => Boolean(value))
      .map(([property, value]) => `${kebab(property)}:${value}!important`)
      .join(";");
    return body ? `[data-studio-id="${id}"]{${body}}` : "";
  };
  for (const [id, devices] of Object.entries(styles)) {
    const desk = make(id, devices.desktop);
    const mob = make(id, devices.mobile);
    if (desk) desktop.push(desk);
    if (mob) mobile.push(mob);
  }
  return [
    desktop.length ? `@media(min-width:701px){${desktop.join("\n")}}` : "",
    mobile.length ? `@media(max-width:700px){${mobile.join("\n")}}` : "",
  ].filter(Boolean).join("\n");
}

/*
 * 1.6: CSS de segurança é injetado DEPOIS dos estilos do Studio.
 * Assim um rascunho antigo nunca consegue manter checkout/simulador ocultos
 * com display:none, opacity:0, width:0 etc.
 */
const criticalSafetyCss = `
.lnr-studio-published{overflow-x:clip!important}
.lnr-studio-published .lnr-studio-document{min-width:0!important;max-width:100%!important}
.lnr-studio-published .lnr-section,.lnr-studio-published .lnr-shell{box-sizing:border-box!important;min-width:0!important}
.lnr-studio-published img{max-width:100%!important}
.lnr-studio-published #checkout,
.lnr-studio-published #checkout .lnr-shell,
.lnr-studio-published #checkout .lnr-checkout-layout,
.lnr-studio-published [data-ln-protected="checkout"]{
  display:block!important;visibility:visible!important;opacity:1!important;
  width:100%!important;max-width:100%!important;min-width:0!important;
  height:auto!important;min-height:0!important;transform:none!important;
}
.lnr-studio-published #checkout .lnr-checkout-layout{display:grid!important}
.lnr-studio-published [data-ln-protected="checkout"]>.checkout-card{display:block!important;width:100%!important;max-width:100%!important;opacity:1!important;visibility:visible!important}
.lnr-studio-published #simulador,
.lnr-studio-published [data-ln-protected="simulator"]{visibility:visible!important;opacity:1!important;min-width:0!important;max-width:100%!important}
.lnr-studio-published [data-ln-protected="google-dynamic"]{visibility:visible!important;opacity:1!important;max-width:100%!important}
@media(max-width:700px){.lnr-studio-published #checkout .lnr-checkout-layout{grid-template-columns:1fr!important}}
`;

function makeProtectedTarget(root: HTMLElement, kind: "google-dynamic" | "simulator" | "checkout") {
  const existing = root.querySelector<HTMLElement>(`[data-ln-protected="${kind}"]`);
  if (existing) return existing;

  const doc = root.ownerDocument;
  const marker = doc.createElement("div");
  marker.setAttribute("data-ln-protected", kind);
  marker.setAttribute("data-ln-runtime-created", "1");

  if (kind === "checkout") {
    let section = root.querySelector<HTMLElement>("#checkout");
    if (!section) {
      section = doc.createElement("section");
      section.id = "checkout";
      section.className = "lnr-section lnr-checkout lnr-runtime-recovery";
      section.innerHTML = '<div class="lnr-shell lnr-checkout-layout"><div><span class="lnr-eyebrow">COMECE SUA REVENDA</span><h2>Escolha seu kit</h2><p>Antes de pagar, você vê o valor dos produtos, o frete e as condições de parcelamento.</p></div></div>';
      const footer = root.querySelector("footer");
      if (footer) root.insertBefore(section, footer); else root.appendChild(section);
    }
    const layout = section.querySelector<HTMLElement>(".lnr-checkout-layout") || section;
    layout.appendChild(marker);
    return marker;
  }

  if (kind === "simulator") {
    const host = root.querySelector<HTMLElement>("#simulador-calculo") || root.querySelector<HTMLElement>("#simulador .lnr-shell");
    if (host) { host.appendChild(marker); return marker; }
    return null;
  }

  const reviewHost = root.querySelector<HTMLElement>(".lnr-proof-section .ln-reviews") || root.querySelector<HTMLElement>(".lnr-proof-section");
  if (reviewHost) { reviewHost.appendChild(marker); return marker; }
  return null;
}

function ensureTargets(root: HTMLElement | null): RuntimeTargets {
  if (!root) return {};
  const next: RuntimeTargets = {};
  for (const kind of ["google-dynamic", "simulator", "checkout"] as const) {
    const node = makeProtectedTarget(root, kind);
    if (node) next[kind] = node;
  }
  return next;
}

function isVisible(el: HTMLElement | undefined) {
  if (!el) return false;
  const style = el.ownerDocument.defaultView?.getComputedStyle(el);
  return Boolean(style && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || "1") > 0 && el.getClientRects().length > 0);
}

export function StudioPublishedLanding({ html, styles }: { html: string; styles?: StyleMap }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [targets, setTargets] = useState<RuntimeTargets>({});
  const [scanned, setScanned] = useState(false);
  const [ready, setReady] = useState<RuntimeReady>({ google: false, simulator: false, checkout: false });
  const [runtimeChecked, setRuntimeChecked] = useState(false);
  const css = useMemo(() => buildStudioCss(styles), [styles]);

  useEffect(() => {
    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;
    const run = () => {
      if (cancelled) return;
      setTargets(ensureTargets(rootRef.current));
      setScanned(true);
    };
    raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(run); });
    return () => { cancelled = true; cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [html]);

  useEffect(() => {
    if (!scanned) return;
    setRuntimeChecked(false);
    const timer = window.setTimeout(() => {
      setReady({
        google: Boolean(targets["google-dynamic"]?.querySelector(".ln-google-score")) && isVisible(targets["google-dynamic"]),
        simulator: Boolean(targets.simulator?.querySelector(".simulator-grid")) && isVisible(targets.simulator),
        checkout: Boolean(targets.checkout?.querySelector("form.checkout-card")) && isVisible(targets.checkout),
      });
      setRuntimeChecked(true);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [scanned, targets]);

  const missingGoogle = scanned && runtimeChecked && (!targets["google-dynamic"] || !ready.google);
  const missingSimulator = scanned && runtimeChecked && (!targets.simulator || !ready.simulator);
  const missingCheckout = scanned && runtimeChecked && (!targets.checkout || !ready.checkout);

  return (
    <main className="lnr-page lnr-studio-published">
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <style dangerouslySetInnerHTML={{ __html: criticalSafetyCss }} />
      <div ref={rootRef} className="lnr-studio-document" dangerouslySetInnerHTML={{ __html: html }} />

      {targets["google-dynamic"] ? createPortal(<GoogleReviewsDynamic />, targets["google-dynamic"]) : null}
      {targets.simulator ? createPortal(<ProfitSimulator />, targets.simulator) : null}
      {targets.checkout ? createPortal(<CheckoutForm />, targets.checkout) : null}

      {missingGoogle ? <div className="lnr-proof-section lnr-runtime-recovery" data-ln-runtime-recovery="google"><GoogleReviews /></div> : null}
      {missingSimulator ? <section id="simulador-recuperado" className="lnr-section lnr-simulator lnr-runtime-recovery" data-ln-runtime-recovery="simulator"><div className="lnr-shell"><ProfitSimulator /></div></section> : null}
      {missingCheckout ? <section id="checkout-recuperado" className="lnr-section lnr-checkout lnr-runtime-recovery" data-ln-runtime-recovery="checkout"><div className="lnr-shell lnr-checkout-layout"><div><span className="lnr-eyebrow">COMECE SUA REVENDA</span><h2>Escolha seu kit</h2><p>Antes de pagar, você vê o valor dos produtos, o frete e as condições de parcelamento.</p></div><CheckoutForm /></div></section> : null}
    </main>
  );
}
