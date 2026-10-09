"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, CONSENT_KEY, isTrackingPage } from "@/lib/measurement";
import { chooseConsent, currentConsent, handleConsentStorageChange, initializeMeasurement, installMeasurementNavigationGuard, measurementEnabled } from "@/lib/measurement-browser";

export function MeasurementConsent() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const choice = currentConsent();
      setAnalytics(choice?.analytics || false); setAds(choice?.ads || false);
      setOpen(!choice); setReady(true);
      initializeMeasurement();
    }, 0);
    const removeGuard = installMeasurementNavigationGuard();
    function sync() { initializeMeasurement(); }
    function storageChanged(event: StorageEvent) { if (event.key === CONSENT_KEY || event.key === null) handleConsentStorageChange(); }
    window.addEventListener("storage", storageChanged);
    window.addEventListener(CONSENT_EVENT, sync);
    return () => { window.clearTimeout(timer); removeGuard(); window.removeEventListener("storage", storageChanged); window.removeEventListener(CONSENT_EVENT, sync); };
  }, [pathname]);
  if (!ready || !measurementEnabled || !isTrackingPage(pathname)) return null;
  function save(nextAnalytics: boolean, nextAds: boolean) {
    setAnalytics(nextAnalytics); setAds(nextAds); setOpen(false);
    chooseConsent({ analytics: nextAnalytics, ads: nextAds });
  }
  const button = { border: "1px solid #9caa9f", borderRadius: 8, padding: "10px 14px", minHeight: 44, cursor: "pointer", font: "inherit", fontWeight: 700 } as const;
  return <>
    {!open && <button type="button" onClick={() => setOpen(true)} style={{ ...button, position: "fixed", left: 12, bottom: 12, zIndex: 80, background: "#fff", color: "#153b30", fontSize: 12 }}>Preferências de cookies</button>}
    {open && <section role="dialog" aria-modal="false" aria-labelledby="consent-title" style={{ position: "fixed", bottom: 12, left: 12, right: 12, margin: "0 auto", maxWidth: 640, maxHeight: "calc(100dvh - 24px)", overflowY: "auto", zIndex: 100, background: "#fff", color: "#18352b", border: "1px solid #aebfb3", borderRadius: 16, padding: "20px", boxShadow: "0 8px 40px #0003", fontSize: 14, lineHeight: 1.5 }}>
      <h2 id="consent-title" style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800 }}>Sua escolha de privacidade</h2>
      <p style={{ margin: "0 0 14px" }}>O site e a compra funcionam sem cookies opcionais. Com sua permissão, usamos Google Analytics para medir visitas e Google Ads/Meta para medir anúncios, etapas de checkout e compras confirmadas. Você pode mudar sua escolha a qualquer momento.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 22px", marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}><input type="checkbox" checked={analytics} onChange={event => setAnalytics(event.target.checked)} style={{ width: 20, height: 20 }} />Análise de visitas</label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}><input type="checkbox" checked={ads} onChange={event => setAds(event.target.checked)} style={{ width: 20, height: 20 }} />Publicidade e mensuração</label>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={() => save(false, false)} style={{ ...button, background: "#fff", color: "#18352b" }}>Recusar opcionais</button>
        <button type="button" onClick={() => save(analytics, ads)} style={{ ...button, background: "#fff", color: "#18352b" }}>Salvar escolhas</button>
        <button type="button" onClick={() => save(true, true)} style={{ ...button, background: "#153b30", color: "#fff" }}>Aceitar opcionais</button>
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 12 }}><a href="/politica-de-privacidade" style={{ textDecoration: "underline" }}>Política de privacidade</a> · <a href="/cookies" style={{ textDecoration: "underline" }}>Política de cookies</a></p>
    </section>}
  </>;
}
