"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingFolder } from "@/components/marketing-folder";

type Campaign = {name:string;publicPath:string;active:boolean;clicks:number;checkouts:number;pending:number;confirmedOrders:number;productRevenueCents:number;averageTicketCents:number;conversionRate:number};
const money=(c:number)=>(c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function IndicatorPortal() {
 const [asaasEnvironment,setAsaasEnvironment]=useState("sandbox");
 const [campaign,setCampaign]=useState<Campaign|null>(null),[name,setName]=useState(""),[campaignName,setCampaignName]=useState("");
 const [notice,setNotice]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  const sr=await fetch("/api/auth/session",{cache:"no-store"}),s=await sr.json();
  if(!s.authenticated){location.replace("/entrar");return}
  if(s.user.role!=="indicator"){location.replace("/painel");return}
  setName(s.user.name);
  const r=await fetch("/api/indicator/campaign",{cache:"no-store"}),b=await r.json();
  if(!r.ok)throw Error(b.error||"Não foi possível carregar a campanha.");
  setAsaasEnvironment(b.asaasEnvironment||"sandbox");setCampaign(b.campaign||null);if(b.campaign)setCampaignName(b.campaign.name);
 },[]);
 useEffect(()=>{void load().catch(e=>setNotice(e.message)).finally(()=>setLoading(false))},[load]);
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setNotice("");
  try{const r=await fetch("/api/indicator/campaign",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:campaignName})}),b=await r.json();if(!r.ok)throw Error(b.error||"Não foi possível salvar.");await load();setNotice("Campanha salva. Seu link permanece o mesmo em todas as divulgações.")}
  catch(e){setNotice(e instanceof Error?e.message:"Erro ao salvar.")}finally{setBusy(false)}
 }
 function link(){return campaign?`${location.origin}${campaign.publicPath}`:""}
 async function copy(){try{await navigator.clipboard.writeText(link());setNotice("Link da campanha copiado.")}catch{setNotice("Não foi possível copiar. Selecione e copie o endereço.")}}
 function share(){window.open(`https://wa.me/?text=${encodeURIComponent(`Conheça a LORD NUTRI: ${link()}`)}`,"_blank","noopener,noreferrer")}
 return <main className="indicator-shell"><header className="indicator-top"><Link href="/" aria-label="LORD NUTRI"><BrandLogo compact/></Link><button className="secondary-button compact" onClick={()=>void fetch("/api/auth/logout",{method:"POST"}).then(()=>location.href="/entrar")}>Sair</button></header>
  <div className="indicator-content"><span className="section-kicker">LORD NUTRI · INFLUENCIADORES</span><h1>Minha campanha</h1><p>Olá, {name}. Um único link para Instagram, WhatsApp e qualquer canal. Você acompanha compras reais confirmadas pelo Asaas, sem enviar comprovantes.</p>
   {asaasEnvironment==="sandbox"?<p className="portal-notice">Ambiente Asaas de teste (sandbox): pagamentos simulados não são faturamento real.</p>:null}
   {notice?<div className="portal-notice" role="status">{notice}</div>:null}
   <section className="portal-card"><h2>Campanha de divulgação</h2><form className="portal-form indicator-form" onSubmit={save}><label>Campanha<input required minLength={3} maxLength={120} placeholder="Ex.: Campanha Outubro · Instagram" value={campaignName} onChange={e=>setCampaignName(e.target.value)}/></label><button className="primary-button" disabled={busy||loading||campaign?.active===false}>{busy?"Salvando…":campaign?"Atualizar nome da campanha":"Gerar meu link único"}</button></form>
   {campaign?<div className="crm-campaign-link"><label>Link único e permanente<input readOnly aria-label="Link da campanha" value={link()} onFocus={e=>e.currentTarget.select()}/></label><div className="crm-actions"><button className="secondary-button compact" onClick={()=>void copy()}>Copiar link</button><button className="primary-button" onClick={share}>Compartilhar</button></div>{!campaign.active?<p>Campanha pausada pelo BKO.</p>:null}</div>:null}</section>
   {campaign?<section className="indicator-stats crm-metrics"><div><strong>{campaign.clicks}</strong><span>Acessos estimados ao link</span></div><div><strong>{campaign.checkouts}</strong><span>Checkouts iniciados</span></div><div><strong>{campaign.pending}</strong><span>Pagamentos em análise</span></div><div><strong>{campaign.confirmedOrders}</strong><span>Vendas reais (Asaas)</span></div><div><strong>{money(campaign.productRevenueCents)}</strong><span>Receita dos produtos · sem frete</span></div><div><strong>{campaign.conversionRate}%</strong><span>Vendas / acessos estimados</span></div></section>:null}
   <p className="crm-quiet">Não é necessário comprovante. Confirmação e estorno dependem dos eventos do Asaas; o link acessado pode ser contado mais de uma vez.</p><MarketingFolder/>
  </div></main>;
}
