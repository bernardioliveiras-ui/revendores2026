"use client";
import { landingText, type LandingTexts } from "@/lib/landing-texts";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getRetailProduct, MAX_RETAIL_BOXES, RETAIL_SKU, type KitId } from "@/lib/kits";
import { checkoutAttribution, checkoutMeasurement, rememberCheckoutMeasurement, trackCheckout } from "@/lib/measurement-browser";

type Installment = {
  installments: number;
  installmentValueCents: number;
  chargedValueCents: number;
  interestCents: number;
  hasInterest: boolean;
};

type ShippingOption = {
  id: "economical" | "express";
  label: string;
  priceCents: number;
  deliveryTime: string;
  baseCents: number;
  pix: { chargedValueCents: number; interestCents: number };
  credit: Installment[];
};

type QuoteResponse = {
  postalCode: string;
  address: {street: string; district: string; city: string; state: string};
  kit: { id: KitId | typeof RETAIL_SKU; label: string; boxes: number; productTotalCents: number };
  shippingOptions: ShippingOption[];
};

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const display = {
  kit20: { label: "KIT20", boxes: 20, totalCents: 149800, unitCents: 7490 },
  kit50: { label: "KIT50", boxes: 50, totalCents: 349500, unitCents: 6990 },
} as const;

export function CheckoutForm({texts={}, salesCode}:{texts?:LandingTexts; salesCode?:string}={}) {
  const activityId = useRef("");
  const activityStarted = useRef(false);
  const activityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  async function sendActivity(event: "visit" | "start" | "contact") {
    if (!salesCode || !activityId.current) return;
    const form = formRef.current ? new FormData(formRef.current) : null;
    try {
      await fetch("/api/public/checkout-activity", {
        method: "POST", headers: { "content-type": "application/json" }, keepalive: true, signal: AbortSignal.timeout(4000),
        body: JSON.stringify({ id: activityId.current, code: salesCode, event,
          ...(event === "contact" ? { name: form?.get("name"), phone: form?.get("phone") } : {}) }),
      });
    } catch { /* Falha de contagem não interrompe a compra. */ }
  }
  useEffect(() => {
    if (!salesCode) return;
    try {
      const key = "mix10-checkout-" + salesCode;
      const previous = JSON.parse(sessionStorage.getItem(key) || "null");
      const id = previous && Date.now()-previous.time < 30*60000 ? previous.id : crypto.randomUUID();
      activityId.current = id;
      sessionStorage.setItem(key,JSON.stringify({ id,time:Date.now() }));
    } catch { activityId.current = crypto.randomUUID(); }
    void sendActivity("visit");
    return () => { if (activityTimer.current) clearTimeout(activityTimer.current); };
  // A session belongs to the campaign in the URL.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesCode]);
  function recordActivity() {
    if (!salesCode) return;
    if (!activityStarted.current) { activityStarted.current=true; void sendActivity("start"); }
    if (activityTimer.current) clearTimeout(activityTimer.current);
    activityTimer.current=setTimeout(()=>void sendActivity("contact"),700);
  }
  const quoteSequence = useRef(0);
  const quoteController = useRef<AbortController | null>(null);
  const submitInFlight = useRef(false);
  const [address, setAddress] = useState({street:"",district:"",city:"",state:""});
  const [kit, setKit] = useState<KitId>("kit20");
  const [postalCode, setPostalCode] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [shippingType, setShippingType] = useState<"economical" | "express">("economical");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit">("pix");
  const [installments, setInstallments] = useState(1);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const selected = salesCode ? getRetailProduct(quantity)! : display[kit];

  const activeQuote = quote?.kit.id === (salesCode ? RETAIL_SKU : kit) && (!salesCode || quote.kit.boxes === quantity) && quote.postalCode === postalCode.replace(/\D/g, "") ? quote : null;
  const selectedShipping = useMemo(
    () => activeQuote?.shippingOptions.find((item) => item.id === shippingType) || null,
    [activeQuote, shippingType],
  );
  const selectedInstallment = useMemo(
    () => selectedShipping?.credit.find((item) => item.installments === installments) || selectedShipping?.credit[0] || null,
    [selectedShipping, installments],
  );
  const feeCents = paymentMethod === "credit" ? (selectedInstallment?.interestCents || 0) : 0;
  const finalCents = selectedShipping
    ? paymentMethod === "credit"
      ? (selectedInstallment?.chargedValueCents || selectedShipping.baseCents)
      : selectedShipping.pix.chargedValueCents
    : selected.totalCents;

  useEffect(() => {
    const timer = setTimeout(() => {
      const requested = new URLSearchParams(window.location.search).get("kit");
      if (requested === "kit20" || requested === "kit50") setKit(requested);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function invalidateQuote() {
    quoteSequence.current++;
    quoteController.current?.abort();
    setQuote(null);
    setQuoteBusy(false);
  }

  async function loadQuote(rawPostalCode: string, requestedKit = kit, requestedQuantity = quantity) {
    const sequence = ++quoteSequence.current;
    quoteController.current?.abort();
    const controller = new AbortController();
    quoteController.current = controller;
    const cleanPostalCode = rawPostalCode.replace(/\D/g, "").slice(0, 8);
    if (cleanPostalCode.length !== 8) {
      setQuote(null);
      setQuoteError(landingText(texts, "checkout.postalCodeIncomplete"));
      return;
    }
    setQuoteBusy(true);
    setQuoteError("");
    try {
      const response = await fetch("/api/public/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
        body: JSON.stringify({ postalCode: cleanPostalCode, ...(salesCode ? { retail: true, quantity: requestedQuantity } : { kit: requestedKit }) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || landingText(texts, "checkout.quoteUnavailable"));
      if (sequence !== quoteSequence.current) return;
      setQuote(body as QuoteResponse);
      setAddress(body.address);
      setShippingType("economical");
      setInstallments(1);
    } catch (cause) {
      if (sequence !== quoteSequence.current) return;
      setQuote(null);
      setQuoteError(cause instanceof Error ? cause.message : landingText(texts, "checkout.quoteUnavailable"));
    } finally {
      if (sequence === quoteSequence.current) setQuoteBusy(false);
    }
  }

  function chooseKit(id: KitId) {
    setKit(id);
    invalidateQuote();
    setInstallments(1);
    setQuoteError("");
    if (postalCode.replace(/\D/g, "").length === 8) void loadQuote(postalCode, id);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitInFlight.current) return;
    setError("");
    if (!selectedShipping) {
      setError(landingText(texts, "checkout.shippingRequired"));
      return;
    }
    if (paymentMethod === "credit" && !selectedInstallment) {
      setError(landingText(texts, "checkout.installmentRequired"));
      return;
    }
    submitInFlight.current = true;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const attribution = checkoutAttribution();
    // Código da campanha é operacional, não é pixel/consentimento de anúncios.
    let campaignCode = "";
    try {
      const direct = new URLSearchParams(location.search).get("campanha") || "";
      if (/^[a-f0-9]{32}$/.test(direct)) { sessionStorage.setItem("ln_campaign",direct); campaignCode=direct; }
      else campaignCode=sessionStorage.getItem("ln_campaign") || "";
    } catch { /* Cookie do redirecionamento também é aceito no servidor. */ }
    trackCheckout("begin_checkout", { kit: salesCode ? RETAIL_SKU : kit, totalCents: selected.totalCents });
    const payload = {
      ...Object.fromEntries(form.entries()),
      shippingType,
      paymentMethod,
      installments: paymentMethod === "credit" ? installments : 1,
      campaignCode,
      ...(salesCode ? { salesCode, quantity, checkoutSessionId: activityId.current } : {}),
      utmSource: attribution.utmSource || "",
      utmMedium: attribution.utmMedium || "",
      utmCampaign: attribution.utmCampaign || "",
      utmContent: attribution.utmContent || "",
    };
    try {
      if (salesCode) await sendActivity("contact");
      const measurement = await checkoutMeasurement();
      const response = await fetch("/api/public/checkout", {
        method: "POST",
        signal: AbortSignal.timeout(75000),
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, measurement }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || landingText(texts, "checkout.paymentUnavailable"));
      if (salesCode) {
        try { sessionStorage.removeItem("mix10-checkout-" + salesCode); } catch { /* storage may be disabled */ }
      }
      rememberCheckoutMeasurement(body.measurement);
      trackCheckout("order_created", { kit: salesCode ? RETAIL_SKU : kit, totalCents: finalCents, orderNumber: body.orderNumber });
      window.location.href = body.invoiceUrl;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : landingText(texts, "checkout.paymentUnavailable"));
      setBusy(false);
      submitInFlight.current = false;
    }
  }

  return (
    <form ref={formRef} onChange={recordActivity} onBlur={salesCode ? ()=>void sendActivity("contact") : undefined} className="checkout-card" data-cms-text-protected="1" onSubmit={submit}>
      {salesCode ? <>
        <h3>Seu pedido</h3>
        <div className="retail-quantity">
          <label>Quantidade de caixas
            <select className="mt-2 block min-h-11 w-full rounded-xl border border-[#cbdad2] bg-white px-3 text-base" value={quantity} disabled={busy} onChange={event => {
              const next = Number(event.target.value);
              setQuantity(next);
              invalidateQuote();
              setQuoteError("");
              if (postalCode.replace(/\D/g, "").length === 8) void loadQuote(postalCode, kit, next);
            }}>
              {Array.from({ length: MAX_RETAIL_BOXES }, (_, index) => index + 1).map(value =>
                <option key={value} value={value}>{value} {value === 1 ? "caixa" : "caixas"}</option>
              )}
            </select>
          </label>

        </div>
      </> : <>
      <div className="section-kicker">{landingText(texts, "checkout.004")}</div>
      <h3>{landingText(texts, "checkout.005")}</h3>

      <div className="kit-toggle" role="group" aria-label={landingText(texts, "checkout.006")}>
        {(Object.keys(display) as KitId[]).map((id) => (
          <button key={id} type="button" className={kit === id ? "active" : ""} onClick={() => chooseKit(id)}>
            <strong>{display[id].label}</strong><span>{display[id].boxes} {landingText(texts, "checkout.008")}{money(display[id].unitCents)}{landingText(texts, "checkout.009")}</span>
          </button>
        ))}
      </div>
      <input type="hidden" name="kit" value={kit} />
      </>}

      <div className="checkout-summary checkout-breakdown" aria-live="polite">
        <span>{landingText(texts, "checkout.010")}</span><strong>{money(selected.totalCents)}</strong>
        <span>{landingText(texts, "checkout.011")}</span><strong>{selectedShipping ? money(selectedShipping.priceCents) : landingText(texts, "checkout.012")}</strong>
        <span>{salesCode ? "Encargos do cartão" : landingText(texts, "checkout.013")}</span><strong>{selectedShipping ? money(feeCents) : landingText(texts, "checkout.014")}</strong>
        <span className="checkout-total-label">{landingText(texts, "checkout.015")}</span><strong className="checkout-total-value">{selectedShipping ? money(finalCents) : landingText(texts, "checkout.016")}</strong>
        <small>{salesCode ? "O pagamento é concluído no Asaas." : landingText(texts, "checkout.017")}</small>
      </div>

      {salesCode?<p className="text-sm">Se precisar de ajuda para concluir, a equipe LORD NUTRI poderá entrar em contato pelo telefone informado. <a href="/politica-de-privacidade" className="underline">Privacidade</a></p>:null}
      <div className="form-grid">
        <label>{landingText(texts, "checkout.018")}<input required name="name" autoComplete="name" /></label>
        <label>{landingText(texts, "checkout.019")}<input required type="email" name="email" autoComplete="email" /></label>
        <label>{landingText(texts, "checkout.020")}<input required name="phone" inputMode="tel" autoComplete="tel" /></label>
        <label>{landingText(texts, "checkout.021")}<input required name="cpfCnpj" inputMode="numeric" /></label>
        <label className="cep-field">{landingText(texts, "checkout.022")}<div className="cep-row">
            <input
              required
              name="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder={landingText(texts, "checkout.023")}
              value={postalCode}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
                const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
                setPostalCode(formatted);
                invalidateQuote();
                setAddress({street:"",district:"",city:"",state:""});
                setQuoteError("");
              }}
              onBlur={() => { if (postalCode.replace(/\D/g, "").length === 8 && !quote) void loadQuote(postalCode); }}
            />
            <button type="button" className="quote-button" disabled={quoteBusy} onClick={() => void loadQuote(postalCode)}>{quoteBusy ? landingText(texts, "checkout.024") : landingText(texts, "checkout.025")}</button>
          </div>
        </label>
        <label>{landingText(texts, "checkout.026")}<input required name="street" value={address.street} onChange={event => setAddress(current => ({...current, street: event.target.value}))} autoComplete="address-line1" /></label>
        <label>{landingText(texts, "checkout.027")}<input required name="number" /></label>
        <label>{landingText(texts, "checkout.028")}<input name="complement" autoComplete="address-line2" /></label>
        <label>{landingText(texts, "checkout.029")}<input required name="district" value={address.district} onChange={event => setAddress(current => ({...current, district: event.target.value}))} /></label>
        <label>{landingText(texts, "checkout.030")}<input required name="city" value={address.city} onChange={event => setAddress(current => ({...current, city: event.target.value}))} autoComplete="address-level2" /></label>
        <label>{landingText(texts, "checkout.031")}<input required name="state" value={address.state} onChange={event => setAddress(current => ({...current, state: event.target.value.toUpperCase()}))} maxLength={2} autoComplete="address-level1" /></label>
      </div>

      {quoteError ? <div className="form-error quote-error">{quoteError}</div> : null}

      {activeQuote ? (
        <div className="checkout-choice-section">
          <strong className="choice-title">{landingText(texts, "checkout.032")}</strong>
          <div className="shipping-options">
            {activeQuote.shippingOptions.map((option) => (
              <label key={option.id} className={`choice-card ${shippingType === option.id ? "active" : ""}`}>
                <input type="radio" checked={shippingType === option.id} onChange={() => { setShippingType(option.id); setInstallments(1); }} />
                <span><b>{option.label}</b><small>{option.deliveryTime}</small></span>
                <strong>{money(option.priceCents)}</strong>
              </label>
            ))}
          </div>

          <strong className="choice-title">{landingText(texts, "checkout.034")}</strong>
          <div className="payment-options">
            <label className={`choice-card ${paymentMethod === "pix" ? "active" : ""}`}>
              <input type="radio" checked={paymentMethod === "pix"} onChange={() => { setPaymentMethod("pix"); setInstallments(1); }} />
              <span><b>{landingText(texts, "checkout.036")}</b><small>{landingText(texts, "checkout.037")}</small></span>
              <strong>{money(selectedShipping?.baseCents || 0)}</strong>
            </label>
            <label className={`choice-card ${paymentMethod === "credit" ? "active" : ""}`}>
              <input type="radio" checked={paymentMethod === "credit"} onChange={() => setPaymentMethod("credit")} />
              <span><b>{landingText(texts, "checkout.039")}</b><small>{landingText(texts, "checkout.040")}</small></span>
              <strong>{landingText(texts, "checkout.041")}</strong>
            </label>
          </div>

          {paymentMethod === "credit" && selectedShipping ? (
            <label className="installment-select">{landingText(texts, "checkout.042")}<select value={installments} onChange={(event) => setInstallments(Number(event.target.value))}>
                {selectedShipping.credit.map((option) => (
                  <option key={option.installments} value={option.installments}>
                    {option.installments}{landingText(texts, "checkout.043")}{money(option.installmentValueCents)}{option.hasInterest ? <>{landingText(texts,"checkout.installmentTotal")}{money(option.chargedValueCents)}</> : landingText(texts, "checkout.044")}
                  </option>
                ))}
              </select>
              {selectedInstallment?.hasInterest ? <small>{landingText(texts, "checkout.045")}{money(selectedInstallment.interestCents)}.</small> : <small>{landingText(texts, "checkout.046")}</small>}
            </label>
          ) : null}
        </div>
      ) : null}

      <label className="consent"><input required type="checkbox" name="acceptedTerms" value="yes" /> {landingText(texts, "checkout.047")}</label>
      {salesCode?<a className="secondary-button full mt-4" target="_blank" rel="noopener noreferrer" href={`https://wa.me/5511934924155?text=${encodeURIComponent("Olá, equipe LORD NUTRI! Preciso de ajuda para preencher ou finalizar minha compra do MIX10 PRO. Código do link: " + salesCode)}`}>Precisa de ajuda? Fale com a LORD NUTRI</a>:null}
      {error ? <div className="form-error">{error}</div> : null}
      <button className="primary-button full" disabled={busy || quoteBusy || !selectedShipping}>{busy ? landingText(texts, "checkout.048") : selectedShipping ? <>{salesCode ? "Pagar no Asaas" : landingText(texts,"checkout.paymentCta")} · {money(finalCents)}</> : landingText(texts, "checkout.049")}</button>
    </form>
  );
}
