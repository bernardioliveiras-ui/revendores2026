"use client";
import { useState, type FormEvent } from "react";

type Diagnostic = {
  checkedAt:string;
  asaas:{ environment:string; payments:string; revendedores:string; influenciadores:string; tokenSet:boolean };
  correios:string;
  history:{ sync:{ at:string; result:string } | null; inbound:Record<string,string> } | null;
};
const time = (value:string) => new Date(value).toLocaleString("pt-BR", { timeZone:"America/Sao_Paulo" });

export function IntegrationCheck() {
  const [code, setCode] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [data,setData] = useState<Diagnostic|null>(null);
  async function verify(event:FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setData(null);
    try {
      const response = await fetch("/api/admin/integracoes", { method:"POST", cache:"no-store", headers:{"Content-Type":"application/json"}, body:JSON.stringify({code}) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Falha na consulta.");
      setData(body);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha na consulta."); }
    finally { setBusy(false); }
  }
  return <section className="portal-card">
    <h2>Conexões com Asaas e Correios</h2>
    <form className="portal-form" onSubmit={verify}>
      <label>Código dos Correios para teste (opcional)<input value={code} placeholder="AA123456789BR" maxLength={13} onChange={e=>setCode(e.target.value.toUpperCase())}/></label>
      <button className="primary-button compact" disabled={busy}>{busy ? "Consultando…" : "Verificar conexões"}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {data && <div aria-live="polite">
      <p>Consulta em {time(data.checkedAt)} (Brasília)</p>
      <h3>Asaas · {data.asaas.environment === "production" ? "Produção" : "Sandbox"}</h3>
      <p>{data.asaas.payments}. Token de recebimento {data.asaas.tokenSet ? "configurado" : "ausente"} na hospedagem.</p>
      {(["revendedores","influenciadores"] as const).map(channel=><p key={channel}><strong>{channel === "revendedores" ? "Revendedores" : "Influenciadores"}</strong> · {data.asaas[channel] || "Fila não consultada"}. Última confirmação recebida neste banco: {data.history ? (data.history.inbound[channel] ? time(data.history.inbound[channel]) : "sem registro") : "histórico indisponível"}.</p>)}
      <h3>Correios</h3><p>{data.correios}</p>
      <p><strong>Última execução do agendamento</strong> · {data.history ? (data.history.sync ? time(data.history.sync.at) + " · " + data.history.sync.result : "nenhuma execução registrada") : "histórico indisponível"}</p>
    </div>}
  </section>;
}
