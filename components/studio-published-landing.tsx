"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { ProfitSimulator } from "@/components/profit-simulator";
import { GoogleReviews, GoogleReviewsDynamic } from "@/components/google-reviews";

type Device = "desktop" | "mobile";
type StyleMap = Record<string, Partial<Record<Device, Record<string, string>>>>;

function kebab(value: string) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

export function buildStudioCss(styles: StyleMap | undefined) {
  if (!styles) return "";
  const desktop: string[] = [];
  const mobile: string[] = [];
  const make = (id: string, values: Record<string, string> | undefined) => {
    if (!values || !Object.keys(values).length) return "";
    const body = Object.entries(values).map(([property, value]) => `${kebab(property)}:${value}!important`).join(";");
    return `[data-studio-id="${id}"]{${body}}`;
  };
  for (const [id, devices] of Object.entries(styles)) {
    const base = make(id, devices.desktop);
    const mob = make(id, devices.mobile);
    if (base) desktop.push(base);
    if (mob) mobile.push(mob);
  }
  return [
    desktop.join("\n"),
    mobile.length ? `@media(max-width:700px){${mobile.join("\n")}}` : "",
  ].filter(Boolean).join("\n");
}

export function StudioPublishedLanding({ html, styles }: { html: string; styles?: StyleMap }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [targets, setTargets] = useState<Record<string, HTMLElement>>({});
  const [scanned, setScanned] = useState(false);
  const css = useMemo(() => buildStudioCss(styles), [styles]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const next: Record<string, HTMLElement> = {};
    for (const kind of ["google-dynamic", "simulator", "checkout"] as const) {
      const node = root.querySelector<HTMLElement>(`[data-ln-protected="${kind}"]`);
      if (node) next[kind] = node;
    }
    setTargets(next);
    setScanned(true);
  }, [html]);

  const missingGoogle = scanned && !targets["google-dynamic"];
  const missingSimulator = scanned && !targets.simulator;
  const missingCheckout = scanned && !targets.checkout;

  return (
    <main className="lnr-page lnr-studio-published">
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <div ref={rootRef} className="lnr-studio-document" dangerouslySetInnerHTML={{ __html: html }} />
      {targets["google-dynamic"] ? createPortal(<GoogleReviewsDynamic />, targets["google-dynamic"]) : null}
      {targets.simulator ? createPortal(<ProfitSimulator />, targets.simulator) : null}
      {targets.checkout ? createPortal(<CheckoutForm />, targets.checkout) : null}

      {missingGoogle ? <div className="lnr-proof-section" data-ln-runtime-recovery="google"><GoogleReviews /></div> : null}
      {missingSimulator ? <section id="simulador-recuperado" className="lnr-section lnr-simulator" data-ln-runtime-recovery="simulator"><div className="lnr-shell"><div className="lnr-section-head"><span className="lnr-eyebrow">SIMULADOR</span><h2>Calcule seu cenário</h2><p>O Studio detectou que o bloco visual do simulador foi removido e restaurou a função automaticamente.</p></div><ProfitSimulator /></div></section> : null}
      {missingCheckout ? <section id="checkout" className="lnr-section lnr-checkout" data-ln-runtime-recovery="checkout"><div className="lnr-shell lnr-checkout-layout"><div><span className="lnr-eyebrow">COMECE SUA REVENDA</span><h2>Escolha seu kit</h2><p>Checkout restaurado automaticamente para manter pagamento, frete e parcelamento disponíveis.</p></div><CheckoutForm /></div></section> : null}
    </main>
  );
}
