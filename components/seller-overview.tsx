"use client";
import { useMemo, useState } from "react";

type Order={id:string;orderNumber:string;name:string;paymentStatus:string;shippingStatus:string;totalCents:number;productTotalCents?:number;shippingCents?:number;interestCents?:number;asaasVerifiedAt?:string|null;createdAt:string};
type Reseller={id:string;name:string;stock:number;soldBoxes:number;grossSalesCents:number};
type Sale={id:string;userId:string;totalValueCents:number;soldAt:string};
const money=(c:number)=>(c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const ratio=(a:number,b:number)=>b?`${(100*a/b).toFixed(1).replace(".",",")}%`:"0%";
const confirmed=(p:Order)=>p.paymentStatus==="paid"&&Boolean(p.asaasVerifiedAt);
export function SellerOverview({purchases,resellers,sales}:{purchases:Order[];resellers:Reseller[];sales:Sale[]}){
 const [days,setDays]=useState("30");
 const data=useMemo(()=>{
  const min=days==="all"?0:Date.now()-Number(days)*86400000;
  const items=purchases.filter(p=>new Date(p.asaasVerifiedAt||p.createdAt).getTime()>=min);
  const paid=items.filter(confirmed);const pending=items.filter(p=>p.paymentStatus!=="cancelled"&&!confirmed(p));
  const net=paid.reduce((s,p)=>s+Math.max(0,p.productTotalCents||(p.totalCents-(p.shippingCents||0)-(p.interestCents||0))),0);
  const freight=paid.reduce((s,p)=>s+(p.shippingCents||0),0);
  const buckets=new Map<string,{day:string;value:number;orders:number}>();
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const day=d.toISOString().slice(0,10);buckets.set(day,{day,value:0,orders:0});}
  for(const p of paid){const day=(p.asaasVerifiedAt||p.createdAt).slice(0,10),b=buckets.get(day);if(b){b.orders++;b.value+=p.productTotalCents||Math.max(0,p.totalCents-(p.shippingCents||0)-(p.interestCents||0));}}
  const salesInWindow=sales.filter(s=>new Date(s.soldAt).getTime()>=min);
  const resellerGross=salesInWindow.reduce((n,s)=>n+s.totalValueCents,0);
  return {items,paid,pending,net,freight,buckets:[...buckets.values()],resellerGross,salesInWindow,
   cancelled:items.filter(p=>p.paymentStatus==="cancelled").length,
   awaitingShipment:paid.filter(p=>p.shippingStatus==="separating").length,
   shipped:paid.filter(p=>p.shippingStatus==="shipped").length,
   delivered:paid.filter(p=>p.shippingStatus==="delivered").length};
 },[purchases,sales,days]);
 const maximum=Math.max(1,...data.buckets.map(b=>b.value));
 const top=resellers.map(r=>({...r,monthValue:data.salesInWindow.filter(s=>s.userId===r.id).reduce((sum,s)=>sum+s.totalValueCents,0)})).sort((a,b)=>b.monthValue-a.monthValue).slice(0,5);
 return <section className="seller-overview" aria-label="CRM de vendas e performance do BKO">
  <div className="seller-overview-head"><div><span className="section-kicker">SELLER · OPERAÇÃO COMERCIAL</span><h2>Radar de vendas</h2><p className="crm-quiet">Pedidos verificados pelo Asaas separados das vendas manuais de revendedores.</p></div><label>Período<select aria-label="Período dos indicadores comerciais" value={days} onChange={e=>setDays(e.target.value)}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="all">Todo o histórico</option></select></label></div>
  <div className="seller-funnel">
   <div><span>Checkouts</span><strong>{data.items.length}</strong><small>100% da entrada</small></div>
   <div><span>Pagamentos Asaas</span><strong>{data.paid.length}</strong><small>{ratio(data.paid.length,data.items.length)} de conversão</small></div>
   <div><span>Pendências</span><strong>{data.pending.length}</strong><small>Sem confirmação Asaas</small></div>
   <div><span>Estornos / cancelados</span><strong>{data.cancelled}</strong><small>Não entram em receita</small></div>
  </div>
  <div className="seller-overview-columns"><div className="seller-panel"><h3>Receita verificada · sem frete</h3><strong className="seller-big-number">{money(data.net)}</strong><p className="crm-quiet">Frete separado: {money(data.freight)}. Receita por pedido considera só os produtos, sem frete e juros.</p>
   <div className="seller-graph" role="img" aria-label="Receita de produtos por dia nos últimos sete dias">{data.buckets.map(d=><div key={d.day}><span className="seller-bar" style={{height:`${Math.max(d.value?7:2,(d.value/maximum)*100)}%`}} title={`${new Date(d.day+'T12:00:00').toLocaleDateString('pt-BR')}: ${money(d.value)} · ${d.orders} pedidos`}/><small>{d.day.slice(8)}</small></div>)}</div><p className="crm-quiet">Gráfico: últimos 7 dias, apenas compras efetivamente confirmadas.</p>
  </div><div className="seller-panel"><h3>Operação e expedição</h3><div className="seller-status-stack"><div><span>Em separação</span><strong>{data.awaitingShipment}</strong></div><div><span>Em transporte</span><strong>{data.shipped}</strong></div><div><span>Entregues</span><strong>{data.delivered}</strong></div></div><h3>Revendedores · registro manual</h3><strong className="seller-big-number">{money(data.resellerGross)}</strong><p className="crm-quiet">Valor informado pelos revendedores, não confundir com transações Asaas.</p></div></div>
  <div className="seller-panel"><h3>Performance dos revendedores · período escolhido</h3>{top.length?<div className="seller-ranking">{top.map((r,i)=><div key={r.id}><b>#{i+1}</b><span>{r.name}</span><strong>{money(r.monthValue)}</strong></div>)}</div>:<p className="crm-quiet">Nenhum revendedor cadastrado.</p>}</div>
 </section>;
}
