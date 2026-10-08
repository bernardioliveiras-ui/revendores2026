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

/*
 * 1.5: desktop e mobile deixam de compartilhar a mesma regra de override.
 * Isso elimina o vazamento clássico em que uma largura/margem ajustada no
 * computador continuava ativa no celular até ser sobrescrita manualmente.
 */
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

function scanTargets(root: HTMLElement | null): RuntimeTargets {
  if (!root) return {};
  const next: RuntimeTargets = {};
  for (const kind of ["google-dynamic", "simulator", "checkout"] as const) {
    const node = root.querySelector<HTMLElement>(`[data-ln-protected="${kind}"]`);
    if (node) next[kind] = node;
  }
  return next;
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
      setTargets(scanTargets(rootRef.current));
      setScanned(true);
    };
    // Duas frames garantem que o innerHTML publicado terminou de entrar no DOM.
    raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(run); });
    return () => { cancelled = true; cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [html]);

  useEffect(() => {
    if (!scanned) return;
    setRuntimeChecked(false);
    const timer = window.setTimeout(() => {
      setReady({
        google: Boolean(targets["google-dynamic"]?.querySelector(".ln-google-score")),
        simulator: Boolean(targets.simulator?.querySelector(".simulator-grid")),
        checkout: Boolean(targets.checkout?.querySelector("form.checkout-card")),
      });
      setRuntimeChecked(true);
    }, 160);
    return () => window.clearTimeout(timer);
  }, [scanned, targets]);

  const missingGoogle = scanned && runtimeChecked && (!targets["google-dynamic"] || !ready.google);
  const missingSimulator = scanned && runtimeChecked && (!targets.simulator || !ready.simulator);
  const missingCheckout = scanned && runtimeChecked && (!targets.checkout || !ready.checkout);

  return (
    <main className="lnr-page lnr-studio-published">
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <div ref={rootRef} className="lnr-studio-document" dangerouslySetInnerHTML={{ __html: html }} />

      {targets["google-dynamic"] ? createPortal(<GoogleReviewsDynamic />, targets["google-dynamic"]) : null}
      {targets.simulator ? createPortal(<ProfitSimulator />, targets.simulator) : null}
      {targets.checkout ? createPortal(<CheckoutForm />, targets.checkout) : null}

      {/* Fallbacks reais: se um slot existir mas o componente não montar, a função continua disponível. */}
      {missingGoogle ? <div className="lnr-proof-section lnr-runtime-recovery" data-ln-runtime-recovery="google"><GoogleReviews /></div> : null}
      {missingSimulator ? <section id="simulador-recuperado" className="lnr-section lnr-simulator lnr-runtime-recovery" data-ln-runtime-recovery="simulator"><div className="lnr-shell"><div className="lnr-section-head"><span className="lnr-eyebrow">NÚMEROS E SIMULADOR</span><h2>Quanto você quer construir de ganho bruto por mês?</h2><p>Faturamento e ganho bruto são diferentes. Aqui, a conta considera o preço de venda menos o custo das caixas. Inclua suas despesas para refinar o resultado.</p></div><ProfitSimulator /></div></section> : null}
      {missingCheckout ? <section id="checkout-recuperado" className="lnr-section lnr-checkout lnr-runtime-recovery" data-ln-runtime-recovery="checkout"><div className="lnr-shell lnr-checkout-layout"><div><span className="lnr-eyebrow">COMECE SUA REVENDA</span><h2>Escolha seu kit</h2><p>Antes de pagar, você vê o valor dos produtos, o frete e as condições de parcelamento.</p></div><CheckoutForm /></div></section> : null}
    </main>
  );
}
