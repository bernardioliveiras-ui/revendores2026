"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { KitId } from "@/lib/kits";

type ShippingOption = { id: "economical" | "express"; type: string; priceCents: number; deliveryTime: string };
type InstallmentOption = { installments: number; installmentValueCents: number; chargedValueCents: number; interestValueCents: number; hasInterest: boolean };
type Quote = { productCents: number; shippingOptions: ShippingOption[]; selectedShipping: ShippingOption; baseCents: number; installmentOptions: InstallmentOption[] };

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const display = {
  kit20: { label: "KIT20", boxes: 20, totalCents: 149800, unitCents: 7490 },
  kit50: { label: "KIT50", boxes: 50, totalCents: 349500, unitCents: 6990 },
} as const;

export function CheckoutForm() {
  const [kit, setKit] = useState<KitId>("kit20");
  const [postalCode, setPostalCode] = useState("");
  const [shippingType, setShippingType] = useState<"economical" | "express">("economical");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit">("pix");
  const [installments, setInstallments] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = useMemo(() => display[kit], [kit]);
  const cleanCep = postalCode.replace(/\D/g, "").slice(0, 8);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("kit");
    if (requested === "kit20" || requested === "kit50") setKit(requested);
  }, []);

  useEffect(() => {
    if (cleanCep.length !== 8) { setQuote(null); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setQuoteBusy(true);
      try {
        const response = await fetch("/api/public/quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kit, postalCode: cleanCep, shippingType }),
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Não foi possível calcular o frete.");
        setQuote(body);
        setError("");
      } catch (cause) {
        if (controller.signal.aborted) return;
        setQuote(null);
        setError(cause instanceof Error ? cause.message : "Não foi possível calcular o frete.");
      } finally {
        if (!controller.signal.aborted) setQuoteBusy(false);
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [cleanCep, kit, shippingType]);

  const selectedInstallment = useMemo(() => {
    if (!quote) return null;
    if (paymentMethod === "pix") return quote.installmentOptions[0] || null;
    return quote.installmentOptions.find((option) => option.installments === installments) || quote.installmentOptions[0] || null;
  }, [quote, paymentMethod, installments]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quote || cleanCep.length !== 8) { setError("Calcule o frete informando um CEP válido antes de continuar."); return; }
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/public/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível iniciar o pagamento.");
      window.location.href = body.invoiceUrl;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o pagamento.");
      setBusy(false);
    }
  }

  const finalCents = selectedInstallment?.chargedValueCents ?? selected.totalCents;
  const interestCents = paymentMethod === "credit" ? (selectedInstallment?.interestValueCents ?? 0) : 0;

  return (
    <form className="checkout-card" onSubmit={submit}>
      <div className="section-kicker">Comece sua revenda</div>
      <h3>Escolha o kit e informe seus dados</h3>
      <div className="kit-toggle" role="group" aria-label="Escolha do kit">
        {(Object.keys(display) as KitId[]).map((id) => (
          <button key={id} type="button" className={kit === id ? "active" : ""} onClick={() => { setKit(id); setInstallments(1); }}>
            <strong>{display[id].label}</strong><span>{display[id].boxes} caixas · {money(display[id].unitCents)}/caixa</span>
          </button>
        ))}
      </div>
      <input type="hidden" name="kit" value={kit} />

      <div className="form-grid">
        <label>Nome completo<input required name="name" autoComplete="name" /></label>
        <label>E-mail<input required type="email" name="email" autoComplete="email" /></label>
        <label>WhatsApp<input required name="phone" inputMode="tel" autoComplete="tel" /></label>
        <label>CPF ou CNPJ<input required name="cpfCnpj" inputMode="numeric" /></label>
        <label>CEP<input required name="postalCode" inputMode="numeric" autoComplete="postal-code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></label>
        <label>Rua / Avenida<input required name="street" autoComplete="address-line1" /></label>
        <label>Número<input required name="number" /></label>
        <label>Complemento<input name="complement" autoComplete="address-line2" /></label>
        <label>Bairro<input required name="district" /></label>
        <label>Cidade<input required name="city" autoComplete="address-level2" /></label>
        <label>UF<input required name="state" maxLength={2} autoComplete="address-level1" /></label>
      </div>

      <div className="checkout-choice-block">
        <strong>Frete via Correios</strong>
        {quoteBusy ? <p className="checkout-hint">Calculando pelo CEP…</p> : null}
        {quote?.shippingOptions.map((option) => (
          <label className="checkout-choice" key={option.id}>
            <input type="radio" name="shippingType" value={option.id} checked={shippingType === option.id} onChange={() => setShippingType(option.id)} />
            <span><b>{option.type}</b><small>{option.deliveryTime}</small></span><strong>{money(option.priceCents)}</strong>
          </label>
        ))}
        {!quote && cleanCep.length < 8 ? <p className="checkout-hint">Digite o CEP para calcular o frete.</p> : null}
      </div>

      <div className="checkout-choice-block">
        <strong>Forma de pagamento</strong>
        <label className="checkout-choice"><input type="radio" name="paymentMethod" value="pix" checked={paymentMethod === "pix"} onChange={() => { setPaymentMethod("pix"); setInstallments(1); }} /><span><b>PIX</b><small>Sem acréscimo de parcelamento</small></span></label>
        <label className="checkout-choice"><input type="radio" name="paymentMethod" value="credit" checked={paymentMethod === "credit"} onChange={() => setPaymentMethod("credit")} /><span><b>Cartão de crédito</b><small>Até 6x · 2,99% a.m. pela Tabela Price</small></span></label>
        {paymentMethod === "credit" && quote ? <label className="installment-select">Parcelas<select name="installments" value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>{quote.installmentOptions.map((option) => <option key={option.installments} value={option.installments}>{option.installments}x de {money(option.installmentValueCents)}{option.hasInterest ? ` · total ${money(option.chargedValueCents)}` : " · sem acréscimo"}</option>)}</select></label> : <input type="hidden" name="installments" value="1" />}
      </div>

      <div className="checkout-summary detailed">
        <span>Produtos</span><strong>{money(selected.totalCents)}</strong>
        <span>Frete</span><strong>{quote ? money(quote.selectedShipping.priceCents) : "—"}</strong>
        {paymentMethod === "credit" ? <><span>Acréscimo do parcelamento</span><strong>{quote ? money(interestCents) : "—"}</strong></> : null}
        <span className="checkout-total-label">Total</span><strong className="checkout-total-value">{quote ? money(finalCents) : "A calcular"}</strong>
        {paymentMethod === "credit" && selectedInstallment ? <small>{selectedInstallment.installments}x de {money(selectedInstallment.installmentValueCents)}. O backend recalcula o valor antes de criar a cobrança.</small> : <small>O frete e o valor final são recalculados no servidor antes de enviar ao Asaas.</small>}
      </div>

      <input type="hidden" name="utmSource" value="" />
      <input type="hidden" name="utmMedium" value="" />
      <input type="hidden" name="utmCampaign" value="" />
      <input type="hidden" name="utmContent" value="" />
      <label className="consent"><input required type="checkbox" name="acceptedTerms" value="yes" /> Li e concordo com os Termos de Uso e a Política de Privacidade.</label>
      {error ? <div className="form-error">{error}</div> : null}
      <button className="primary-button full" disabled={busy || quoteBusy || !quote}>{busy ? "Abrindo pagamento…" : quote ? `Ir para o Asaas · ${money(finalCents)}` : "Calcule o frete para continuar"}</button>
    </form>
  );
}
