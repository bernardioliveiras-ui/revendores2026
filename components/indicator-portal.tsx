"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

type Lead={id:string;name:string;phone:string;channel:string;status:string;clickCount:number;createdAt:string;publicPath:string;hasReceipt:boolean;receiptSentAt:string|null;receiptReview:string;receiptGuidance:string;cashbackCents:number|null;cashbackStatus:string};
const money=(n:number)=> (n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function IndicatorPortal(){
 const [leads,setLeads]=useState<Lead[]>([]),[name,setName]=useState("");
 const [notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{
  const session=await fetch("/api/auth/session",{cache:"no-store"});const sb=await session.json();
  if(!sb.authenticated){location.replace("/entrar");return}
  if(sb.user.role!=="indicator"){location.replace(sb.user.role==="client_indicated"?"/minha-indicacao":"/painel");return}
  setName(sb.user.name);
  const r=await fetch("/api/indicator/leads",{cache:"no-store"}),b=await r.json();
  if(!r.ok)throw new Error(b.error||"Não foi possível carregar suas indicações.");setLeads(b.leads||[]);
 },[]);
 useEffect(()=>{void load().catch(e=>setNotice(e instanceof Error?e.message:"Erro ao carregar.")).finally(()=>setLoading(false))},[load]);
 async function create(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setNotice("");const form=e.currentTarget;
  try{const r=await fetch("/api/indicator/leads",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form)))}),b=await r.json();if(!r.ok)throw new Error(b.error);form.reset();setNotice("Indicação cadastrada! Use o botão WhatsApp para enviar o link de compra.");await load()}
  catch(error){setNotice(error instanceof Error?error.message:"Não foi possível cadastrar.")}finally{setBusy(false)}
 }
 async function upload(e:FormEvent<HTMLFormElement>,id:string){e.preventDefault();setBusy(true);setNotice("");const form=e.currentTarget;
  try{const data=new FormData(form);data.set("id",id);const r=await fetch("/api/indicator/receipt",{method:"POST",body:data}),b=await r.json();if(!r.ok)throw new Error(b.error);form.reset();setNotice("Comprovante enviado ao BKO para conferência. Ainda não é uma venda aprovada.");await load()}
  catch(error){setNotice(error instanceof Error?error.message:"Falha ao enviar comprovante.")}finally{setBusy(false)}
 }
 function whatsapp(l:Lead){const link=`${location.origin}${l.publicPath}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(`Olá! Segue seu link para comprar o Mix10 Pro: ${link}
Depois da compra, me envie seu comprovante de pagamento para conferência.`)}`,"_blank","noopener,noreferrer")}
 async function copy(l:Lead){try{await navigator.clipboard.writeText(`${location.origin}${l.publicPath}`);setNotice("Link de compra copiado.")}catch{setNotice("Não foi possível copiar automaticamente.")}}
 async function logout(){await fetch("/api/auth/logout",{method:"POST"});location.href="/entrar"}
 const confirmed=leads.filter(l=>l.hasReceipt&&l.receiptReview==="APROVADO"&&l.status==="COMPROU").length;
 return <main className="indicator-shell">
  <header className="indicator-top"><Link href="/" aria-label="LORD NUTRI"><BrandLogo compact/></Link><button className="secondary-button compact" onClick={()=>void logout()}>Sair</button></header>
  <div className="indicator-content"><span className="section-kicker">LORD NUTRI · INDICADORES</span><h1>Minhas indicações</h1><p>Olá, {name}. Compartilhe os links de compra e acompanhe apenas as suas indicações. Não há acesso ao setor de revendedores.</p>
  {notice?<div className="portal-notice" role="status">{notice}</div>:null}
  <section className="indicator-stats"><div><strong>{leads.length}</strong><span>Indicações registradas</span></div><div><strong>{leads.filter(l=>l.hasReceipt&&l.receiptReview==="PENDENTE").length}</strong><span>Aguardando conferência</span></div><div><strong>{confirmed}</strong><span>Compras confirmadas pelo BKO</span></div><div><strong>{leads.filter(l=>l.receiptReview==="REJEITADO"&&l.hasReceipt).length}</strong><span>Comprovantes rejeitados</span></div></section>
  <section className="portal-card"><h2>Indicar uma pessoa</h2><p className="portal-form-help">Cadastre a pessoa para gerar um link individual de compra. O envio do link não confirma a venda.</p>
    <form onSubmit={create} className="portal-form indicator-form"><label>Nome do comprador<input name="name" maxLength={120} required/></label><label>WhatsApp / telefone<input name="phone" type="tel" required placeholder="DDD + número"/></label><label>Canal<select name="channel" defaultValue="WhatsApp"><option>WhatsApp</option><option>Instagram</option><option>Indicação pessoal</option><option>Outro</option></select></label><button className="primary-button" disabled={busy}>Gerar link de compra</button></form>
  </section>
  <section className="portal-card"><h2>Indicações e comprovantes</h2><p className="portal-form-help">Depois que a pessoa comprar, peça o comprovante em conversa privada e anexe aqui. Somente o BKO pode aprovar. Cada indicação aprovada conta uma vez.</p>
   {loading?<p>Carregando…</p>:leads.length===0?<p>Nenhuma indicação ainda.</p>:<div className="indicator-lead-list">{leads.map(l=><article key={l.id} className="indicator-lead"><div className="indicator-lead-title"><div><strong>{l.name}</strong><small>{l.phone} · {l.channel}</small></div><span className="status-pill">{l.status}</span></div>
   <p>Cliques no link: {l.clickCount} <small>(estimativa; prévias podem gerar acessos)</small></p>
   <div className="indicated-actions"><button className="primary-button" onClick={()=>whatsapp(l)}>Enviar pelo WhatsApp</button><button className="secondary-button compact" onClick={()=>void copy(l)}>Copiar link</button></div>
   <p><strong>Comprovante:</strong> {!l.hasReceipt?"Não enviado":l.receiptReview}{l.receiptSentAt?` · ${new Date(l.receiptSentAt).toLocaleDateString("pt-BR")}`:""}</p>
   {l.hasReceipt?<a className="secondary-button compact" href={`/api/indicator/receipt?id=${encodeURIComponent(l.id)}`} target="_blank" rel="noreferrer">Baixar comprovante enviado</a>:null}
   {l.receiptReview==="REJEITADO"&&l.receiptGuidance?<p className="indicator-guidance">Orientação do BKO: {l.receiptGuidance}</p>:null}
   {l.status!=="COMPROU"?<form className="portal-form indicator-upload" onSubmit={e=>void upload(e,l.id)}><label>{l.hasReceipt?"Reenviar comprovante":"Anexar comprovante do comprador"}<input type="file" name="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" required/></label><button className="secondary-button compact" disabled={busy}>Enviar para conferência (até 8 MB)</button></form>:<p className="indicator-guidance">Compra confirmada. Cashback {l.cashbackCents===null?"a definir pelo BKO":money(l.cashbackCents)} · {l.cashbackStatus}</p>}
   </article>)}</div>}
  </section></div>
 </main>
}
