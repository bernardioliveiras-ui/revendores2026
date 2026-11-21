"use client";
import { useMemo, useState } from "react";
import { filterShippingPurchases, shippingCounts } from "@/lib/shipping-dashboard.mjs";

type ShippingPurchase = {
  id:string;orderNumber:string;name:string;kit:string;boxes:number;paymentStatus:string;shippingStatus:string;
  carrier?:string|null;trackingCode?:string|null;postalEvent?:string|null;postalEventAt?:string|null;
  postalCheckedAt?:string|null;postalIssue?:string|null;city:string;state:string;createdAt:string;
};

const statusName = (status:string) => status === "delivered" ? "Entregue" : status === "shipped" ? "Em trânsito" : "Em separação";
const checkedDate = (value?:string|null) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString("pt-BR") : "Ainda não consultado";

export function BkoShipping({purchases,onStageChange}:{
  purchases:ShippingPurchase[];
  onStageChange:(purchaseId:string,status:"separating"|"shipped"|"delivered")=>void;
}) {
  const [search,setSearch] = useState("");
  const [selectedId,setSelectedId] = useState<string|null>(null);
  const paid = useMemo(()=>purchases.filter(p=>p.paymentStatus==="paid"),[purchases]);
  const counts = useMemo(()=>shippingCounts(purchases),[purchases]);
  const filtered:ShippingPurchase[] = useMemo(()=>filterShippingPurchases(paid,search),[paid,search]);
  const selected = paid.find(p=>p.id===selectedId);
  return <section className="portal-card bko-shipping-dashboard">
    <div className="card-title"><div><span className="section-kicker">LOGÍSTICA</span><h2>Expedição e rastreamento</h2><p>Pedidos pagos. Acompanhe a etiqueta e a última informação realmente recebida dos Correios.</p></div><span>{paid.length} pedidos pagos</span></div>
    <div className="bko-shipping-stats" aria-label="Indicadores de expedição">
      <div><span>Aguardando expedição</span><strong>{counts.separating}</strong></div>
      <div><span>Em trânsito</span><strong>{counts.shipped}</strong></div>
      <div><span>Entregues</span><strong>{counts.delivered}</strong></div>
      <div><span>Sem etiqueta</span><strong>{counts.withoutLabel}</strong></div>
    </div>
    <label className="bko-shipping-search">Buscar por cliente, pedido ou rastreio
      <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome, número do pedido ou código dos Correios" />
    </label>
    <div className="bko-shipping-table-wrap"><table className="bko-shipping-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Etapa</th><th>Rastreio</th><th>Última consulta</th><th>Ação</th></tr></thead><tbody>
    {filtered.map(p=><tr key={p.id}><td><strong>{p.orderNumber}</strong><small>{p.kit.toUpperCase()} · {p.boxes} caixas</small></td><td>{p.name}<small>{p.city}/{p.state}</small></td><td><span className="status-pill">{statusName(p.shippingStatus)}</span></td><td>{p.trackingCode||"Etiqueta não cadastrada"}</td><td>{checkedDate(p.postalCheckedAt)}</td><td><button className="secondary-button compact" type="button" onClick={()=>setSelectedId(p.id)}>Acompanhar</button></td></tr>)}
    {!filtered.length?<tr><td colSpan={6}>Nenhum pedido encontrado para esta busca.</td></tr>:null}
    </tbody></table></div>
    {selected?<div className="bko-tracking-overlay" role="presentation" onClick={()=>setSelectedId(null)}><div className="bko-tracking-dialog" role="dialog" aria-modal="true" aria-labelledby="bko-tracking-heading" onClick={e=>e.stopPropagation()}>
      <div className="bko-tracking-head"><div><span className="section-kicker">RASTREAMENTO DO PEDIDO</span><h3 id="bko-tracking-heading">{selected.orderNumber} · {selected.name}</h3><small>{selected.kit.toUpperCase()} · {selected.city}/{selected.state}</small></div><button type="button" aria-label="Fechar acompanhamento" onClick={()=>setSelectedId(null)}>×</button></div>
      <p><strong>Etapa atual:</strong> {statusName(selected.shippingStatus)}</p>
      <p><strong>Etiqueta:</strong> {selected.trackingCode||"Aguardando cadastro"} {selected.carrier?`· ${selected.carrier}`:""}</p>
      <div className="bko-postal-result"><strong>Último evento dos Correios</strong><p>{selected.postalEvent||"Ainda não há evento retornado pelos Correios."}</p>{selected.postalEventAt?<small>Evento registrado em {checkedDate(selected.postalEventAt)}</small>:null}<small>Última consulta: {checkedDate(selected.postalCheckedAt)}</small>{selected.postalIssue?<p role="status">Falha na consulta: {selected.postalIssue}. O último evento válido foi preservado.</p>:null}</div>
      <div className="crm-actions"><button type="button" className="secondary-button compact" onClick={()=>onStageChange(selected.id,"shipped")}>{selected.trackingCode?"Atualizar etiqueta":"Cadastrar etiqueta"}</button>{selected.shippingStatus==="shipped"?<button type="button" className="secondary-button compact" onClick={()=>{if(window.confirm("Confirma a entrega manual deste pedido?"))onStageChange(selected.id,"delivered")}}>Confirmar entrega manual</button>:null}</div>
      <small>Os eventos são consultados pela rotina de integração. Cadastrar a etiqueta não comprova a postagem.</small>
    </div></div>:null}
  </section>;
}
