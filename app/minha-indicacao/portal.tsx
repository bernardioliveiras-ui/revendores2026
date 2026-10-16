"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
type Indication={id:string;name:string;phone:string;channel:string;responsible:string;status:string;receiptUploaded:boolean;receiptSentAt:string|null;receiptReview:string;receiptGuidance:string};
export function IndicatedClientPortal(){
 const [item,setItem]=useState<Indication|null>(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[notice,setNotice]=useState("");
 const load=useCallback(async()=>{try{const session=await fetch("/api/auth/session",{cache:"no-store"}).then(r=>r.json());if(!session.authenticated){location.replace("/entrar");return;}if(session.user.mustChangePassword){location.replace("/trocar-senha");return;}if(session.user.role!=="client_indicated"){location.replace("/painel");return;}
  const r=await fetch("/api/indicated/me",{cache:"no-store"});const b=await r.json();if(!r.ok)throw new Error(b.error);setItem(b.indication);
 }catch(e){setNotice(e instanceof Error?e.message:"Não foi possível carregar sua indicação.");}finally{setLoading(false);}},[]);
 useEffect(()=>{void load()},[load]);
 async function update(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setNotice("");const f=new FormData(e.currentTarget);try{const r=await fetch("/api/indicated/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({name:f.get("name"),phone:f.get("phone")})});const b=await r.json();if(!r.ok)throw new Error(b.error);setNotice("Dados atualizados.");await load();}catch(e){setNotice(e instanceof Error?e.message:"Erro ao atualizar.");}finally{setSaving(false);}}
 async function upload(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setNotice("");const form=e.currentTarget;const data=new FormData(form);try{const r=await fetch("/api/indicated/receipt",{method:"POST",body:data});const b=await r.json();if(!r.ok)throw new Error(b.error);setNotice("Comprovante recebido. O BKO fará a conferência; a compra não foi marcada automaticamente.");form.reset();await load();}catch(err){setNotice(err instanceof Error?err.message:"Não foi possível enviar.");}finally{setSaving(false);}}
 async function logout(){await fetch("/api/auth/logout",{method:"POST"});location.replace("/entrar");}
 if(loading)return <main className="portal-loading">Carregando sua indicação…</main>;
 return <main className="portal-shell indicated-client-shell"><header className="portal-header"><Link href="/" aria-label="Página inicial"><BrandLogo compact/></Link><div><span>Cliente indicado</span><button onClick={()=>void logout()}>Sair</button></div></header>
 <div className="portal-body indicated-client-body"><div className="portal-title"><div><span className="section-kicker">LORD NUTRI · Minha área</span><h1>Minha indicação</h1><p>Consulte seus dados e acompanhe a conferência do comprovante.</p></div></div>
 {notice?<div role="status" className="portal-notice">{notice}</div>:null}
 {item?<><section className="portal-card"><div className="card-title"><h2>Andamento</h2><span className="status-pill">{item.status}</span></div><p><strong>Conferência do comprovante:</strong> {item.receiptUploaded?item.receiptReview:"Aguardando envio"}</p>{item.receiptSentAt?<p>Último envio: {new Date(item.receiptSentAt).toLocaleString("pt-BR")}</p>:null}
 {item.receiptReview==="REJEITADO"&&item.receiptGuidance?<p role="alert"><strong>Orientação do BKO:</strong> {item.receiptGuidance}</p>:null}
 <a href="https://mix10pro.com.br/lp-v2" target="_blank" rel="noreferrer" className="primary-button">Acessar compra unitária</a></section>
 <section className="portal-card"><h2>Meus dados</h2><form onSubmit={e=>void update(e)} className="portal-form"><label>Nome<input name="name" key={`name-${item.name}`} defaultValue={item.name} required/></label><label>Telefone<input name="phone" key={`phone-${item.phone}`} defaultValue={item.phone} required type="tel"/></label><p><strong>Canal:</strong> {item.channel}</p><p><strong>Responsável:</strong> {item.responsible}</p><button className="secondary-button" disabled={saving}>Confirmar / atualizar dados</button></form></section>
 <section className="portal-card"><h2>Meu comprovante de pagamento</h2><p>Envie seu comprovante em PDF, JPG ou PNG, de até 8 MB. A análise é manual; enviar não muda automaticamente o status para COMPROU.</p>
 {item.receiptUploaded?<p><a className="secondary-button compact" href={`/api/indicated/receipt?id=${encodeURIComponent(item.id)}`}>Baixar meu comprovante</a></p>:null}
 {!(item.status==="COMPROU"&&item.receiptReview==="APROVADO")?<form onSubmit={e=>void upload(e)} className="portal-form"><label>Selecionar comprovante<input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required/></label><button disabled={saving} className="primary-button">{saving?"Enviando…":"Enviar comprovante"}</button></form>:<p>Seu comprovante já foi aprovado pelo BKO.</p>}
 </section></>:null}</div></main>;
}
