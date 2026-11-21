"use client";

import { useMemo, useState } from "react";
import { Activity, BadgeCheck, Boxes, Clock3, CreditCard, ExternalLink, PackageCheck, ShoppingBag, TrendingUp, Truck, Users, Wallet } from "lucide-react";
import { buildBkoDashboard } from "@/lib/bko-dashboard-data.mjs";
import { countPendingResellerAccess, isResellerKitPurchase, isInfluencerUnitPurchase } from "@/lib/purchase-segments.mjs";

type Purchase = { id:string; orderNumber:string; name:string; kit:string; campaignId?:string|null; paymentStatus:string; shippingStatus:string; createdAt:string; asaasVerifiedAt?:string|null; accessReleasedAt?:string|null; productTotalCents?:number; shippingCents?:number; interestCents?:number; totalCents:number; };
type Reseller = { id:string; name:string; status:string; stock:number; soldBoxes:number; grossSalesCents:number; };
type Overview = { metrics:{ activeResellers:number; paidPurchases:number; pendingAccess:number; aggregateStock:number; affiliateLinks:number; affiliateClicks:number; boxesSold:number; grossSalesCents:number; kitRevenueCents:number }; purchases:Purchase[]; resellers:Reseller[] };
type Period = "today"|"7d"|"30d"|"month"|"prev_month"|"all";

