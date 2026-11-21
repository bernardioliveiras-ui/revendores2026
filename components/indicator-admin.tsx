"use client";
import { PaymentSync } from "@/components/payment-sync";
import { Search } from "lucide-react";
import { campaignCodeFromSearch, matchesIndicatorSearch } from "@/lib/indicator-search.mjs";
import { CheckoutFunnel } from "@/components/checkout-funnel";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { summarizeCampaign, isVerifiedPaid, isPendingPix, isRecoveryOpportunity } from "@/lib/campaign-metrics.mjs";

type Indicator={userId:string;name:string;email:string;phone:string;accessStatus:string;activated:boolean;termsAcceptedAt:string|null;termsAcceptedVersion:string|null};
type TermsAudit={id:string;version:string;sha256:string;termsSnapshot:string;acceptedAt:string;ipAddress:string|null;userAgent:string|null};
type Campaign={id:string;indicatorUserId:string;name:string;publicCode:string;publicSlug:string|null;active:number;clickCount:number;cashbackMode:"fixed"|"percent";cashbackValue:number;createdAt:string};
type Order={id:string;orderNumber:string;campaignId:string|null;name:string;phone:string;paymentMethod:string;asaasPaymentId:string|null;asaasInvoiceUrl:string|null;kit:string;createdAt:string;asaasVerifiedAt:string|null;paymentStatus:string;productTotalCents:number;shippingCents:number;interestCents:number;totalCents:number;indicatorCashbackCents:number|null;utmSource:string;utmMedium:string};
type Window="all"|"7"|"30"|"90";
const money=(n:number)=>(n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const date=(s:string|null)=>s?new Date(s).toLocaleDateString("pt-BR"):"—";
const label=(s:string)=>s==="paid"?"Pagamento marcado":s==="cancelled"?"Cancelado/estornado":s==="payment_pending"?"Aguardando pagamento":s==="payment_error"?"Erro de checkout":s;
function recoveryLink(order: Order) {
 const phone = order.phone.replace(/\D/g, "");
 const international = /^[1-9]\d{9,10}$/.test(phone) ? `55${phone}` : phone;
 if (!/^55[1-9]\d{9,10}$/.test(international)) return null;
 const message = `Olá, ${order.name}! Aqui é da LORD NUTRI. Posso ajudar a concluir o pedido ${order.orderNumber}?`;
 return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}
function recoveryInvoice(order: Order) {
 if (order.paymentStatus !== "payment_pending" || !order.asaasPaymentId || !order.asaasInvoiceUrl) return null;
 try {
  const url = new URL(order.asaasInvoiceUrl);
  const host = url.hostname;
  if (url.protocol === "https:" && !url.username && !url.password && !url.port &&
    ["asaas.com", "www.asaas.com", "sandbox.asaas.com"].includes(host)) return url.href;
 } catch { /* Fatura antiga sem endereço válido. */ }
 return null;
}
export function IndicatorAdmin(){
 const [indicators,setIndicators]=useState<Indicator[]>([]),[campaigns,setCampaigns]=useState<Campaign[]>([]),[orders,setOrders]=useState<Order[]>([]);
 const [asaasEnvironment,setAsaasEnvironment]=useState("sandbox");
 const [termsVersion,setTermsVersion]=useState(""),[termsAudit,setTermsAudit]=useState<{userId:string;events:TermsAudit[]}|null>(null);
 const [selected,setSelected]=useState(""),[query,setQuery]=useState(""),[windowDays,setWindowDays]=useState<Window>("30"),[status,setStatus]=useState("all");
 const [notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[showCreate,setShowCreate]=useState(false);
 const [cashbackMode,setCashbackMode]=useState<"fixed"|"percent">("fixed"),[cashbackInput,setCashbackInput]=useState("15.00");
 const [campaignName,setCampaignName]=useState(""),[invitation,setInvitation]=useState<{userId:string;url:string;expiresAt:string|null}|null>(null);
 const load=useCallback(async()=>{const r=await fetch("/api/admin/indicators",{cache:"no-store"}),b=await r.json();if(!r.ok)throw Error(b.error||"Falha ao carregar BKO.");
  setTermsVersion(b.termsVersion||"");setAsaasEnvironment(b.asaasEnvironment||"sandbox");setIndicators(b.indicators||[]);setCampaigns(b.campaigns||[]);setOrders(b.orders||[]);setSelected(v=>(b.indicators||[]).some((i:Indicator)=>i.userId===v)?v:(b.indicators||[])[0]?.userId||"");
 },[]);
 useEffect(()=>{void load().catch(e=>setNotice(e.message))},[load]);
 const since=useMemo(()=>windowDays==="all"?null:Date.now()-Number(windowDays)*86400000,[windowDays]);
 const filtered=useMemo(()=>orders.filter(o=>!since||new Date(o.asaasVerifiedAt||o.createdAt).getTime()>=since),[orders,since]);
 const metrics=useMemo(()=>campaigns.map(c=>({partner:indicators.find(i=>i.userId===c.indicatorUserId),campaign:c,...summarizeCampaign(c,filtered)})),[campaigns,indicators,filtered]);
 const summary={confirmed:metrics.reduce((n,m)=>n+m.confirmedOrders,0),revenue:metrics.reduce((n,m)=>n+m.productRevenueCents,0),checkouts:metrics.reduce((n,m)=>n+m.checkouts,0),pixPending:metrics.reduce((n,m)=>n+m.pixPending,0),recovery:metrics.reduce((n,m)=>n+m.recoveryOpportunities,0),clicks:campaigns.reduce((n,c)=>n+c.clickCount,0)};
 const choice=indicators.find(u=>u.userId===selected);
 const campaign=campaigns.find(c=>c.indicatorUserId===selected);
 useEffect(()=>{setCashbackMode(campaign?.cashbackMode||"fixed");setCashbackInput(((campaign?.cashbackValue??1500)/100).toFixed(2));},[campaign?.id,campaign?.cashbackMode,campaign?.cashbackValue]);
 const partnerMetrics=metrics.find(m=>m.campaignId===campaign?.id);
 const recentOrders=filtered.filter(o=>o.campaignId===campaign?.id).filter(o=>{
  switch (status) {
   case "paid": return isVerifiedPaid(o);
   case "pix": return isPendingPix(o);
   case "recovery": return isRecoveryOpportunity(o);
   case "pending": return o.paymentStatus!=="cancelled"&&!isVerifiedPaid(o);
   case "cancelled": return o.paymentStatus==="cancelled";
   default: return true;
  }
 });
 const ranked=metrics.filter(m=>matchesIndicatorSearch(query,m.partner,m.campaign)).sort((a,b)=>b.productRevenueCents-a.productRevenueCents);
 const lifetimeMetrics=campaign?summarizeCampaign(campaign,orders):null;
 useEffect(()=>{const code=campaignCodeFromSearch(query);if(!code)return;const match=campaigns.find(c=>c.publicCode.toLowerCase()===code);if(match){setSelected(match.indicatorUserId);setCampaignName(match.name);setStatus("all");}},[query,campaigns]);
 const conversion=summary.checkouts?Math.round(10000*summary.confirmed/summary.checkouts)/100:0;
 async function fetchAction(url:string,body:Record<string,unknown>,method="POST"){
  const r=await fetch(url,{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)}),b=await r.json();if(!r.ok)throw Error(b.error||"Não foi possível atualizar.");return b;
 }
 async function saveCampaign(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setNotice("");
  try{await fetchAction("/api/admin/indicators/campaign",{indicatorUserId:selected,name:campaignName});await load();setNotice("Campanha salva. O link de vendas foi atualizado com o novo nome.");setCampaignName("")}
  catch(e){setNotice(e instanceof Error?e.message:"Erro ao salvar campanha.")}finally{setBusy(false)} }
 async function updateCashback(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!campaign)return;const decimal=cashbackInput.trim().replace(",",".");
  if(!/^\d+(\.\d{1,2})?$/.test(decimal)){setNotice("Informe valor válido com até duas casas decimais.");return;}
  const value=Math.round(Number(decimal)*100);
  if(!Number.isSafeInteger(value)||value<0||(cashbackMode==="percent"?value>10000:value>10000000)){setNotice("Cashback inválido (percentual entre 0 e 100%).");return;}
  setBusy(true);setNotice("");
  try{await fetchAction("/api/admin/indicators/campaign",{id:campaign.id,cashbackMode,cashbackValue:value},"PATCH");await load();setNotice("Cashback atualizado somente para novas compras verificadas. Valores já registrados não foram recalculados.");}
  catch(e){setNotice(e instanceof Error?e.message:"Falha ao salvar cashback.")}finally{setBusy(false)}
 }
 async function toggle(c:Campaign){setBusy(true);try{await fetchAction("/api/admin/indicators/campaign",{id:c.id,active:!c.active},"PATCH");await load();setNotice(c.active?"Campanha pausada.":"Campanha reativada.")}catch(e){setNotice(e instanceof Error?e.message:"Erro.")}finally{setBusy(false)}}
 async function create(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);try{const data=Object.fromEntries(new FormData(e.currentTarget));const b=await fetchAction("/api/admin/indicators",data);setInvitation(b.activationPath?{userId:b.userId,url:location.origin+b.activationPath,expiresAt:b.expiresAt||null}:null);setShowCreate(false);await load();setSelected(b.userId);setNotice(b.activationPath?"Indicador cadastrado. Envie o convite privado para criar a senha.":"Indicador cadastrado, mas o convite falhou. Use Gerar convite abaixo.")}catch(e){setNotice(e instanceof Error?e.message:"Erro ao cadastrar.")}finally{setBusy(false)}}
 async function generateInvite(){if(!choice||choice.accessStatus!=="active")return;setBusy(true);setNotice("");try{const b=await fetchAction("/api/admin/indicators/invite",{userId:choice.userId});if(!b.activationPath)throw Error("O convite não foi gerado.");setInvitation({userId:choice.userId,url:location.origin+b.activationPath,expiresAt:b.expiresAt||null});setNotice("Convite criado por 24h. Envie-o em privado ao indicador; o link pendente anterior foi invalidado. A senha antiga continua válida até ele ativar o novo convite.")}catch(e){setNotice(e instanceof Error?e.message:"Não foi possível gerar o convite.")}finally{setBusy(false)}}
 async function changeAccess(person:Indicator){
  const activate=person.accessStatus!=="active";
  if(!window.confirm(activate?`Reativar ${person.name}? O titular ainda precisará de uma senha para entrar.`:`Desativar ${person.name}? O acesso e as sessões serão encerrados, e o link de campanha deixará de funcionar.`))return;
  setBusy(true);setNotice("");
  try{await fetchAction("/api/admin/indicators",{userId:person.userId,active:activate},"PATCH");await load();setNotice(activate?"Acesso reativado. Caso a senha ainda não exista, clique em Gerar convite de ativação.":"Acesso desativado. A campanha não pode ser utilizada enquanto a conta estiver inativa.")}
  catch(e){setNotice(e instanceof Error?e.message:"Não foi possível alterar o acesso.")}
  finally{setBusy(false)}
 }
 async function deleteIndicator(person:Indicator){
  const confirmation=window.prompt(`EXCLUSÃO DEFINITIVA DE TESTE\n\nIndicador: ${person.name} (${person.email})\n\nApaga cadastro, campanha, convites e aceite de testes. Se existir pedido ou movimentação financeira, o servidor bloqueará a exclusão.\n\nDigite EXCLUIR para confirmar:`);
  if(confirmation!=="EXCLUIR")return;
  setBusy(true);setNotice("");
  try{await fetchAction("/api/admin/indicators",{userId:person.userId,email:person.email,confirm:"EXCLUIR"},"DELETE");setInvitation(null);setTermsAudit(null);setSelected("");await load();setNotice(`${person.name} foi excluído. O usuário ADMIN e os outros cadastros foram preservados.`)}
  catch(e){setNotice(e instanceof Error?e.message:"Não foi possível excluir o indicador.")}
  finally{setBusy(false)}
 }
 async function deleteTestIndicators(){
  if(!indicators.length)return;
  const confirmation=window.prompt(`LIMPEZA DE INDICADORES DE TESTE\n\nTentará excluir ${indicators.length} cadastros sem vínculos financeiros, preservando ADMIN, pedidos e dados reais. Para zerar TODO o banco comercial, utilize o script com backup.\n\nTenha seu backup antes de continuar. Digite ZERAR INDICADORES:`);
  if(confirmation!=="ZERAR INDICADORES")return;
  setBusy(true);setNotice("");let removed=0;const blocked:string[]=[];
  for(const person of indicators){
   try{await fetchAction("/api/admin/indicators",{userId:person.userId,email:person.email,confirm:"EXCLUIR"},"DELETE");removed++}
   catch(e){blocked.push(`${person.name}: ${e instanceof Error?e.message:"erro"}`)}
  }
  setInvitation(null);setTermsAudit(null);setSelected("");
  try{await load()}catch(e){blocked.push(e instanceof Error?e.message:"Falha ao atualizar a lista")}
  setNotice(`Limpeza concluída: ${removed} indicador(es) excluído(s). ${blocked.length?`Não removidos (${blocked.length}): ${blocked.join(" | ")}`:"Nenhum cadastro bloqueado."} Pedidos e outros módulos não foram apagados.`);setBusy(false);
 }
 async function inspectTerms(userId:string){setBusy(true);setNotice("");try{const r=await fetch(`/api/admin/indicators/terms?userId=${encodeURIComponent(userId)}`,{cache:"no-store"}),b=await r.json();if(!r.ok)throw Error(b.error||"Falha ao carregar auditoria.");setTermsAudit({userId,events:b.events||[]})}catch(e){setNotice(e instanceof Error?e.message:"Erro de auditoria.")}finally{setBusy(false)}}
 async function copy(url:string){try{await navigator.clipboard.writeText(url);setNotice("Link copiado.")}catch{setNotice("Selecione e copie o link.")}}
 return <section className="portal-card crm-admin crm-v2"><div className="crm-heading"><div><span className="section-kicker">LORD NUTRI · COMERCIAL / SELLER</span><h2>Central de vendas e influenciadores</h2><p className="portal-form-help">Checkout → Asaas → venda confirmada → receita dos produtos. Sem comprovantes e sem frete nos KPIs.</p></div><button className="secondary-button compact" onClick={()=>void load().catch(e=>setNotice(e.message))}>Atualizar dados</button></div>
 {asaasEnvironment==="sandbox"?<p className="portal-notice">Modo de testes Asaas (sandbox): indicadores não equivalem a faturamento real.</p>:null}
 {notice?<div className="portal-notice" role="status">{notice}</div>:null}
 {invitation&&invitation.userId===selected?<div className="crm-campaign-link"><strong>Convite privado para criar/redefinir senha (válido por 24h)</strong><input readOnly value={invitation.url} onFocus={e=>e.currentTarget.select()}/><button className="secondary-button compact" onClick={()=>void copy(invitation.url)}>Copiar convite</button><p className="crm-quiet">Compartilhe diretamente com o indicador. A senha nunca aparece no BKO.</p></div>:null}
 <div className="crm-v2-toolbar"><label>Período dos pedidos<select value={windowDays} onChange={e=>setWindowDays(e.target.value as Window)}><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option><option value="all">Todo o histórico</option></select></label><label><Search size={17} aria-hidden="true" style={{display:"inline",verticalAlign:"middle",marginRight:6}}/>Buscar influenciador pelo link ou código<input type="search" placeholder="Cole o link, código ou mensagem do WhatsApp; ou digite o nome" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
 <CheckoutFunnel admin />
 <div className="crm-kpi-grid"><div><span>Vendas verificadas · Asaas</span><strong>{summary.confirmed}</strong><small>Somente notificações reais de pagamento</small></div><div><span>Receita de produtos</span><strong>{money(summary.revenue)}</strong><small>Frete e juros excluídos</small></div><div><span>Checkouts criados</span><strong>{summary.checkouts}</strong></div><div><span>PIX pendentes</span><strong>{summary.pixPending}</strong></div><div><span>Oportunidades de recuperação</span><strong>{summary.recovery}</strong></div><div><span>Conversão de checkout</span><strong>{conversion}%</strong><small>Pagos / iniciados</small></div><div><span>Links ativos</span><strong>{campaigns.filter(c=>c.active).length}</strong><small>{campaigns.length} campanhas no total</small></div><div><span>Acessos ao link (total)</span><strong>{summary.clicks}</strong><small>Estimativa histórica · inclui prévias</small></div></div>
 <section className="lord-admin-campaigns" aria-label="Campanhas e links dos influenciadores"><div className="lord-admin-campaigns-heading"><div><h3>Campanhas e links</h3><p>Links individuais dos influenciadores cadastrados. Apenas o BKO pode visualizar todas as campanhas.</p></div><span>Links reais · {campaigns.filter(c=>c.active).length} ativos</span></div>
  {campaigns.length?<div className="lord-admin-campaign-grid">{campaigns.map(c=>{const partner=indicators.find(i=>i.userId===c.indicatorUserId);const salesUrl=`${typeof window==="undefined"?"https://revendedores.mix10pro.com.br":window.location.origin}/v/${c.publicSlug||c.publicCode}`;return <article className="lord-admin-campaign-tile" key={c.id}><span className="lord-admin-campaign-code">{c.name}</span><h4>{partner?.name||"Influenciador"}</h4><p className="lord-admin-campaign-url" title={salesUrl}>{salesUrl}</p><div className="lord-admin-campaign-actions"><button className="secondary-button compact" type="button" onClick={()=>void copy(salesUrl)}>Copiar</button><button className="secondary-button compact" type="button" onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`Conheça a LORD NUTRI: ${salesUrl}`)}`,"_blank","noopener,noreferrer")}>Compartilhar</button><button className="secondary-button compact" type="button" onClick={()=>{setSelected(c.indicatorUserId);setCampaignName(c.name);setStatus("all")}}>Gerenciar</button></div>{!c.active?<small>Campanha pausada</small>:null}</article>})}</div>:<p className="crm-quiet">Nenhuma campanha cadastrada ainda. Cadastre um influenciador para gerar seu link individual.</p>}</section>
 <div className="crm-v2-two"><div className="crm-v2-ranking"><div className="crm-sidebar-head"><h3>Performance por influenciador</h3><button className="secondary-button compact" disabled={busy} onClick={()=>setShowCreate(!showCreate)}>{showCreate?"Fechar":"+ Influenciador"}</button></div><div className="crm-ops-clean"><span>{indicators.length} indicador(es) cadastrados · {indicators.filter(i=>i.accessStatus==="active").length} com acesso ativo</span><button type="button" className="secondary-button compact crm-danger-outline" disabled={busy||!indicators.length} onClick={()=>void deleteTestIndicators()}>Limpar indicadores de teste</button><small>Exclui apenas cadastros sem movimentações financeiras. Para zerar pedidos, use a rotina com backup.</small></div>
 {showCreate?<form className="portal-form" onSubmit={create}><label>Nome<input name="name" required/></label><label>E-mail<input name="email" type="email" required/></label><label>Telefone<input name="phone" required/></label><button className="primary-button" disabled={busy}>Criar acesso</button></form>:null}
 {ranked.length?<div className="crm-v2-rank-head"><span>Campanha / parceiro</span><span>Compras</span><span>Receita / Cashback</span></div>:null}
 {ranked.map(m=><button type="button" key={m.campaignId} className={`crm-v2-rank-row ${selected===m.campaign.indicatorUserId?"selected":""}`} onClick={()=>{setSelected(m.campaign.indicatorUserId);setCampaignName(m.name);setStatus("all")}}><span><strong>{m.partner?.name||"Parceiro"}</strong><small>{m.name}</small></span><b>{m.confirmedOrders}</b><span><b>{money(m.productRevenueCents)}</b><small style={{opacity:1,color:"#08724d",fontWeight:700}}>Cashback: {money(m.cashbackAccruedCents)}</small></span></button>)}
 {campaigns.length===0?<p className="crm-empty">Nenhuma campanha. Selecione um parceiro abaixo para gerar seu link.</p>:null}
 {query.trim()&&!ranked.length?<p role="status">Nenhuma campanha encontrada para essa busca.</p>:null}
 {indicators.filter(i=>matchesIndicatorSearch(query,i,null)&&!campaigns.some(c=>c.indicatorUserId===i.userId)).map(i=><button type="button" key={i.userId} className={`crm-v2-rank-row ${selected===i.userId?"selected":""}`} onClick={()=>{setSelected(i.userId);setCampaignName("")}}><strong>{i.name}</strong><span>Sem campanha</span></button>)}
 </div><div className="crm-v2-detail">{choice?<><div className="crm-profile"><div><span className="section-kicker">CARTEIRA DO INFLUENCIADOR</span><h3>{choice.name}</h3><p>{choice.email} · {choice.phone}</p><p className="crm-quiet">{choice.activated?"Senha cadastrada":"Aguardando criação de senha"}</p>
 <p className="crm-quiet"><b>Termo de participação:</b> {choice.termsAcceptedAt?`Aceito em ${new Date(choice.termsAcceptedAt).toLocaleString("pt-BR")} · versão ${choice.termsAcceptedVersion}`:"Aceite pendente · campanha bloqueada até aceitar"}</p></div><span className="crm-status">{choice.accessStatus==="active"?"Acesso ativo":"Acesso inativo"}</span></div>
 <div className="crm-actions"><button type="button" className="secondary-button compact" disabled={busy} onClick={()=>void changeAccess(choice)}>{choice.accessStatus==="active"?"Desativar acesso":"Reativar acesso"}</button><button type="button" className="secondary-button compact" disabled={busy||choice.accessStatus!=="active"} onClick={()=>void generateInvite()}>{choice.activated?"Gerar link para redefinir senha":"Gerar convite de ativação"}</button><button type="button" className="secondary-button compact" disabled={busy} onClick={()=>void inspectTerms(choice.userId)}>Auditar aceite</button><button type="button" className="secondary-button compact crm-danger-outline" disabled={busy} onClick={()=>void deleteIndicator(choice)}>Excluir cadastro de teste</button></div>
 {termsAudit?.userId===choice.userId?<div className="terms-audit"><strong>Histórico de aceite · versão atual {termsVersion}</strong>{termsAudit.events.length?termsAudit.events.map(event=><div key={event.id}><p><b>Versão {event.version}</b> · {new Date(event.acceptedAt).toLocaleString("pt-BR")}</p><small>Comprovante SHA-256: <code>{event.sha256}</code></small><small>IP de registro: {event.ipAddress||"não disponível"}</small><small>Navegador: {event.userAgent||"não informado"}</small><details><summary>Ver texto integral desta versão aceita</summary><pre className="terms-snapshot">{event.termsSnapshot}</pre></details></div>):<p>Nenhum aceite registrado neste perfil.</p>}<button type="button" className="secondary-button compact" onClick={()=>setTermsAudit(null)}>Ocultar auditoria</button></div>:null}
 <form className="portal-form crm-v2-campaign-form" onSubmit={saveCampaign}><label>CAMPANHA<input name="campaignName" required minLength={3} maxLength={120} placeholder="Ex.: Instagram Outubro" value={campaignName||campaign?.name||""} onChange={e=>setCampaignName(e.target.value)}/></label><button className="primary-button compact" disabled={busy||choice.accessStatus!=="active"}>{campaign?"Salvar campanha":"Gerar links"}</button></form>
 {campaign?<form className="portal-form" onSubmit={updateCashback} style={{marginBottom:16}}>
 <strong>Cashback do influenciador · editável pelo BKO</strong>
 <p className="crm-quiet">Padrão: R$ 15,00 por compra confirmada. Regra independente de revendedores e sem frete na base percentual.</p>
 <div className="crm-actions"><label>Modalidade<select aria-label="Modalidade cashback" value={cashbackMode} onChange={e=>setCashbackMode(e.target.value as "fixed"|"percent")}><option value="fixed">Valor fixo (R$ por compra)</option><option value="percent">Percentual (%) dos produtos</option></select></label>
 <label>{cashbackMode==="fixed"?"Valor por venda (R$)":"Percentual sobre produtos (%)"}<input aria-label="Valor de cashback" type="text" inputMode="decimal" required value={cashbackInput} onChange={e=>setCashbackInput(e.target.value)} /></label>
 <button type="submit" className="primary-button compact" disabled={busy}>Salvar cashback</button></div>
 <p className="crm-quiet">As regras novas entram em vigor para os próximos pagamentos elegíveis; cashback anteriormente registrado permanece como estava.</p>
 </form>:null}
 {campaign?<div className="crm-campaign-link"><div className="crm-actions"><button className="secondary-button compact" disabled={busy} onClick={()=>void toggle(campaign)}>{campaign.active?"Pausar":"Reativar"}</button></div><label>Link de vendas<input readOnly value={typeof location==="undefined"?`/v/${campaign.publicSlug||campaign.publicCode}`:`${location.origin}/v/${campaign.publicSlug||campaign.publicCode}`} onFocus={e=>e.currentTarget.select()}/></label><button className="primary-button compact" onClick={()=>void copy(`${location.origin}/v/${campaign.publicSlug||campaign.publicCode}`)}>Copiar link de vendas</button></div>:null}
 {lifetimeMetrics?<section aria-label="Total de cashback do influenciador" style={{padding:20,margin:"18px 0",border:"1px solid #90c8ac",borderRadius:12,background:"#eaf6ef",color:"#124631"}}><span>Cashback total apurado · todo o histórico</span><strong style={{display:"block",fontSize:30}}>{money(lifetimeMetrics.cashbackAccruedCents)}</strong><small>{lifetimeMetrics.confirmedOrders} venda(s) confirmada(s). Total acumulado; não representa saldo disponível ou valores ainda não pagos.</small>{lifetimeMetrics.uncalculatedOrders?<p>{lifetimeMetrics.uncalculatedOrders} pedido(s) confirmado(s) sem cashback apurado.</p>:null}</section>:null}
 {partnerMetrics?<section className="crm-mini-kpis"><div><span>Pagas</span><strong>{partnerMetrics.confirmedOrders}</strong></div><div><span>Produtos</span><strong>{money(partnerMetrics.productRevenueCents)}</strong></div><div><span>Iniciadas</span><strong>{partnerMetrics.checkouts}</strong></div><div><span>Ticket médio</span><strong>{money(partnerMetrics.averageTicketCents)}</strong></div></section>:null}
 {partnerMetrics?<p className="crm-quiet"><b>Cashback apurado no período selecionado:</b> {money(partnerMetrics.cashbackAccruedCents)} {partnerMetrics.uncalculatedOrders?`· ${partnerMetrics.uncalculatedOrders} pedido(s) antigos sem apuração automática`:""}. Pagamento exige liberação pelo BKO.</p>:null}
 {campaign?<><div className="crm-orders-head"><h3>Funil e pedidos atribuídos</h3><label>Filtrar<select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Todos</option><option value="paid">Pagamento Asaas</option><option value="pending">Pendentes</option><option value="pix">PIX pendentes</option><option value="recovery">Recuperação</option><option value="cancelled">Cancelados / estornados</option></select></label></div>
 <div className="crm-v2-order-list">{recentOrders.map(o=>{const contact=isRecoveryOpportunity(o)?recoveryLink(o):null;const invoice=recoveryInvoice(o);return <article key={o.id} className="crm-v2-order"><div><strong>{o.orderNumber}</strong><small>{o.name} · {o.kit} · {date(o.asaasVerifiedAt||o.createdAt)}</small><small>{o.utmSource||"Origem não informada"}{o.utmMedium?` / ${o.utmMedium}`:""}</small></div><div><span className={`crm-status ${isVerifiedPaid(o)?"crm-confirmed":o.paymentStatus==="cancelled"?"crm-rejected":"crm-pending"}`}>{isVerifiedPaid(o)?"Pago no Asaas":isPendingPix(o)?"PIX pendente":label(o.paymentStatus)}</span><strong>{isVerifiedPaid(o)?money(o.productTotalCents||Math.max(0,o.totalCents-o.shippingCents-o.interestCents)):"—"}</strong>{isVerifiedPaid(o)?<small>Cashback: {o.indicatorCashbackCents===null?"não apurado":money(o.indicatorCashbackCents)}</small>:null}{o.asaasPaymentId?<PaymentSync purchaseId={o.id} onUpdated={load}/>:null}{contact||invoice?<div className="crm-actions">
 {contact?<a className="secondary-button compact" href={contact} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>:null}
 {invoice?<button className="secondary-button compact" type="button" onClick={()=>void copy(invoice)}>Copiar cobrança Asaas</button>:null}
 </div>:null}</div></article>})}{!recentOrders.length?<p className="crm-empty">Sem pedidos nesta etapa ou período.</p>:null}</div></>:<p className="crm-empty">Crie uma campanha para começar o rastreio automático.</p>}
 </>:<p className="crm-empty">Cadastre um influenciador para abrir a carteira.</p>}</div></div>
 <p className="crm-quiet">Cliques são acumulados historicamente e podem incluir prévias automáticas; filtro de período aplica-se aos pedidos. Dados Asaas de teste (sandbox) não representam vendas reais.</p>
 </section>;
}
