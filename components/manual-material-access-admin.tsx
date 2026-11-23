"use client";

import { FormEvent, useState } from "react";

type Props = { userId: string; email: string; name: string };
type Decision = { active: boolean; lastAction?: "grant" | "revoke" | null; changedAt?: string | null; error?: string };
const api = "/api/admin/resellers/material-access";

export function ManualMaterialAccessAdmin({ userId, email, name }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const [proofReference, setProofReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    setBusy(true);
    setMessage("");
    setDecision(null);
    try {
      const response = await fetch(`${api}?userId=${encodeURIComponent(userId)}`, { cache: "no-store", signal: AbortSignal.timeout(25000) });
      const body: Decision = await response.json();
      if (!response.ok) throw Error(body.error || "Não foi possível conferir a autorização atual.");
      setDecision(body);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível conectar.");
    } finally { setBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision || busy) return;
    const action = decision.active ? "revoke" : "grant";
    const confirm = action === "grant" ? "LIBERAR" : "REVOGAR";
    if (!window.confirm(action === "grant"
      ? `Você conferiu o comprovante de pagamento externo de ${name}? A liberação vale apenas para PDF e materiais; não confirma a cobrança Asaas.`
      : `Revogar a liberação manual dos materiais de ${name}? O pedido, o estoque e a cobrança não serão alterados.`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(api, { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, email, action, reason, proofReference: action === "grant" ? proofReference : "", confirm }),
        signal: AbortSignal.timeout(25000),
      });
      const body: Decision = await response.json();
      if (!response.ok) throw Error(body.error || "Não foi possível registrar a decisão.");
      setDecision(body);
      setReason("");
      setProofReference("");
      setMessage(body.active ? "Materiais liberados. O revendedor pode atualizar o portal e abrir o PDF." : "Liberação manual revogada. As compras verificadas continuam com acesso próprio.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível conectar.");
    } finally { setBusy(false); }
  }

  return <div className="manual-material-access-admin">
    <button type="button" className="secondary-button compact" onClick={() => void toggle()} disabled={busy} aria-expanded={expanded}>
      {expanded ? "Fechar acesso aos materiais" : "Gerenciar acesso aos materiais"}
    </button>
    {expanded ? <div className="manual-material-access-panel">
      <strong>Autorização manual de materiais · {name}</strong>
      <p>Somente para pagamento externo comprovado. Não altera cobrança Asaas, pedido ou estoque.</p>
      {busy && !decision ? <p>Consultando autorização…</p> : null}
      {decision ? <>
        <span className="status-pill">{decision.active ? "Liberação manual ativa" : "Sem liberação manual"}</span>
        {decision.changedAt ? <small>Última decisão: {new Date(decision.changedAt).toLocaleString("pt-BR")}</small> : null}
        <form onSubmit={event => void submit(event)}>
          <label>Justificativa da decisão
            <textarea value={reason} onChange={event => setReason(event.target.value)} required minLength={12} maxLength={500} rows={2} placeholder="Explique o motivo da autorização ou revogação"/>
          </label>
          {!decision.active ? <label>Referência do comprovante externo
            <input value={proofReference} onChange={event => setProofReference(event.target.value)} required minLength={8} maxLength={200} placeholder="Ex.: transferência de 09/11, recibo nº…"/>
          </label> : null}
          <button type="submit" className={decision.active ? "secondary-button compact crm-danger-outline" : "primary-button compact"} disabled={busy}>
            {busy ? "Registrando…" : decision.active ? "Revogar liberação manual" : "Liberar materiais manualmente"}
          </button>
        </form>
      </> : null}
      {message ? <p role="status">{message}</p> : null}
    </div> : null}
  </div>;
}
