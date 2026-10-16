"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Indication = {
 id:string; name:string; email:string; phone:string; channel:string; responsible:string; status:string;
 clientUserId:string; accessStatus:string; activationStatus:"activated"|"awaiting_activation"; receiptId:string|null; receiptSentAt:string|null;
 receiptReview:string; receiptGuidance:string; cashbackCents:number|null; cashbackStatus:string;
 createdAt:string;
};
const statuses = ["ENTROU NO LINK","ESPERANDO NO CARRINHO","COMPROU"];
const checks = ["PENDENTE","APROVADO","REJEITADO"];
const cashbacks = ["PENDENTE","LIBERADO","PAGO"];
const currency=(n:number|null)=>n===null?"Não registrado":(n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export function IndicatedAccessAdmin() {
 const [clients,setClients]=useState<Indication[]>([]);
 const [query,setQuery]=useState("");const [status,setStatus]=useState("");const [access,setAccess]=useState("");
 const [editing,setEditing]=useState<string|null>(null);
 const [notice,setNotice]=useState("");const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [activation,setActivation]=useState<{id:string;url:string;expiresAt:string}|null>(null);
 function showActivation(id:string,path:string,expiresAt:string){
   if(location.protocol!=="https:" && location.hostname!=="localhost" && location.hostname!=="127.0.0.1") throw new Error("Abra o BKO pelo endereço HTTPS para gerar o link de ativação.");
   if(!path.startsWith("/ativar-cliente?token="))throw new Error("Link de ativação inválido.");
   setActivation({id,url:`${location.origin}${path}`,expiresAt});
 }
 async function copyActivation(){if(!activation)return;try{await navigator.clipboard.writeText(activation.url);setNotice("Link copiado. Envie somente ao cliente correspondente.");}catch{setNotice("Selecione e copie o link manualmente.");}}
 const load=useCallback(async()=>{
   setLoading(true);
   try{const params=new URLSearchParams({q:query,status,access});const r=await fetch(`/api/admin/indicated?${params}`,{cache:"no-store"});const b=await r.json();if(!r.ok)throw new Error(b.error);setClients(b.clients||[]);}
   catch(e){setNotice(e instanceof Error?e.message:"Erro ao carregar indicações.");}finally{setLoading(false);}
 },[query,status,access]);
 useEffect(()=>{void load()},[load]);
 async function create(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setNotice("");setActivation(null);
   const form=e.currentTarget;const data=Object.fromEntries(new FormData(form));
   try{const r=await fetch("/api/admin/indicated",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});const b=await r.json();if(!r.ok)throw new Error(b.error);if(b.activationPath)showActivation(b.id,b.activationPath,b.expiresAt);setNotice(b.activationPath?"Cliente cadastrado! Copie o link abaixo e envie ao cliente em canal privado.":b.error||"Acesso cadastrado; gere um link depois.");form.reset();await load();}
   catch(e){setNotice(e instanceof Error?e.message:"Erro ao cadastrar.");}finally{setBusy(false);}
 }
 async function patch(id:string,changes:Record<string,unknown>){setBusy(true);setNotice("");
   try{const r=await fetch("/api/admin/indicated",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,...changes})});const b=await r.json();if(!r.ok)throw new Error(b.error);setNotice("Indicação atualizada.");await load();}
   catch(e){setNotice(e instanceof Error?e.message:"Não foi possível atualizar.");}finally{setBusy(false);}
 }
 async function invite(id:string){setBusy(true);setNotice("");setActivation(null);try{const r=await fetch("/api/admin/indicated/invite",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id})});const b=await r.json();if(!r.ok)throw new Error(b.error);showActivation(id,b.activationPath,b.expiresAt);setNotice("Novo link gerado. O anterior foi invalidado. Envie somente ao cliente.");}catch(e){setNotice(e instanceof Error?e.message:"Não foi possível gerar o link.");}finally{setBusy(false);}}
 async function edit(e:FormEvent<HTMLFormElement>,id:string){e.preventDefault();const raw=Object.fromEntries(new FormData(e.currentTarget));const value=String(raw.cashbackReais||"").trim();const cents=value===""?null:Math.round(Number(value.replace(",","."))*100);if(cents!==null&&(!Number.isSafeInteger(cents)||cents<0)){setNotice("Valor de cashback inválido.");return;}
   const changes:Record<string,unknown>={name:raw.name,phone:raw.phone,channel:raw.channel,responsible:raw.responsible,status:raw.status,cashbackCents:cents,cashbackStatus:raw.cashbackStatus};
   // Review is optional. Do not re-review an existing receipt during ordinary edits.
   if(raw.reviewChoice && raw.reviewChoice!=="UNCHANGED"){changes.receiptReview=raw.reviewChoice;changes.receiptGuidance=raw.receiptGuidance;}
   await patch(id,changes);
 }
 return <section className="portal-card indicated-area">
   <div className="card-title"><h2>Acessos · Clientes indicados</h2><span>{loading?"Atualizando…":`${clients.length} indicações`}</span></div>
   <p className="portal-form-help">Acesso exclusivo de cliente indicado. Revendedores seguem apenas o fluxo de aprovação do Asaas via LP. Copie o link de ativação e envie em canal privado; não há e-mail automático nem senha provisória.</p>
   {notice?<div className="portal-notice" role="status">{notice}</div>:null}
   {activation?<div className="portal-notice" role="status">
      <strong>Link de ativação · uso único</strong><p>Validade: {new Date(activation.expiresAt).toLocaleString("pt-BR")}. Um novo link cancela o anterior. Não publique nem compartilhe com terceiros.</p>
      <input aria-label="Link de ativação para compartilhar" readOnly value={activation.url} onFocus={e=>e.currentTarget.select()} />
      <div className="indicated-actions"><button type="button" className="secondary-button compact" onClick={()=>void copyActivation()}>Copiar link</button><button type="button" className="secondary-button compact" onClick={()=>setActivation(null)}>Ocultar link</button></div>
   </div>:null}
   <form className="portal-form indicated-create" onSubmit={create}>
     <h3>Cadastrar indicação e criar acesso</h3>
     <label>Nome do indicado<input name="name" required maxLength={120}/></label>
     <label>E-mail do cliente<input name="email" type="email" required maxLength={254}/></label>
     <label>Telefone<input name="phone" type="tel" required placeholder="DDD + telefone"/></label>
     <label>Canal da venda<input name="channel" required maxLength={120} placeholder="Ex.: link, WhatsApp"/></label>
     <label>Responsável pela indicação<input name="responsible" required maxLength={120}/></label>
     <button disabled={busy} className="primary-button">Cadastrar e gerar link</button>
   </form>
   <div className="indicated-filters">
     <label>Buscar nome, telefone ou e-mail<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar cliente…"/></label>
     <label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
     <label>Acesso<select value={access} onChange={e=>setAccess(e.target.value)}><option value="">Todos</option><option value="active">Ativo</option><option value="inactive">Desativado</option></select></label>
     <button className="secondary-button compact" onClick={()=>void load()}>Atualizar</button>
   </div>
   <div className="indicated-list">{clients.map(c=><article className="indicated-record" key={c.id}>
     <div className="indicated-summary">
       <div><strong>{c.name}</strong><p>{c.email} · {c.phone}</p><small>{c.channel} · Responsável: {c.responsible}</small></div>
       <div><span className="status-pill">{c.status}</span><p>Acesso: {c.accessStatus!=="active"?"Desativado":c.activationStatus==="activated"?"Ativado":"Aguardando ativação"}</p><small>Comprovante: {c.receiptId?c.receiptReview:"Não enviado"}</small></div>
       <div className="indicated-actions"><button className="secondary-button compact" onClick={()=>setEditing(editing===c.id?null:c.id)}>{editing===c.id?"Fechar":"Editar / conferir"}</button><button className="secondary-button compact" disabled={busy||c.accessStatus!=="active"} onClick={()=>{if(c.activationStatus==="activated"&&!window.confirm("Esse cliente já tem senha. O novo link permitirá que ele defina outra senha e, quando usado, encerrará sessões anteriores. Gerar mesmo assim?"))return;void invite(c.id);}}>Gerar novo link</button><button className="secondary-button compact" disabled={busy} onClick={()=>{if(window.confirm(c.accessStatus==="active"?"Desativar acesso deste cliente?":"Reativar acesso deste cliente?"))void patch(c.id,{active:c.accessStatus!=="active"});}}>{c.accessStatus==="active"?"Desativar":"Reativar"}</button></div>
     </div>
     {editing===c.id?<form className="portal-form indicated-edit" key={`${c.id}-${c.status}-${c.receiptReview}-${c.cashbackStatus}`} onSubmit={e=>void edit(e,c.id)}>
       <label>Nome<input name="name" defaultValue={c.name} required/></label>
       <label>Telefone<input name="phone" defaultValue={c.phone} required/></label>
       <label>Canal da venda<input name="channel" defaultValue={c.channel} required/></label>
       <label>Responsável<input name="responsible" defaultValue={c.responsible} required/></label>
       <label>Status da indicação<select name="status" defaultValue={c.status}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
       <div className="indicated-proof"><strong>Comprovante</strong><p>{c.receiptSentAt?`Enviado em ${new Date(c.receiptSentAt).toLocaleString("pt-BR")}`:"Aguardando envio pelo cliente"}</p>{c.receiptId?<a href={`/api/indicated/receipt?id=${encodeURIComponent(c.id)}`} target="_blank" rel="noreferrer" className="secondary-button compact">Visualizar / baixar comprovante</a>:null}</div>
       {c.receiptId?<><label>Conferência<select name="reviewChoice" defaultValue="UNCHANGED"><option value="UNCHANGED">Manter {c.receiptReview}</option>{checks.map(s=><option key={s}>{s}</option>)}</select></label><label>Orientação se rejeitado<textarea name="receiptGuidance" defaultValue={c.receiptGuidance} maxLength={500} rows={3}/></label></>:null}
       <label>Cashback manual (R$; sem cálculo automático)<input name="cashbackReais" type="number" min="0" step="0.01" defaultValue={c.cashbackCents===null?"":(c.cashbackCents/100).toFixed(2)}/><small>Atual: {currency(c.cashbackCents)}</small></label>
       <label>Estado do cashback<select name="cashbackStatus" defaultValue={c.cashbackStatus}>{cashbacks.map(s=><option key={s}>{s}</option>)}</select></label>
       <button disabled={busy} className="primary-button">Salvar alterações e conferência</button>
       <small>“COMPROU” só é aceito após aprovação do comprovante pelo BKO. Nenhuma mudança automática acontece no envio.</small>
     </form>:null}
   </article>)}{!loading&&clients.length===0?<p>Nenhum cliente indicado encontrado.</p>:null}</div>
 </section>;
}
