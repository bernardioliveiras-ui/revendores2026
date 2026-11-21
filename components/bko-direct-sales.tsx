"use client";

import { useMemo, useState } from "react";
import { isDirectUnitPurchase } from "@/lib/purchase-segments.mjs";

type DirectSale = {
  id:string; orderNumber:string; name:string; email?:string; kit:string; campaignId?:string|null;
  paymentStatus:string; asaasVerifiedAt?:string|null; createdAt:string; shippingStatus?:string;
  totalCents:number; productTotalCents?:number|null;
};

const money=(cents:number)=>(Number(cents||0)/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const status=(value:string)=>value==="paid"?"Pago":value==="pending"?"Aguardando pagamento":value==="cancelled"?"Cancelado":value==="payment_error"?"Falha no pagamento":value;

export function BkoDirectSales({purchases,onRefresh}:{purchases:DirectSale[];onRefresh:()=>Promise<void>|void}){
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");
  const direct=useMemo(()=>purchases.filter(isDirectUnitPurchase),[purchases]);
  const shown=useMemo(()=>direct.filter(p=>{
    if(filter!=="all"&&p.paymentStatus!==filter)return false;
    const term=query.trim().toLocaleLowerCase("pt-BR");
    return !term||`${p.orderNumber} ${p.name} ${p.email||""}`.toLocaleLowerCase("pt-BR").includes(term);
  }),[direct,filter,query]);
  const verified=direct.filter(p=>p.paymentStatus==="paid"&&!!p.asaasVerifiedAt);
  const revenue=verified.reduce((total,p)=>total+Math.max(0,p.productTotalCents??p.totalCents),0);
  return <section className="portal-card bko-direct-sales">
    <div className="card-title"><div><span className="section-kicker">VENDA DIRETA</span><h2>Vendas avulsas</h2><p>Somente compras unitárias sem campanha vinculada. Não geram acesso nem estoque de revendedor.</p></div><button type="button" className="secondary-button compact" onClick={()=>void onRefresh()}>↻ Atualizar vendas</button></div>
    <div className="bko-channel-kpis"><div><span>Compras avulsas</span><strong>{direct.length}</strong></div><div><span>Pagas e verificadas</span><strong>{verified.length}</strong></div><div><span>Produtos confirmados</span><strong>{money(revenue)}</strong></div></div>
    <div className="bko-channel-filters"><label>Buscar pedido ou cliente<input type="search" placeholder="Pedido, nome ou e-mail" value={query} onChange={e=>setQuery(e.target.value)}/></label><label>Pagamento<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos</option><option value="paid">Pago</option><option value="pending">Aguardando pagamento</option><option value="cancelled">Cancelado</option><option value="payment_error">Falha</option></select></label></div>
    <div className="bko-shipping-table-wrap"><table className="bko-shipping-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Pagamento</th><th>Valor total</th><th>Data</th></tr></thead><tbody>
      {shown.map(p=><tr key={p.id}><td><strong>{p.orderNumber}</strong><small>MIX10 PRO unitário</small></td><td>{p.name}<small>{p.email||""}</small></td><td><span className="status-pill">{status(p.paymentStatus)}</span>{p.paymentStatus==="paid"&&!p.asaasVerifiedAt?<small>Aguardando verificação Asaas</small>:null}</td><td>{money(p.totalCents)}</td><td>{new Date(p.createdAt).toLocaleDateString("pt-BR")}</td></tr>)}
      {!shown.length?<tr><td colSpan={5}>Nenhuma venda avulsa encontrada. Vendas de campanhas pertencem ao painel de Influenciadores.</td></tr>:null}
    </tbody></table></div>
  </section>;
}
