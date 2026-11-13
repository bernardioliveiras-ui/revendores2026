"use client";
import { useEffect, useState } from "react";

type Activity = {id:string;campaignName:string;campaignCode:string;influencerName:string;name:string;phone:string;startedAt:string|null;
  lastSeenAt:string;createdAt:string;paymentStatus:string|null;paymentMethod:string|null;asaasPaymentId:string|null;orderNumber:string|null};

export function CheckoutFunnel({ admin = false }: { admin?: boolean }) {
  const [rows,setRows] = useState<Activity[]>([]);
  const [error,setError] = useState("");
  const [now,setNow] = useState(Date.now());
  async function refresh() {
    try {
      const response = await fetch(admin ? "/api/admin/checkout-funnel" : "/api/indicator/funnel", {cache:"no-store"});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível carregar o funil.");
      setRows(body.activity || []); setNow(Date.now()); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha na consulta."); }
  }
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(),60000);
    return () => clearInterval(timer);
  // The endpoint is determined only by the panel role.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[admin]);
  const abandoned = rows.filter(row => row.startedAt && !["paid","cancelled"].includes(row.paymentStatus || "") &&
    now-Date.parse(row.lastSeenAt) >= 30*60000);
  function contact(row:Activity) {
    let phone = row.phone.replace(/\D/g,"");
    if (phone.length===10 || phone.length===11) phone="55"+phone;
    if (!/^55\d{10,11}$/.test(phone)) return null;
    return "https://wa.me/"+phone+"?text="+encodeURIComponent("Olá"+(row.name?", "+row.name:"")+"! Posso ajudar a concluir sua compra do MIX10 PRO?");
  }
  return <section className="portal-card">
    <div className="crm-orders-head"><h2>Funil do checkout</h2><button className="secondary-button compact" onClick={()=>void refresh()}>Atualizar</button></div>
    {error?<p role="alert">{error}</p>:null}
    <div className="crm-kpi-grid">
      <div><span>Acessos ao checkout</span><strong>{rows.length}</strong></div>
      <div><span>Checkouts iniciados</span><strong>{rows.filter(row=>row.startedAt).length}</strong></div>
      <div><span>PIX pendentes</span><strong>{rows.filter(row=>row.paymentStatus==="payment_pending"&&row.paymentMethod==="pix"&&row.asaasPaymentId).length}</strong></div>
      <div><span>Carrinhos abandonados</span><strong>{abandoned.length}</strong></div>
    </div>
    
    <div className="crm-v2-order-list">
      {abandoned.map(row=>{
        const url=contact(row);
        return <article key={row.id} className="crm-v2-order"><div><strong>{row.name || "Visitante sem nome"}</strong>
          <small>{row.influencerName} · {row.campaignName} · {row.orderNumber || "Pedido em preenchimento"}</small><small>Código do influenciador · {row.campaignCode}</small></div>
          {url?<a className="secondary-button compact" href={url} target="_blank" rel="noopener noreferrer">Chamar no WhatsApp</a>:<small>Telefone ainda não informado</small>}
        </article>;
      })}
      
    </div>
  </section>;
}
