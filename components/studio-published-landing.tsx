"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { ProfitSimulator } from "@/components/profit-simulator";
import { GoogleReviewsDynamic } from "@/components/google-reviews";

type Device = "desktop" | "tablet" | "mobile";
type StyleMap = Record<string, Partial<Record<Device, Record<string, string>>>>;

function kebab(value: string) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

export function buildStudioCss(styles: StyleMap | undefined) {
  if (!styles) return "";
  const desktop: string[] = [];
  const tablet: string[] = [];
  const mobile: string[] = [];
  const make = (id: string, values: Record<string, string> | undefined) => {
    if (!values || !Object.keys(values).length) return "";
    const body = Object.entries(values).map(([property, value]) => `${kebab(property)}:${value}`).join(";");
    return `[data-studio-id="${id}"]{${body}}`;
  };
  for (const [id, devices] of Object.entries(styles)) {
    const base = make(id, devices.desktop);
    const tab = make(id, devices.tablet);
    const mob = make(id, devices.mobile);
    if (base) desktop.push(base);
    if (tab) tablet.push(tab);
    if (mob) mobile.push(mob);
  }
  return [
    desktop.join("\n"),
    tablet.length ? `@media(max-width:980px){${tablet.join("\n")}}` : "",
    mobile.length ? `@media(max-width:640px){${mobile.join("\n")}}` : "",
  ].filter(Boolean).join("\n");
}

export function StudioPublishedLanding({ html, styles }: { html: string; styles?: StyleMap }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [targets, setTargets] = useState<Record<string, HTMLElement>>({});
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
  }, [html]);

  return (
    <main className="lnr-page lnr-studio-published">
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <div ref={rootRef} className="lnr-studio-document" dangerouslySetInnerHTML={{ __html: html }} />
      {targets["google-dynamic"] ? createPortal(<GoogleReviewsDynamic />, targets["google-dynamic"]) : null}
      {targets.simulator ? createPortal(<ProfitSimulator />, targets.simulator) : null}
      {targets.checkout ? createPortal(<CheckoutForm />, targets.checkout) : null}
    </main>
  );
}
