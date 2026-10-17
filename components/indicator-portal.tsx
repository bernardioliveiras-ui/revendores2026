"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingFolder } from "@/components/marketing-folder";
import { crmLeadStage, crmMetrics } from "@/lib/indicator-crm";

type Lead={id:string;name:string;phone:string;channel:string;status:string;clickCount:number;shareAttempts:number;createdAt:string;publicPath:string;hasReceipt:boolean;receiptSentAt:string|null;receiptReview:string;receiptGuidance:string;cashbackCents:number|null;cashbackStatus:string};
const money=(n:number)=> (n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const stages={all:"Todas",in_progress:"Em acompanhamento",pending:"Comprovante pendente",reviewed:"Aprovada sem compra",confirmed:"Compra confirmada",rejected:"Rejeitada"} as const;
type Filter=keyof typeof stages;
export function IndicatorPortal(){
 const [leads,setLeads]=useState<Lead[]>([]),[name,setName]=useState("");
 const [filter,setFilter]=useState<Filter>("all"),[search,setSearch]=useState(""),[showNew,setShowNew]=useState(true);
 const [notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{
  const session=await fetch("/api/auth/session",{cache:"no-store"}),sb=await session.json();
  if(!sb.authenticated){location.replace("/entrar");return}
  if(sb.user.role!=="indicator"){location.replace(sb.user.role==="client_indicated"?"/minha-indicacao":"/painel");return}
  setName(sb.user.name);
  const r=await fetch("/api/indicator/leads",{cache:"no-store"}),b=await r.json();
  if(!r.ok)throw new Error(b.error||"Não foi possível carregar suas indicações.");setLeads(b.leads||[]);
 },[]);
 useEffect(()=>{void load().catch(e=>setNotice(e instanceof Error?e.message:"Erro ao carregar.")).finally(()=>setLoading(false))},[load]);
 async function create(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setNotice("");const form=e.currentTarget;
  try{const r=await fetch("/api/indicator/leads",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form)))}),b=await r.json();if(!r.ok)throw new Error(b.error);form.reset();setShowNew(false);setFilter("all");setNotice("Indicação criada. Abra o WhatsApp no card do comprador para preparar a mensagem.");await load()}catch(error){setNotice(error instanceof Error?error.message:"Não foi possível cadastrar.")}finally{setBusy(false)}
 }
 async function upload(e:FormEvent<HTMLFormElement>,id:string){e.preventDefault();setBusy(true);setNotice("");const form=e.currentTarget;
  try{const data=new FormData(form);data.set("id",id);const r=await fetch("/api/indicator/receipt",{method:"POST",body:data}),b=await r.json();if(!r.ok)throw new Error(b.error);form.reset();setNotice("Comprovante enviado ao BKO. A compra ainda não foi confirmada.");await load()}catch(error){setNotice(error instanceof Error?error.message:"Falha ao anexar comprovante.")}finally{setBusy(false)}
 }
 function whatsapp(l:Lead){
  const link=`${location.origin}${l.publicPath}`;
  const text=`Olá! Segue seu link para comprar o Mix10 Pro: ${link}\nDepois da compra, me envie o comprovante de pagamento por aqui.`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank","noopener,noreferrer");
  // Registra somente a intenção de compartilhar. Não temos confirmação do WhatsApp.
  void fetch("/api/indicator/leads/share",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:l.id})})
   .then(r=>{if(!r.ok)throw Error("Não foi possível registrar o clique no compartilhamento.");return load()})
   .catch(e=>setNotice(e instanceof Error?e.message:"Falha ao registrar a ação."));
 }
 async function copy(l:Lead){try{await navigator.clipboard.writeText(`${location.origin}${l.publicPath}`);setNotice("Link de compra copiado (não é um envio confirmado).") }catch{setNotice("Não foi possível copiar automaticamente.")}}
 async function logout(){await fetch("/api/auth/logout",{method:"POST"});location.href="/entrar"}
 const normalized=leads.map(l=>({...l,receiptId:l.hasReceipt?"enviado":null}));
 const totals=crmMetrics(normalized);
 const visible=leads.filter(l=>(filter==="all"||crmLeadStage({...l,receiptId:l.hasReceipt?"enviado":null})===filter)&&`${l.name} ${l.phone}`.toLowerCase().includes(search.toLowerCase()));
 return <main className="indicator-shell">
  <header className="indicator-top"><Link href="/" aria-label="LORD NUTRI"><BrandLogo compact/></Link><button className="secondary-button compact" onClick={()=>void logout()}>Sair</button></header>
  <div className="indicator-content"><span className="section-kicker">LORD NUTRI · PARCEIROS</span><h1>Minha carteira de indicações</h1><p>Olá, {name}. Aqui você cria links individuais, acompanha compradores e encaminha comprovantes para o BKO. Você não precisa acessar o setor de revendedores.</p>
   {notice?<div className="portal-notice" role="status">{notice}</div>:null}
   <section className="indicator-stats crm-metrics"><div><strong>{totals.generated}</strong><span>Links gerados</span></div><div><strong>{totals.shareIntent}</strong><span>Cliques em compartilhar</span></div><div><strong>{totals.visits}</strong><span>Aberturas estimadas</span></div><div><strong>{totals.pending}</strong><span>Comprovantes pendentes</span></div><div><strong>{totals.confirmed}</strong><span>Compras confirmadas</span></div></section>
   <p className="crm-quiet">Compartilhar abre o WhatsApp, mas não confirma envio. Aberturas podem incluir prévias de aplicativos. Somente a aprovação do BKO confirma a compra.</p>
   <MarketingFolder/>
   <section className="portal-card"><div className="crm-sidebar-head"><div><h2>Novo comprador</h2><p className="portal-form-help">Uma pessoa indicada = um card com link individual e comprovante próprio.</p></div><button className="secondary-button compact" onClick={()=>setShowNew(!showNew)} aria-expanded={showNew}>{showNew?"Ocultar cadastro":"+ Cadastrar indicação"}</button></div>
    {showNew?<form onSubmit={create} className="portal-form indicator-form"><label>Nome do comprador<input name="name" maxLength={120} required/></label><label>WhatsApp / telefone<input name="phone" type="tel" required placeholder="DDD + número"/></label><label>Canal<select name="channel" defaultValue="WhatsApp"><option>WhatsApp</option><option>Instagram</option><option>Indicação pessoal</option><option>Outro</option></select></label><button className="primary-button" disabled={busy}>Criar card e gerar link</button></form>:null}
   </section>
   <section className="portal-card"><h2>Meus compradores</h2><p className="portal-form-help">Acompanhe cada pessoa até a conferência do BKO. Comprovantes ficam privados e não contam como venda enquanto estiverem pendentes.</p>
    <div className="crm-filters"><label>Buscar comprador<input placeholder="Nome ou telefone" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Etapa<select value={filter} onChange={e=>setFilter(e.target.value as Filter)}>{Object.entries(stages).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label></div>
    {loading?<p>Carregando…</p>:visible.length===0?<p className="crm-empty">Nenhum comprador nesta etapa.</p>:<div className="indicator-lead-list">{visible.map(l=>{const stage=crmLeadStage({...l,receiptId:l.hasReceipt?"enviado":null});return <article key={l.id} className="indicator-lead crm-order"><div className="indicator-lead-title"><div><span className="crm-eyebrow">Indicação · {new Date(l.createdAt).toLocaleDateString("pt-BR")}</span><strong>{l.name}</strong><small>{l.phone} · {l.channel}</small></div><span className={`crm-status crm-${stage}`}>{stages[stage]}</span></div>
     <div className="crm-order-data"><div><span>Status da indicação</span><strong>{l.status}</strong></div><div><span>Compartilhar acionado</span><strong>{l.shareAttempts||0}×</strong></div><div><span>Aberturas estimadas</span><strong>{l.clickCount||0}</strong></div><div><span>Comprovante</span><strong>{l.hasReceipt?l.receiptReview:"Não enviado"}</strong></div></div>
     <div className="crm-actions"><button className="primary-button" onClick={()=>whatsapp(l)}>Abrir WhatsApp com link</button><button className="secondary-button compact" onClick={()=>void copy(l)}>Copiar link</button></div>
     {l.hasReceipt?<div className="crm-proof"><p>Comprovante enviado em {l.receiptSentAt?new Date(l.receiptSentAt).toLocaleDateString("pt-BR"):"data não disponível"}.</p><a className="secondary-button compact" href={`/api/indicator/receipt?id=${encodeURIComponent(l.id)}`} target="_blank" rel="noreferrer">Ver meu comprovante</a></div>:null}
     {stage==="rejected"&&l.receiptGuidance?<p className="indicator-guidance">Orientação do BKO: {l.receiptGuidance}</p>:null}
     {stage!=="confirmed"?<form className="portal-form indicator-upload" onSubmit={e=>void upload(e,l.id)}><label>{l.hasReceipt?"Substituir comprovante":"Anexar comprovante do comprador"}<input type="file" name="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" required/></label><button className="secondary-button compact" disabled={busy}>Enviar ao BKO (até 8 MB)</button></form>:<p className="indicator-guidance">Compra confirmada pelo BKO. Cashback {l.cashbackCents===null?"a definir":money(l.cashbackCents)} · {l.cashbackStatus}</p>}
    </article>})}</div>}
   </section>
  </div>
 </main>
}
