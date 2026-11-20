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
  const [retailStep, setRetailStep] = useState(1);
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

  function validateRetailStep(step: number) {
    const fields = formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[data-purchase-step="${step}"] input, [data-purchase-step="${step}"] select`);
    for (const field of fields || []) {
      if (!field.checkValidity()) {
        setRetailStep(step);
        requestAnimationFrame(() => field.reportValidity());
        return false;
      }
    }
    return true;
  }
  function continueRetail() {
    if (!validateRetailStep(retailStep)) return;
    if (retailStep === 2 && !selectedShipping) {
      setQuoteError("Calcule o frete pelo CEP para continuar.");
      return;
    }
    setRetailStep(current => Math.min(3,current+1));
    void sendActivity("contact");
  }
  function changeRetailQuantity(next: number) {
    if (busy || next < 1 || next > MAX_RETAIL_BOXES) return;
    setQuantity(next);
    invalidateQuote();
    setQuoteError("");
    setInstallments(1);
    recordActivity();
    if (retailStep === 3) setRetailStep(2);
    if (postalCode.replace(/\D/g,"").length === 8) void loadQuote(postalCode,kit,next);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitInFlight.current) return;
    if (salesCode) {
      if (retailStep < 3) { continueRetail(); return; }
      if (![1,2,3].every(validateRetailStep)) return;
    }
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

  if (salesCode) return (
    <form ref={formRef} className="purchase-layout" noValidate onSubmit={submit}
      onChange={recordActivity} onBlur={()=>void sendActivity("contact")}>
      <aside className="purchase-summary" aria-label="Resumo da compra">
        <h2>Resumo da compra</h2>
        <div className="purchase-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mix10-box-transparent-v3.png" alt="Caixa MIX10 PRO" width={80} height={94} />
          <div><h3>{quantity === 1 ? "Uma caixa" : `${quantity} caixas`}</h3>
            <span>30 cápsulas por caixa</span><p>MIX10 PRO original da LORD NUTRI. Suplemento alimentar em cápsulas.</p></div>
        </div>
        <div className="purchase-summary-row"><span>Quantidade selecionada</span>
          <div className="purchase-counter">
            <button type="button" onClick={()=>changeRetailQuantity(quantity-1)} disabled={busy||quantity===1} aria-label="Diminuir quantidade">−</button>
            <output aria-label="Quantidade de caixas">{quantity}</output>
            <button type="button" onClick={()=>changeRetailQuantity(quantity+1)} disabled={busy||quantity===MAX_RETAIL_BOXES} aria-label="Aumentar quantidade">+</button>
          </div>
        </div>
        <div className="purchase-summary-row"><span>Produtos</span><strong>{money(selected.totalCents)}</strong></div>
        <div className="purchase-summary-row"><span>Frete</span><span>{selectedShipping?money(selectedShipping.priceCents):"Calculado ao inserir CEP"}</span></div>
        {paymentMethod==="credit"?<div className="purchase-summary-row"><span>Encargos do cartão</span><span>{money(feeCents)}</span></div>:null}
        <div className="purchase-total" aria-live="polite"><span>Total{!selectedShipping?<small>Frete a calcular</small>:null}</span>
          <strong>{paymentMethod==="credit"&&selectedInstallment?`${selectedInstallment.installments}x de ${money(selectedInstallment.installmentValueCents)}`:`1x de ${money(finalCents)}`}</strong>
        </div>
        {paymentMethod==="credit"&&installments>1?<p className="purchase-total-detail">Total parcelado {money(finalCents)}</p>:null}
        <div className="purchase-benefits">
          <p><span aria-hidden="true">✓</span> Entrega calculada pelo seu CEP</p>
          <p><span aria-hidden="true">✓</span> Suporte da equipe LORD NUTRI</p>
          <p><span aria-hidden="true">✓</span> Pagamento por PIX ou cartão</p>
        </div>
        <a className="purchase-institutional" href="https://mix10pro.com.br/lp-v2" target="_blank" rel="noopener noreferrer">Institucional · Conheça mais sobre o MIX10 PRO ↗</a>
      </aside>
      <div className="purchase-form-panel">
        <h1>Falta pouco para concluir sua compra</h1>
        <section className={`purchase-step ${retailStep===1?"is-open":""}`}>
          <button type="button" className="purchase-step-heading" onClick={()=>setRetailStep(1)} disabled={busy} aria-expanded={retailStep===1}>
            <span>1</span> Identificação
          </button>
          <fieldset data-purchase-step="1" hidden={retailStep!==1} disabled={busy}>
            <legend className="sr-only">Identificação</legend>
            <div className="purchase-fields">
              <label className="purchase-wide">Nome completo<input required name="name" autoComplete="name" placeholder="Digite seu nome" minLength={2} maxLength={120}/></label>
              <label>E-mail<input required type="email" name="email" autoComplete="email" placeholder="seu@email.com" maxLength={254}/></label>
              <label>WhatsApp<input required name="phone" type="tel" autoComplete="tel" placeholder="(00) 00000-0000" minLength={10} maxLength={20}/></label>
              <label className="purchase-wide">CPF ou CNPJ<input required name="cpfCnpj" inputMode="numeric" placeholder="000.000.000-00" minLength={11} maxLength={18}/></label>
            </div>
            <p className="purchase-privacy">A equipe LORD NUTRI poderá usar seu telefone para ajudar com a compra. <a href="/politica-de-privacidade" target="_blank" rel="noreferrer">Privacidade</a></p>
            <button className="purchase-continue" type="button" onClick={continueRetail}>Continuar para entrega</button>
          </fieldset>
        </section>
        <section className={`purchase-step ${retailStep===2?"is-open":""}`}>
          <button type="button" className="purchase-step-heading" disabled={busy} aria-expanded={retailStep===2}
            onClick={()=>{if(validateRetailStep(1))setRetailStep(2)}}><span>2</span> Entrega</button>
          <fieldset data-purchase-step="2" hidden={retailStep!==2} disabled={busy}>
            <legend className="sr-only">Endereço de entrega</legend>
            <div className="purchase-fields">
              <label className="purchase-wide">CEP<div className="purchase-postal">
                <input required name="postalCode" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={postalCode} pattern="[0-9]{5}-?[0-9]{3}" onChange={event=>{
                  const value=event.target.value.replace(/\D/g,"").slice(0,8);
                  setPostalCode(value.length>5?`${value.slice(0,5)}-${value.slice(5)}`:value);
                  invalidateQuote();setAddress({street:"",district:"",city:"",state:""});setQuoteError("");
                }} onBlur={()=>{if(postalCode.replace(/\D/g,"").length===8&&!activeQuote)void loadQuote(postalCode)}}/>
                <button type="button" disabled={quoteBusy} onClick={()=>void loadQuote(postalCode)}>{quoteBusy?"Calculando…":"Calcular frete"}</button>
              </div></label>
              <label className="purchase-wide">Endereço<input required name="street" autoComplete="address-line1" value={address.street} onChange={e=>setAddress(a=>({...a,street:e.target.value}))}/></label>
              <label>Número<input required name="number" maxLength={32}/></label>
              <label>Complemento<input name="complement" autoComplete="address-line2" maxLength={160}/></label>
              <label className="purchase-wide">Bairro<input required name="district" value={address.district} onChange={e=>setAddress(a=>({...a,district:e.target.value}))}/></label>
              <label>Cidade<input required name="city" autoComplete="address-level2" value={address.city} onChange={e=>setAddress(a=>({...a,city:e.target.value}))}/></label>
              <label>UF<input required name="state" autoComplete="address-level1" minLength={2} maxLength={2} value={address.state} onChange={e=>setAddress(a=>({...a,state:e.target.value.toUpperCase()}))}/></label>
            </div>
            {quoteError?<p className="purchase-error" role="alert">{quoteError}</p>:null}
            {activeQuote?<div className="purchase-options">{activeQuote.shippingOptions.map(option=>
              <label key={option.id} className={shippingType===option.id?"selected":""}>
                <input type="radio" name="shippingChoice" checked={shippingType===option.id} onChange={()=>{setShippingType(option.id);setInstallments(1)}}/>
                <span>{option.label}<small>{option.deliveryTime}</small></span><strong>{money(option.priceCents)}</strong>
              </label>)}</div>:null}
            <button className="purchase-continue" type="button" disabled={quoteBusy||!selectedShipping} onClick={continueRetail}>Continuar para pagamento</button>
          </fieldset>
        </section>
        <section className={`purchase-step ${retailStep===3?"is-open":""}`}>
          <button type="button" className="purchase-step-heading" disabled={busy} aria-expanded={retailStep===3} onClick={()=>{
            if(!validateRetailStep(1)||!validateRetailStep(2))return;
            if(!selectedShipping){setRetailStep(2);setQuoteError("Calcule o frete para continuar.");return;}
            setRetailStep(3);
          }}><span>3</span> Pagamento</button>
          <fieldset data-purchase-step="3" hidden={retailStep!==3} disabled={busy}>
            <legend className="sr-only">Pagamento</legend>
            <div className="purchase-options">
              <label className={paymentMethod==="pix"?"selected":""}><input type="radio" name="billingChoice" checked={paymentMethod==="pix"} onChange={()=>{setPaymentMethod("pix");setInstallments(1)}}/><span>PIX<small>QR Code e copia e cola no Asaas</small></span></label>
              <label className={paymentMethod==="credit"?"selected":""}><input type="radio" name="billingChoice" checked={paymentMethod==="credit"} onChange={()=>setPaymentMethod("credit")}/><span>Cartão de crédito<small>De 1x a 6x</small></span></label>
            </div>
            {paymentMethod==="credit"&&selectedShipping?<label className="purchase-installments">Parcelamento<select value={installments} onChange={e=>setInstallments(Number(e.target.value))}>
              {selectedShipping.credit.map(option=><option value={option.installments} key={option.installments}>{option.installments}x de {money(option.installmentValueCents)} · total {money(option.chargedValueCents)}</option>)}
            </select></label>:null}
            <label className="purchase-consent"><input type="checkbox" name="acceptedTerms" value="yes" required/><span>Li e aceito os <a href="/termos-de-uso" target="_blank" rel="noreferrer">Termos de Uso</a> e a <a href="/politica-de-privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a>.</span></label>
            <button className="purchase-continue" disabled={busy||quoteBusy||!selectedShipping}>{busy?"Abrindo pagamento…":`Pagar ${money(finalCents)} no Asaas`}</button>
          </fieldset>
        </section>
        {error?<p className="purchase-error" role="alert">{error}</p>:null}
        <div className="purchase-security"><span>Pagamento protegido pelo Asaas</span><strong>PIX <i>·</i> Cartão de crédito</strong></div>
      </div>
    </form>
  );

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
