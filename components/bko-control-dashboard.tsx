"use client";

import { useMemo, useState } from "react";
import { Activity, BadgeCheck, Boxes, Clock3, CreditCard, ShoppingBag, TrendingUp, Truck, Users, Wallet } from "lucide-react";
import { PortalMetric } from "@/components/portal-frame";
import { buildBkoDashboard } from "@/lib/bko-dashboard-data.mjs";

type Purchase = { kit?:string; id:string; orderNumber:string; name:string; paymentStatus:string; shippingStatus:string; createdAt:string; asaasVerifiedAt?:string|null; accessReleasedAt?:string|null; productTotalCents?:number; shippingCents?:number; interestCents?:number; totalCents:number; };
type Reseller = { id:string; name:string; status:string; stock:number; soldBoxes:number; grossSalesCents:number; };
type Overview = { metrics:{ activeResellers:number; paidPurchases:number; pendingAccess:number; aggregateStock:number; affiliateLinks:number; affiliateClicks:number; boxesSold:number; grossSalesCents:number; kitRevenueCents:number }; purchases:Purchase[]; resellers:Reseller[] };
type Period = "today"|"7d"|"30d"|"month"|"prev_month"|"all";

const periods: Array<{value:Period;label:string}> = [
  {value:"today",label:"Hoje"},{value:"7d",label:"7 dias"},{value:"30d",label:"30 dias"},
  {value:"month",label:"Mês atual"},{value:"prev_month",label:"Anterior"},{value:"all",label:"Todo o período"},
];
const money = (cents:number) => (cents / 100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const short = (day:string) => day.slice(8,10)+"/"+day.slice(5,7);

export function BkoControlDashboard({ data, onOpenOrders, onOpenShipping, onOpenInfluencers, onOpenResellers, onRefresh }: {
  data:Overview; onOpenOrders:()=>void; onOpenShipping:()=>void; onOpenInfluencers:()=>void; onOpenResellers:()=>void; onRefresh:()=>void;
}) {
  const [period,setPeriod] = useState<Period>("7d");
  const dashboard = useMemo(()=>buildBkoDashboard(data.purchases, period),[data.purchases,period]);
  const max = Math.max(1,...dashboard.daily.map((d:{cents:number})=>d.cents));
  const recent = data.purchases.filter(p=>p.paymentStatus==="paid"&&p.asaasVerifiedAt).slice(0,5);
  const waiting = data.purchases.filter(p=>p.paymentStatus==="paid"&&p.kit!=="mix10-unit"&&!p.accessReleasedAt).length;

  const total = dashboard.daily.reduce((sum:number,d:{cents:number})=>sum+d.cents,0);
  return <div aria-label="Visão Geral BKO com dados do CRM">
    <div className="pagehead"><div><div className="eyebrow">Central de controle</div><h1>Visão Geral</h1><p>Indicadores operacionais organizados para decisões rápidas.</p></div>
    <div className="head-actions"><div className="filterbar" role="group" aria-label="Período dos indicadores de pagamento">
    {periods.map(p=><button key={p.value} className={p.value===period?"active":""} aria-pressed={p.value===period} onClick={()=>setPeriod(p.value)}>{p.label}</button>)}</div><button className="btn tiny" onClick={onRefresh}>Atualizar</button></div></div>
    <div className="box hero"><div className="herotext"><div className="tinylabel">LORD NUTRI · NOVA EXPERIÊNCIA</div><h2>Sua operação, em uma única visão.</h2><p>Acompanhe pedidos, conversões, estoque e tarefas pendentes da sua operação.</p></div><div className="hero-side"><strong>{dashboard.verifiedCount}</strong><span>pedidos pagos no período</span></div></div>
    <div className="grid four mt" aria-label="Indicadores principais">
      <PortalMetric label="Vendas aprovadas" value={money(dashboard.productRevenueCents)} detail="Produtos de compras verificadas" icon={<TrendingUp/>}/>
      <PortalMetric label="Vendas pendentes" value={String(dashboard.pendingCount)} detail="Pedidos ainda sem confirmação" icon={<Clock3/>}/>
      <PortalMetric label="Pedidos pagos" value={String(dashboard.verifiedCount)} detail="Verificados no Asaas" icon={<BadgeCheck/>}/>
      <PortalMetric label="Acessos pendentes" value={String(dashboard.pendingAccessCount)} detail="Dos pagamentos deste período" icon={<Users/>}/>
      <PortalMetric label="Expedições pendentes" value={String(dashboard.shippingCount)} detail="Ainda não entregues" icon={<Truck/>}/>
      <PortalMetric label="Revendedores ativos" value={String(data.metrics.activeResellers)} detail="Total de contas ativas no CRM" icon={<ShoppingBag/>}/>
      <PortalMetric label="Estoque em mãos" value={`${data.metrics.aggregateStock} cx.`} detail="Saldo acumulado das movimentações" icon={<Boxes/>}/>
      <PortalMetric label="Cliques em links" value={data.metrics.affiliateClicks.toLocaleString("pt-BR")} detail="Total registrado no CRM" icon={<Activity/>}/>
    </div>
    <div className="split mtlg"><div className="box boxpad chartbox"><div className="section-title"><div><h2>Volume de vendas</h2><p>Produtos pagos por dia nos últimos sete dias, dentro do filtro</p></div><span className="pill">Últimos 7 dias</span></div>
      <div className="chart-header"><div><strong>{money(total)}</strong><div className="muted">Total no gráfico</div></div><div className="legend"><span><i/> Pedidos pagos</span></div></div>
      <div className="bars" role="img" aria-label={"Total no gráfico: "+money(total)}>{dashboard.daily.map((d:{day:string;cents:number})=><div className="barwrap" key={d.day}><div className="bar" style={{height:Math.max(5,d.cents/max*148)}}><span className="tip">{money(d.cents)}</span></div><span className="xlab">{short(d.day)}</span></div>)}</div>
      <div className="chartfoot"><span>Pagamentos verificados no Asaas</span><b>{dashboard.verifiedCount} pedidos no filtro</b></div></div>
    <div className="box boxpad"><div className="section-title"><div><h2>Alertas operacionais</h2><p>Itens que merecem atenção</p></div><button className="btn tiny" onClick={onOpenOrders}>Ver pedidos</button></div>
      <button className="signal" onClick={onOpenOrders}><Clock3 size={18}/><div><b>{waiting} pedidos aguardando acesso</b><p>Confira as liberações de revendedores.</p></div></button>
      <button className="signal" onClick={onOpenShipping}><Truck size={18}/><div><b>{dashboard.shippingCount} expedições no período</b><p>Acompanhe o último status conhecido.</p></div></button>
      <button className="signal green" onClick={onOpenInfluencers}><Wallet size={18}/><div><b>{data.metrics.affiliateLinks} links de indicação</b><p>Consultar campanhas e cashback.</p></div></button></div></div>
    <div className="grid three mtlg"><PortalMetric label="Revendedores ativos" value={data.metrics.activeResellers} detail="Contas do CRM" icon={<Users/>}/><PortalMetric label="Caixas vendidas" value={data.metrics.boxesSold} detail="Vendas dos revendedores" icon={<ShoppingBag/>}/><PortalMetric label="Vendas dos revendedores" value={money(data.metrics.grossSalesCents)} detail="Valor registrado" icon={<CreditCard/>}/></div>
    <div className="box boxpad mtlg"><div className="section-title"><div><h2>Atividade recente</h2><p>Últimas compras verificadas pelo Asaas</p></div><button className="btn tiny" onClick={onOpenResellers}>Gerenciar revendedores</button></div>
      {recent.map(p=><div className="activity" key={p.id}><div className="adot"/><div><p><b>{p.name}</b> · {p.orderNumber}</p><small>{new Date(p.asaasVerifiedAt!).toLocaleString("pt-BR")}</small></div></div>)}{!recent.length&&<p className="muted">Nenhuma compra verificada.</p>}</div>
  </div>;
}
