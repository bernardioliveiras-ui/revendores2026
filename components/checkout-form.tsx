"use client";

import { FormEvent, useMemo, useState } from "react";
import type { KitId } from "@/lib/kits";

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const display = {
  kit20: { label: "KIT20", boxes: 20, totalCents: 149800, unitCents: 7490 },
  kit50: { label: "KIT50", boxes: 50, totalCents: 349500, unitCents: 6990 },
} as const;

export function CheckoutForm() {
  const [kit, setKit] = useState<KitId>(() => {
    if (typeof window === "undefined") return "kit20";
    const requested = new URLSearchParams(window.location.search).get("kit");
    return requested === "kit50" ? "kit50" : "kit20";
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = useMemo(() => display[kit], [kit]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

  return (
    <form className="checkout-card" onSubmit={submit}>
      <div className="section-kicker">Comece sua revenda</div>
      <h3>Escolha o kit e informe seus dados</h3>
      <div className="kit-toggle" role="group" aria-label="Escolha do kit">
        {(Object.keys(display) as KitId[]).map((id) => (
          <button key={id} type="button" className={kit === id ? "active" : ""} onClick={() => setKit(id)}>
            <strong>{display[id].label}</strong><span>{display[id].boxes} caixas · {money(display[id].unitCents)}/caixa</span>
          </button>
        ))}
      </div>
      <input type="hidden" name="kit" value={kit} />
      <div className="checkout-summary"><span>Produtos</span><strong>{money(selected.totalCents)}</strong><small>Frete à parte. Parcelamento e juros são exibidos no ambiente seguro do Asaas antes da confirmação.</small></div>
      <div className="form-grid">
        <label>Nome completo<input required name="name" autoComplete="name" /></label>
        <label>E-mail<input required type="email" name="email" autoComplete="email" /></label>
        <label>WhatsApp<input required name="phone" inputMode="tel" autoComplete="tel" /></label>
        <label>CPF ou CNPJ<input required name="cpfCnpj" inputMode="numeric" /></label>
        <label>CEP<input required name="postalCode" inputMode="numeric" autoComplete="postal-code" /></label>
        <label>Rua / Avenida<input required name="street" autoComplete="address-line1" /></label>
        <label>Número<input required name="number" /></label>
        <label>Complemento<input name="complement" autoComplete="address-line2" /></label>
        <label>Bairro<input required name="district" /></label>
        <label>Cidade<input required name="city" autoComplete="address-level2" /></label>
        <label>UF<input required name="state" maxLength={2} autoComplete="address-level1" /></label>
      </div>
      <input type="hidden" name="utmSource" value="" />
      <input type="hidden" name="utmMedium" value="" />
      <input type="hidden" name="utmCampaign" value="" />
      <input type="hidden" name="utmContent" value="" />
      <label className="consent"><input required type="checkbox" name="acceptedTerms" value="yes" /> Li e concordo com os Termos de Uso e a Política de Privacidade.</label>
      {error ? <div className="form-error">{error}</div> : null}
      <button className="primary-button full" disabled={busy}>{busy ? "Abrindo pagamento…" : `Ir para pagamento · ${money(selected.totalCents)}`}</button>
    </form>
  );
}
