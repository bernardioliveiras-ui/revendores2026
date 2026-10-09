"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { ProfitSimulator } from "@/components/profit-simulator";

type Device = "desktop" | "mobile";
type StyleMap = Record<string, Partial<Record<Device, Record<string, string>>>>;
type RuntimeTargets = Partial<Record<"simulator", HTMLElement>>;

function kebab(value: string) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

/*
 * O Studio continua usando estes estilos no PREVIEW do editor.
 * A página pública, porém, não injeta mais esses overrides de geometria.
 * Isso mantém a edição disponível sem permitir que um layout antigo quebre
 * largura, escala, posição ou checkout em produção.
 */
const studioBlockedLayoutProps = new Set([
  "position", "left", "top", "right", "bottom", "zIndex", "order",
  "minWidth", "height", "minHeight", "maxHeight", "gridColumn", "gridRow",
  "alignSelf", "justifySelf", "transform", "translate", "scale", "rotate", "zoom",
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

const recoveryCss = `
.lnr-studio-published{display:flex!important;flex-direction:column!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:clip!important}
.lnr-studio-published>.lnr-studio-document{display:contents!important}
.lnr-studio-published .lnr-studio-document #checkout{display:none!important}
.lnr-studio-published .lnr-proof-section{display:none!important}
.lnr-studio-published .lnr-section,.lnr-studio-published .lnr-shell{box-sizing:border-box!important;min-width:0!important;max-width:100%}
.lnr-studio-published img,.lnr-studio-published video,.lnr-studio-published iframe{max-width:100%!important}
.lnr-studio-published [data-ln-protected="simulator"]{visibility:visible!important;opacity:1!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;transform:none!important}
.lnr-studio-published .lnr-runtime-checkout{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;order:90!important}
.lnr-studio-published .lnr-runtime-checkout .lnr-shell{width:min(1120px,calc(100% - 48px))!important;max-width:1120px!important;margin-inline:auto!important}
.lnr-studio-published .lnr-runtime-checkout .lnr-checkout-layout{display:grid!important;grid-template-columns:minmax(0,1fr)!important;width:100%!important;max-width:100%!important}
.lnr-studio-published .lnr-runtime-checkout .checkout-card{display:block!important;width:100%!important;max-width:100%!important;visibility:visible!important;opacity:1!important}
.lnr-studio-published .lnr-footer{order:100!important}
.lnr-studio-published .ln-studio-highlight{display:block;width:100%;text-align:center;font-weight:800;color:#d7a83f;line-height:1.08}
.lnr-studio-published .ln-studio-block{min-width:0;max-width:100%}
@media(max-width:700px){
 .lnr-studio-published .lnr-runtime-checkout .lnr-shell{width:calc(100% - 32px)!important}
 .lnr-studio-published .lnr-runtime-checkout .lnr-checkout-layout{grid-template-columns:1fr!important}
}
`;

function sanitizePublishedDom(root: HTMLElement) {
  root.querySelectorAll("script,style,noscript,.lnr-proof-section,#checkout").forEach((node) => node.remove());
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    el.removeAttribute("style");
    el.removeAttribute("hidden");
    el.removeAttribute("contenteditable");
    el.removeAttribute("draggable");
    el.removeAttribute("data-studio-selected");
    el.removeAttribute("data-studio-drop");
    el.removeAttribute("data-studio-dragging");
  });

  // Se versões antigas colocaram uma seção dentro de outra, devolve a seção ao fluxo principal.
  const footer = root.querySelector<HTMLElement>("footer.lnr-footer");
  const nestedSections = Array.from(root.querySelectorAll<HTMLElement>("section.lnr-section section.lnr-section"));
  for (const section of nestedSections) {
    if (footer) root.insertBefore(section, footer); else root.appendChild(section);
  }
  if (footer) root.appendChild(footer);
}

function ensureSimulatorTarget(root: HTMLElement | null): HTMLElement | undefined {
  if (!root) return undefined;
  const existing = root.querySelector<HTMLElement>('[data-ln-protected="simulator"]');
  if (existing) return existing;
  const host = root.querySelector<HTMLElement>("#simulador-calculo") || root.querySelector<HTMLElement>("#simulador .lnr-shell");
  if (!host) return undefined;
  const marker = root.ownerDocument.createElement("div");
  marker.setAttribute("data-ln-protected", "simulator");
  marker.setAttribute("data-ln-runtime-created", "1");
  host.appendChild(marker);
  return marker;
}

export function StudioPublishedLanding({ html, styles: _styles }: { html: string; styles?: StyleMap }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [targets, setTargets] = useState<RuntimeTargets>({});
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    const run = () => {
      const root = rootRef.current;
      if (!root) return;
      sanitizePublishedDom(root);
      setTargets({ simulator: ensureSimulatorTarget(root) });
      setScanned(true);
    };
    raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(run); });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [html]);

  const missingSimulator = scanned && !targets.simulator;

  return (
    <main className="lnr-page lnr-studio-published">
      <style dangerouslySetInnerHTML={{ __html: recoveryCss }} />
      <div ref={rootRef} className="lnr-studio-document" dangerouslySetInnerHTML={{ __html: html }} />

      {targets.simulator ? createPortal(<ProfitSimulator />, targets.simulator) : null}
      {missingSimulator ? (
        <section id="simulador-recuperado" className="lnr-section lnr-simulator lnr-runtime-recovery" data-ln-runtime-recovery="simulator">
          <div className="lnr-shell"><ProfitSimulator /></div>
        </section>
      ) : null}

      {/* 1.7: checkout sai definitivamente do HTML editável do Studio. */}
      <section id="checkout" className="lnr-section lnr-checkout lnr-runtime-checkout" data-ln-runtime-recovery="checkout">
        <div className="lnr-shell lnr-checkout-layout"><CheckoutForm /></div>
      </section>
    </main>
  );
}
