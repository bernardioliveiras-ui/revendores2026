"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { InfluencerMaterialLibrary } from "@/components/influencer-material-library";
import { FolderOpen, LayoutDashboard, Link2, LogOut, UserRound, Wallet } from "lucide-react";

type TermsPayload={title:string;version:string;sha256:string;sections:readonly {heading:string;text:string}[];cashbackNotice:string;accepted:boolean;acceptedAt:string|null};
type Campaign = {name:string;publicPath:string;salesPath:string;pixPending:number;recoveryOpportunities:number;active:boolean;clicks:number;checkouts:number;pending:number;confirmedOrders:number;productRevenueCents:number;averageTicketCents:number;conversionRate:number;cashbackAccruedCents:number;uncalculatedOrders:number;cashbackMode:"fixed"|"percent";cashbackValue:number};
type InfluencerPage = "overview"|"campaigns"|"cashback"|"materials"|"profile";
const money=(c:number)=>(c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function IndicatorPortal() {
 const [asaasEnvironment,setAsaasEnvironment]=useState("sandbox");
 const [terms,setTerms]=useState<TermsPayload|null>(null),[termsCheck,setTermsCheck]=useState(false),[termsBusy,setTermsBusy]=useState(false);
 const [campaign,setCampaign]=useState<Campaign|null>(null),[name,setName]=useState(""),[email,setEmail]=useState(""),[campaignName,setCampaignName]=useState("");
 const [notice,setNotice]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [activePage,setActivePage]=useState<InfluencerPage>("overview");
 const pageTitles:Record<InfluencerPage,string>={overview:"Visão Geral",campaigns:"Campanhas e Links",cashback:"Vendas e Cashback",materials:"Materiais",profile:"Meu Perfil"};
 const navigate=(page:InfluencerPage)=>{setActivePage(page);window.scrollTo({top:0,behavior:"instant"});};
 const load=useCallback(async()=>{
  const sr=await fetch("/api/auth/session",{cache:"no-store"}),s=await sr.json();
  if(!s.authenticated){location.replace("/entrar");return}
  if(s.user.role!=="indicator"){location.replace("/painel");return}
  setName(s.user.name);setEmail(s.user.email);
  const tr=await fetch("/api/indicator/terms",{cache:"no-store"}),t:TermsPayload=await tr.json();
  if(!tr.ok)throw Error((t as unknown as {error?:string}).error||"Não foi possível consultar os termos.");
  setTerms(t);
  if(!t.accepted)return;
  const r=await fetch("/api/indicator/campaign",{cache:"no-store"}),b=await r.json();
  if(!r.ok)throw Error(b.error||"Não foi possível carregar a campanha.");
  setAsaasEnvironment(b.asaasEnvironment||"sandbox");setCampaign(b.campaign||null);if(b.campaign)setCampaignName(b.campaign.name);
 },[]);
 useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==="visible")void load().catch(()=>{});},30000);const refresh=()=>void load().catch(()=>{});window.addEventListener("focus",refresh);return()=>{clearInterval(timer);window.removeEventListener("focus",refresh);}},[load]);
 useEffect(()=>{void load().catch(e=>setNotice(e.message)).finally(()=>setLoading(false))},[load]);
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setNotice("");
  try{const r=await fetch("/api/indicator/campaign",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:campaignName})}),b=await r.json();if(!r.ok)throw Error(b.error||"Não foi possível salvar.");await load();setNotice("Campanha salva. Seus links permanentes estão disponíveis.")}
  catch(e){setNotice(e instanceof Error?e.message:"Erro ao salvar.")}finally{setBusy(false)}
 }
 async function acceptTerms(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!termsCheck||!terms)return;
  setTermsBusy(true);setNotice("");
  try{const r=await fetch("/api/indicator/terms",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accepted:true,version:terms.version,sha256:terms.sha256})}),b=await r.json();
   if(!r.ok)throw Error(b.error||"Aceite não registrado.");await load();setNotice("Seu aceite foi registrado. Você já pode utilizar a campanha.")}
  catch(e){setNotice(e instanceof Error?e.message:"Não foi possível registrar o aceite.")}finally{setTermsBusy(false)}
 }
 async function decline(){await fetch("/api/auth/logout",{method:"POST"});location.href="/entrar"}
 function link(path?:string){return path?`${location.origin}${path}`:""}
 async function copy(path:string){try{await navigator.clipboard.writeText(link(path));setNotice("Link da campanha copiado.")}catch{setNotice("Não foi possível copiar. Selecione e copie o endereço.")}}
 function share(){window.open(`https://wa.me/?text=${encodeURIComponent(`Conheça o MIX10 PRO da LORD NUTRI: ${link(campaign?.salesPath)}`)}`,"_blank","noopener,noreferrer")}
 return <main className={`indicator-shell portal-influencer${terms?.accepted?" portal-influencer-active":""}`}>
  {terms?.accepted?<aside className="influencer-sidebar"><div className="influencer-sidebar-brand"><BrandLogo compact mark/><div><strong>LORD NUTRI</strong><span>PORTAL DO INFLUENCIADOR</span></div></div><span className="influencer-sidebar-caption">MEU PORTAL</span><nav aria-label="Navegação do influenciador"><button type="button" aria-current={activePage==="overview"?"page":undefined} onClick={()=>navigate("overview")}><LayoutDashboard/> Visão Geral</button><button type="button" aria-current={activePage==="campaigns"?"page":undefined} onClick={()=>navigate("campaigns")}><Link2/> Campanhas e Links</button><button type="button" aria-current={activePage==="cashback"?"page":undefined} onClick={()=>navigate("cashback")}><Wallet/> Vendas e Cashback</button><button type="button" aria-current={activePage==="materials"?"page":undefined} onClick={()=>navigate("materials")}><FolderOpen/> Materiais</button><button type="button" aria-current={activePage==="profile"?"page":undefined} onClick={()=>navigate("profile")}><UserRound/> Meu Perfil</button></nav><div className="influencer-sidebar-footer">Seus links e resultados pertencem exclusivamente ao seu perfil.</div></aside>:null}
  <header className="indicator-top lord-indicator-top"><div className="lord-demo-breadcrumb"><span>LORD NUTRI</span><span className="lord-demo-breadcrumb-slash">/</span><strong>{pageTitles[activePage]}</strong></div><div className="lord-demo-user"><span className="lord-demo-user-avatar" aria-hidden="true">{name.trim().charAt(0).toUpperCase()||"LN"}</span><span><b>{name||"Influenciador"}</b><small>Influenciador · LORD NUTRI</small></span><button type="button" onClick={()=>void fetch("/api/auth/logout",{method:"POST"}).then(()=>location.href="/entrar")}><LogOut size={17}/> Sair</button></div></header>
  {!terms?.accepted?(!loading&&terms?<div className="indicator-content terms-workspace"><span className="section-kicker">LORD NUTRI · PARTICIPAÇÃO INDEPENDENTE</span><h1>Termos e condições do indicador</h1>
   <p>Olá, {name}. Leia as condições antes de acessar seu link de divulgação. O aceite é obrigatório, não vem marcado e será registrado com data, versão e prova técnica.</p>
   {notice?<p className="portal-notice" role="alert">{notice}</p>:null}
   <section className="portal-card"><div className="terms-top"><h2>{terms.title}</h2><span className="crm-status">Versão {terms.version}</span></div>
    <p className="terms-highlight">{terms.cashbackNotice}</p>
    <div className="terms-readable" aria-label="Texto integral dos termos">{terms.sections.map(s=><section key={s.heading}><h3>{s.heading}</h3><p>{s.text}</p></section>)}</div>
    <form className="terms-accept-form" onSubmit={e=>void acceptTerms(e)}>
     <label className="terms-check"><input type="checkbox" checked={termsCheck} onChange={e=>setTermsCheck(e.target.checked)}/><span>Li e aceito integralmente os Termos de Participação, incluindo as condições de atuação independente, apuração de cashback e registro do meu aceite eletrônico.</span></label>
     <div className="crm-actions"><button className="primary-button" type="submit" disabled={!termsCheck||termsBusy}>{termsBusy?"Registrando aceite…":"Aceitar e acessar painel"}</button><button className="secondary-button" type="button" onClick={()=>void decline()}>Não aceito · Sair</button></div>
    </form>
   </section>
  </div>:<div className="indicator-content"><p role="status">{notice||"Verificando seus termos…"}</p></div>):<div className="indicator-content lord-role-page">
   {notice?<div className="portal-notice" role="status">{notice}</div>:null}
   {asaasEnvironment==="sandbox"?<p className="portal-notice">Ambiente Asaas de teste (sandbox): pagamentos simulados não são faturamento real.</p>:null}
   {activePage==="overview"?<><section id="influencer-overview" className="influencer-page-head"><span className="section-kicker">SEU DESEMPENHO</span><h1>Visão Geral</h1><p>Acompanhe o alcance da campanha e as vendas atribuídas.</p></section>
   <section className="lord-hero influencer-hero" aria-label="Resumo da campanha do influenciador">
    <div className="lord-hero-copy"><span className="lord-hero-kicker">PORTAL DO INFLUENCIADOR · LORD NUTRI</span><h2>Olá, {name.trim().split(/\s+/)[0] || "influenciador"}! ✨</h2><p>Sua campanha, suas conversões e o acompanhamento do cashback em um só lugar.</p><button className="lord-hero-cta" type="button" onClick={()=>navigate("campaigns")}>{campaign?`Minha campanha ${campaign.name}`:"Configurar minha campanha"}</button></div>
    <div className="lord-hero-highlight"><strong>{campaign?.name || "Minha campanha"}</strong><span>{campaign ? campaign.active ? "Campanha ativa" : "Campanha pausada" : "Aguardando criação"}</span></div>
   </section>
   {campaign?<section className="indicator-stats crm-metrics influencer-overview-metrics" aria-label="Indicadores da campanha"><div><span>Cliques no link</span><strong>{campaign.clicks}</strong></div><div><span>Entrantes / leads</span><strong>{campaign.checkouts}</strong></div><div><span>Vendas confirmadas</span><strong>{campaign.confirmedOrders}</strong></div><div><span>Cashback apurado</span><strong>{money(campaign.cashbackAccruedCents)}</strong></div></section>:null}
   <div className="lord-influencer-overview-panels"><section className="portal-card"><span className="section-kicker">SUA CAMPANHA</span><h2>{campaign?.name||"Campanha ainda não criada"}</h2><p>Compartilhe seu link individual e acompanhe as vendas atribuídas.</p><button className="secondary-button" type="button" onClick={()=>navigate("campaigns")}>Ver campanha e links</button></section><section className="portal-card"><span className="section-kicker">RESULTADO DA CAMPANHA</span><h2>Resumo financeiro</h2><p>Vendas confirmadas: <strong>{campaign?.confirmedOrders??0}</strong></p><p>Cashback apurado: <strong>{money(campaign?.cashbackAccruedCents??0)}</strong></p><button className="secondary-button" type="button" onClick={()=>navigate("cashback")}>Ver vendas e cashback</button></section></div>
   </>:null}
   {activePage==="campaigns"?<><section className="influencer-page-head"><span className="section-kicker">DIVULGAÇÃO E ATRIBUIÇÃO</span><h1>Campanhas e Links</h1><p>Compartilhe sua campanha sem precisar lidar com códigos técnicos.</p></section>
   {campaign?<section className="indicator-stats crm-metrics influencer-overview-metrics"><div><span>Cliques</span><strong>{campaign.clicks}</strong></div><div><span>Entrantes</span><strong>{campaign.checkouts}</strong></div><div><span>Vendas confirmadas</span><strong>{campaign.confirmedOrders}</strong></div><div><span>Produtos vendidos</span><strong>{money(campaign.productRevenueCents)}</strong></div></section>:null}
   <section id="influencer-campaign" className="portal-card"><div className="card-title"><div><span className="section-kicker">CAMPANHAS E LINKS</span><h2>{campaign?.name || "Campanha de divulgação"}</h2></div>{campaign?<span className="status-pill">{campaign.active?"Ativa":"Pausada"}</span>:null}</div><form className="portal-form indicator-form" onSubmit={save}><label>Nome da sua campanha<input required minLength={3} maxLength={120} placeholder="Ex.: Campanha Outubro · Instagram" value={campaignName} onChange={e=>setCampaignName(e.target.value)}/></label><button className="primary-button" disabled={busy||loading||campaign?.active===false}>{busy?"Salvando…":campaign?"Atualizar nome da campanha":"Gerar meus links"}</button></form>
   {campaign?<div className="crm-campaign-link"><label>Link de vendas<input readOnly value={link(campaign.salesPath)} onFocus={e=>e.currentTarget.select()}/></label><div className="crm-actions"><button className="secondary-button compact" onClick={()=>void copy(campaign.salesPath)}>Copiar link de vendas</button><button className="primary-button" onClick={share}>Compartilhar no WhatsApp</button></div>{!campaign.active?<p>Campanha pausada pelo BKO.</p>:null}</div>:null}</section>
   </>:null}
   {activePage==="cashback"?<><section className="influencer-page-head"><span className="section-kicker">SEU RESULTADO</span><h1>Vendas e Cashback</h1><p>Veja apenas as vendas e os valores atribuídos à sua campanha.</p></section>
   <section className="cashback-alert" role="note"><strong>Cashback · pagamentos às sextas-feiras</strong><p>Se o saldo de cashback liberado atingir R$ 100,00 até quinta-feira, o montante será pago na sexta-feira daquela semana. Se atingir R$ 100,00 na sexta-feira, o pagamento será feito na sexta-feira da semana seguinte.</p><small>O total de vendas exibido abaixo não equivale a cashback disponível.</small></section>
   {campaign?<section id="influencer-cashback" className="portal-card influencer-cashback-card"><span className="section-kicker">VENDAS E CASHBACK</span><h2>Seu resultado financeiro</h2><p className="crm-quiet"><b>Sua regra atual:</b> {campaign.cashbackMode==="percent"?`${(campaign.cashbackValue/100).toFixed(2).replace(".",",")}% sobre produtos, sem frete`:`${money(campaign.cashbackValue)} por venda verificada`}. <b>Cashback apurado:</b> {money(campaign.cashbackAccruedCents)} (ainda sujeito à liberação e ao mínimo de R$ 100,00 para repasse).{campaign.uncalculatedOrders?` ${campaign.uncalculatedOrders} compra(s) antigas sem apuração.`:""}</p><div className="indicator-stats crm-metrics"><div><span>Vendas confirmadas</span><strong>{campaign.confirmedOrders}</strong></div><div><span>Vendas pendentes</span><strong>{campaign.pending}</strong></div><div><span>Produtos vendidos</span><strong>{money(campaign.productRevenueCents)}</strong></div><div><span>Cashback apurado</span><strong>{money(campaign.cashbackAccruedCents)}</strong></div></div></section>:<section className="portal-card">Não há campanha ativa com vendas para apresentar.</section>}
   </>:null}
   {activePage==="materials"?<><section className="influencer-page-head"><span className="section-kicker">BIBLIOTECA</span><h1>Materiais</h1><p>Conteúdos disponíveis para divulgar a LORD NUTRI.</p></section><section id="influencer-materials" className="influencer-materials"><div className="influencer-materials-head"><span className="section-kicker">DIVULGAÇÃO</span><h2>Divulgue com mais facilidade</h2><p>Imagens e vídeos reais organizados para consulta, download e compartilhamento.</p></div><InfluencerMaterialLibrary/></section></>:null}
   {activePage==="profile"?<><section className="influencer-page-head"><span className="section-kicker">MINHA CONTA</span><h1>Meu Perfil</h1><p>Seus dados de divulgação organizados e protegidos.</p></section><div className="lord-influencer-profile-grid"><section id="influencer-profile" className="portal-card lord-influencer-profile"><span className="section-kicker">MEU PERFIL</span><h2>{name}</h2><p>Influenciador · {campaign?.name||"Sem campanha"}</p><div><span>Nome completo</span><strong>{name}</strong></div><div><span>E-mail de login</span><strong>{email}</strong></div><p>As informações acima pertencem exclusivamente à sua conta.</p><Link href="/trocar-senha" className="secondary-button compact">Gerenciar senha</Link></section><section className="portal-card lord-influencer-linked"><h2>Campanha vinculada</h2><div><span>Nome</span><strong>{campaign?.name||"Sem campanha"}</strong></div><div><span>Status</span><strong>{campaign?(campaign.active?"Ativa":"Pausada"):"Pendente"}</strong></div><div><span>Link individual</span><button type="button" className="secondary-button compact" disabled={!campaign} onClick={()=>navigate("campaigns")}>Ver link</button></div><p>O endereço técnico só aparece na sua área de campanhas.</p></section></div>{terms?.accepted?<p className="crm-quiet lord-terms-footnote">Termos aceitos: versão {terms.version}, em {terms.acceptedAt?new Date(terms.acceptedAt).toLocaleString("pt-BR"):"data indisponível"}. <Link href="/termos-indicadores" target="_blank" rel="noopener noreferrer">Consultar texto integral</Link>.</p>:null}</>:null}
  </div>}</main>;
}
