"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { KitId } from "@/lib/kits";

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
  kit: { id: KitId; label: string; boxes: number; productTotalCents: number };
  shippingOptions: ShippingOption[];
};

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const display = {
  kit20: { label: "KIT20", boxes: 20, totalCents: 149800, unitCents: 7490 },
  kit50: { label: "KIT50", boxes: 50, totalCents: 349500, unitCents: 6990 },
} as const;

export function CheckoutForm() {
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
  const selected = useMemo(() => display[kit], [kit]);

  const activeQuote = quote?.kit.id === kit && quote.postalCode === postalCode.replace(/\D/g, "") ? quote : null;
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

  async function loadQuote(rawPostalCode: string, requestedKit = kit) {
    const sequence = ++quoteSequence.current;
    quoteController.current?.abort();
    const controller = new AbortController();
    quoteController.current = controller;
    const cleanPostalCode = rawPostalCode.replace(/\D/g, "").slice(0, 8);
    if (cleanPostalCode.length !== 8) {
      setQuote(null);
      setQuoteError("Digite os 8 números do CEP para calcular o frete.");
      return;
    }
    setQuoteBusy(true);
    setQuoteError("");
    try {
      const response = await fetch("/api/public/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
        body: JSON.stringify({ postalCode: cleanPostalCode, kit: requestedKit }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível calcular o frete.");
      if (sequence !== quoteSequence.current) return;
      setQuote(body as QuoteResponse);
      setAddress(body.address);
      setShippingType("economical");
      setInstallments(1);
    } catch (cause) {
      if (sequence !== quoteSequence.current) return;
      setQuote(null);
      setQuoteError(cause instanceof Error ? cause.message : "Não foi possível calcular o frete.");
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
      setError("Calcule o frete pelo CEP e escolha uma modalidade de entrega antes de continuar.");
      return;
    }
    if (paymentMethod === "credit" && !selectedInstallment) {
      setError("Escolha uma opção de parcelamento válida.");
      return;
    }
    submitInFlight.current = true;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    let attribution: Record<string, string> = {};
    try { attribution = JSON.parse(localStorage.getItem("mix10_attribution") || "{}") || {}; } catch {}
    const params = new URLSearchParams(window.location.search);
    const payload = {
      ...Object.fromEntries(form.entries()),
      shippingType,
      paymentMethod,
      installments: paymentMethod === "credit" ? installments : 1,
      utmSource: params.get("utm_source") || attribution.utmSource || "",
      utmMedium: params.get("utm_medium") || attribution.utmMedium || "",
      utmCampaign: params.get("utm_campaign") || attribution.utmCampaign || "",
      utmContent: params.get("utm_content") || attribution.utmContent || "",
    };
    try {
      const response = await fetch("/api/public/checkout", {
        method: "POST",
        signal: AbortSignal.timeout(75000),
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível iniciar o pagamento.");
      window.location.href = body.invoiceUrl;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o pagamento.");
      setBusy(false);
      submitInFlight.current = false;
    }
  }

  return (
    <form className="checkout-card" onSubmit={submit}>
      <div className="section-kicker">Comece sua revenda</div>
      <h3>Escolha o kit, o frete e o pagamento</h3>

      <div className="kit-toggle" role="group" aria-label="Escolha do kit">
        {(Object.keys(display) as KitId[]).map((id) => (
          <button key={id} type="button" className={kit === id ? "active" : ""} onClick={() => chooseKit(id)}>
            <strong>{display[id].label}</strong><span>{display[id].boxes} caixas · {money(display[id].unitCents)}/caixa</span>
          </button>
        ))}
      </div>
      <input type="hidden" name="kit" value={kit} />

      <div className="checkout-summary checkout-breakdown" aria-live="polite">
        <span>Produtos</span><strong>{money(selected.totalCents)}</strong>
        <span>Frete</span><strong>{selectedShipping ? money(selectedShipping.priceCents) : "Calcule pelo CEP"}</strong>
        <span>Taxa de parcelamento</span><strong>{selectedShipping ? money(feeCents) : "—"}</strong>
        <span className="checkout-total-label">Total final</span><strong className="checkout-total-value">{selectedShipping ? money(finalCents) : "—"}</strong>
        <small>O valor é recalculado no servidor antes da cobrança. PIX e cartão em até 6x.</small>
      </div>

      <div className="form-grid">
        <label>Nome completo<input required name="name" autoComplete="name" /></label>
        <label>E-mail<input required type="email" name="email" autoComplete="email" /></label>
        <label>WhatsApp<input required name="phone" inputMode="tel" autoComplete="tel" /></label>
        <label>CPF ou CNPJ<input required name="cpfCnpj" inputMode="numeric" /></label>
        <label className="cep-field">CEP
          <div className="cep-row">
            <input
              required
              name="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
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
            <button type="button" className="quote-button" disabled={quoteBusy} onClick={() => void loadQuote(postalCode)}>{quoteBusy ? "Calculando…" : "Calcular frete"}</button>
          </div>
        </label>
        <label>Rua / Avenida<input required name="street" value={address.street} onChange={event => setAddress(current => ({...current, street: event.target.value}))} autoComplete="address-line1" /></label>
        <label>Número<input required name="number" /></label>
        <label>Complemento<input name="complement" autoComplete="address-line2" /></label>
        <label>Bairro<input required name="district" value={address.district} onChange={event => setAddress(current => ({...current, district: event.target.value}))} /></label>
        <label>Cidade<input required name="city" value={address.city} onChange={event => setAddress(current => ({...current, city: event.target.value}))} autoComplete="address-level2" /></label>
        <label>UF<input required name="state" value={address.state} onChange={event => setAddress(current => ({...current, state: event.target.value.toUpperCase()}))} maxLength={2} autoComplete="address-level1" /></label>
      </div>

      {quoteError ? <div className="form-error quote-error">{quoteError}</div> : null}

      {activeQuote ? (
        <div className="checkout-choice-section">
          <strong className="choice-title">1. Escolha o frete</strong>
          <div className="shipping-options">
            {activeQuote.shippingOptions.map((option) => (
              <label key={option.id} className={`choice-card ${shippingType === option.id ? "active" : ""}`}>
                <input type="radio" checked={shippingType === option.id} onChange={() => { setShippingType(option.id); setInstallments(1); }} />
                <span><b>{option.label}</b><small>{option.deliveryTime}</small></span>
                <strong>{money(option.priceCents)}</strong>
              </label>
            ))}
          </div>

          <strong className="choice-title">2. Escolha o pagamento</strong>
          <div className="payment-options">
            <label className={`choice-card ${paymentMethod === "pix" ? "active" : ""}`}>
              <input type="radio" checked={paymentMethod === "pix"} onChange={() => { setPaymentMethod("pix"); setInstallments(1); }} />
              <span><b>PIX</b><small>À vista, sem taxa de parcelamento</small></span>
              <strong>{money(selectedShipping?.baseCents || 0)}</strong>
            </label>
            <label className={`choice-card ${paymentMethod === "credit" ? "active" : ""}`}>
              <input type="radio" checked={paymentMethod === "credit"} onChange={() => setPaymentMethod("credit")} />
              <span><b>Cartão de crédito</b><small>De 1x a 6x</small></span>
              <strong>até 6x</strong>
            </label>
          </div>

          {paymentMethod === "credit" && selectedShipping ? (
            <label className="installment-select">Parcelamento
              <select value={installments} onChange={(event) => setInstallments(Number(event.target.value))}>
                {selectedShipping.credit.map((option) => (
                  <option key={option.installments} value={option.installments}>
                    {option.installments}x de {money(option.installmentValueCents)}{option.hasInterest ? ` · total ${money(option.chargedValueCents)}` : " · sem juros"}
                  </option>
                ))}
              </select>
              {selectedInstallment?.hasInterest ? <small>Taxa calculada a 2,99% a.m. pela Tabela Price: {money(selectedInstallment.interestCents)}.</small> : <small>1x sem taxa de parcelamento.</small>}
            </label>
          ) : null}
        </div>
      ) : null}

      <label className="consent"><input required type="checkbox" name="acceptedTerms" value="yes" /> Li e concordo com os Termos de Uso e a Política de Privacidade.</label>
      {error ? <div className="form-error">{error}</div> : null}
      <button className="primary-button full" disabled={busy || quoteBusy || !selectedShipping}>{busy ? "Abrindo pagamento…" : selectedShipping ? `Ir para pagamento · ${money(finalCents)}` : "Calcule o frete para continuar"}</button>
    </form>
  );
}