const periods: Array<{value:Period;label:string}> = [
  {value:"today",label:"Hoje"},{value:"7d",label:"7 dias"},{value:"30d",label:"30 dias"},
  {value:"month",label:"Mês atual"},{value:"prev_month",label:"Anterior"},{value:"all",label:"Todo o período"},
];
const money = (cents:number) => (cents / 100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const short = (day:string) => day.slice(8,10)+"/"+day.slice(5,7);

export function BkoControlDashboard({ data, onOpenOrders, onOpenDirectSales, onOpenShipping, onOpenInfluencers, onOpenResellers, onRefresh }: {
  data:Overview; onOpenOrders:()=>void; onOpenDirectSales:()=>void; onOpenShipping:()=>void; onOpenInfluencers:()=>void; onOpenResellers:()=>void; onRefresh:()=>void;
}) {
  const [period,setPeriod] = useState<Period>("7d");
  const dashboard = useMemo(()=>buildBkoDashboard(data.purchases, period),[data.purchases,period]);
  const max = Math.max(1,...dashboard.daily.map((d:{cents:number})=>d.cents));
  const recent = data.purchases.filter(p=>p.paymentStatus==="paid"&&p.asaasVerifiedAt).slice(0,5);
  const waiting = countPendingResellerAccess(data.purchases);

  return <div className="lord-demo-dashboard" aria-label="Visão Geral BKO com dados do CRM">
    <div className="lord-demo-page-heading">
      <div><span className="lord-demo-eyebrow">CENTRAL DE CONTROLE</span><h1>Visão Geral</h1><p>Indicadores operacionais organizados para decisões rápidas.</p></div>
      <div className="lord-demo-filter" role="group" aria-label="Período dos indicadores de pagamento">
        {periods.map(p=><button key={p.value} type="button" className={period===p.value?"active":""} aria-pressed={period===p.value} onClick={()=>setPeriod(p.value)}>{p.label}</button>)}
        <button type="button" title="Atualizar dados do CRM" onClick={onRefresh}>↻ Atualizar</button>
      </div>
    </div>
    <section className="lord-demo-hero">
      <div><span>✨ LORD NUTRI · NOVA EXPERIÊNCIA</span><h2>Sua operação, em uma única visão.</h2><p>Pagamentos verificados, acessos, estoque e expedição, com informações do CRM autenticado.</p><button type="button" onClick={onOpenOrders}>Ver pedidos e acessos <ExternalLink size={15}/></button></div>
      <div className="lord-demo-hero-number"><strong>{dashboard.verifiedCount}</strong><span>compras verificadas no período</span></div>
    </section>
    <div className="lord-demo-section-caption"><span>DESEMPENHO OPERACIONAL</span><small>Receita considera produtos, sem frete · confirmação do Asaas</small></div>
    <section className="lord-demo-stats" aria-label="Indicadores principais">
      <Metric label="Vendas aprovadas · loja" value={money(dashboard.productRevenueCents)} foot="Todos os canais · compras verificadas" icon={<TrendingUp/>}/>
      <Metric label="Vendas pendentes" value={String(dashboard.pendingCount)} foot="Pedidos ainda sem confirmação" icon={<Clock3/>}/>
      <Metric label="Pedidos pagos · loja" value={String(dashboard.verifiedCount)} foot="Todos os canais · verificados no Asaas" icon={<BadgeCheck/>}/>
      <Metric label="Acessos pendentes · kits" value={String(dashboard.pendingAccessCount)} foot="Somente kits de revenda verificados" icon={<Users/>}/>
      <Metric label="Expedições pendentes" value={String(dashboard.shippingCount)} foot="Ainda não entregues" icon={<Truck/>}/>
      <Metric label="Revendedores ativos" value={String(data.metrics.activeResellers)} foot="Total de contas ativas no CRM" icon={<ShoppingBag/>}/>
      <Metric label="Estoque em mãos" value={`${data.metrics.aggregateStock} cx.`} foot="Saldo acumulado das movimentações" icon={<Boxes/>}/>
      <Metric label="Cliques em links" value={data.metrics.affiliateClicks.toLocaleString("pt-BR")} foot="Total registrado no CRM" icon={<Activity/>}/>
    </section>
    <section className="lord-demo-channel-split" aria-label="Vendas verificadas separadas por canal">
      <button type="button" onClick={onOpenOrders}><span>REVENDEDORES · KITS</span><strong>{dashboard.resellerKitCount}</strong><small>Compras de kits verificadas · abrir acessos e pedidos</small></button>
      <button type="button" onClick={onOpenInfluencers}><span>INFLUENCIADORES</span><strong>{dashboard.influencerUnitCount}</strong><small>Vendas unitárias atribuídas · abrir campanhas</small></button>
      <button type="button" onClick={onOpenDirectSales}><span>VENDAS AVULSAS</span><strong>{dashboard.directUnitCount}</strong><small>Vendas unitárias sem campanha · abrir pedidos</small></button>
    </section>
    <div className="lord-demo-split">
      <section className="lord-demo-panel"><div className="lord-demo-panel-heading"><div><h2>Volume de vendas</h2><p>Produtos pagos e verificados por dia · últimos sete dias</p></div><span className="lord-demo-tag">Asaas confirmado</span></div>
        <div className="lord-demo-chart" role="img" aria-label={`Gráfico dos últimos sete dias: ${money(dashboard.daily.reduce((s:number,d:{cents:number})=>s+d.cents,0))} em produtos verificados`}>
          {dashboard.daily.map((point:{day:string;cents:number})=><div className="lord-demo-bar-slot" key={point.day}><div className="lord-demo-bar" style={{height:`${Math.max(3,point.cents/max*100)}%`}} title={`${short(point.day)} · ${money(point.cents)}`}/><span>{short(point.day)}</span></div>)}
        </div><div className="lord-demo-panel-footer"><span>Os períodos usam a data da confirmação do Asaas.</span><b>{money(dashboard.daily.reduce((s:number,d:{cents:number})=>s+d.cents,0))}</b></div>
      </section>
      <section className="lord-demo-panel"><div className="lord-demo-panel-heading"><div><h2>Alertas operacionais</h2><p>Demandas identificadas pelo banco</p></div></div>
        <button type="button" className="lord-demo-alert" onClick={onOpenOrders}><Clock3 size={18}/><span><b>{waiting} acesso(s) aguardando liberação</b><small>Somente pedidos pagos podem receber acesso.</small></span></button>
        <button type="button" className="lord-demo-alert" onClick={onOpenShipping}><Truck size={18}/><span><b>{data.purchases.filter(p=>p.paymentStatus==="paid"&&p.shippingStatus!=="delivered").length} pedido(s) em expedição</b><small>Acompanhar os status registrados pelo BKO.</small></span></button>
        <button type="button" className="lord-demo-alert calm" onClick={onOpenInfluencers}><Wallet size={18}/><span><b>{data.metrics.affiliateLinks} link(s) de indicação registrado(s)</b><small>Cashback e conciliação ficam no módulo de influenciadores.</small></span></button>
      </section>
    </div>
    <div className="lord-demo-split lower">
      <section className="lord-demo-panel"><div className="lord-demo-panel-heading"><div><h2>Compras verificadas recentemente</h2><p>Registro das confirmações recebidas do Asaas</p></div><button type="button" onClick={onOpenOrders}>Ver todos</button></div>
        {recent.length ? <div className="lord-demo-activity-list">{recent.map(p=><div className="lord-demo-activity" key={p.id}><span className="lord-demo-activity-icon"><PackageCheck size={17}/></span><div><b>{p.orderNumber} · {p.name}</b><small>{isResellerKitPurchase(p)?"Kit de revenda":isInfluencerUnitPurchase(p)?"Campanha de influenciador":"Venda avulsa"} · {p.asaasVerifiedAt?new Date(p.asaasVerifiedAt).toLocaleString("pt-BR"):"Data indisponível"}</small></div><strong>{money(p.productTotalCents??Math.max(0,p.totalCents-(p.shippingCents??0)-(p.interestCents??0)))}</strong></div>)}</div> : <p className="lord-demo-empty">Nenhuma compra verificada para apresentar.</p>}
      </section>
      <section className="lord-demo-panel"><div className="lord-demo-panel-heading"><div><h2>Rede comercial</h2><p>Revendedores, estoque e ações</p></div><button type="button" onClick={onOpenResellers}>Gerenciar</button></div>
        <div className="lord-demo-network"><div><span>Revendedores ativos</span><strong>{data.metrics.activeResellers}</strong><Users size={22}/></div><div><span>Caixas vendidas</span><strong>{data.metrics.boxesSold}</strong><ShoppingBag size={22}/></div><div><span>Vendas dos revendedores</span><strong>{money(data.metrics.grossSalesCents)}</strong><CreditCard size={22}/></div></div>
      </section>
    </div>
    <p className="lord-demo-integrations-note">Totais da loja reúnem todos os canais. Acessos de revendedores contam apenas kits, e as vendas unitárias ficam separadas por atribuição. Pagamentos, cashback e Correios ainda exigem homologação integrada antes da operação financeira real.</p>
  </div>;
}

function Metric({label,value,foot,icon}:{label:string;value:string;foot:string;icon:React.ReactNode}) {
  return <article className="lord-demo-stat"><div className="lord-demo-stat-top"><span>{label}</span><span className="lord-demo-stat-icon">{icon}</span></div><strong>{value}</strong><small>{foot}</small></article>;
}
