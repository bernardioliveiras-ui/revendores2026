"use client";
import { ChangeEvent, FormEvent, useState } from "react";
import { applyPostalAddress } from "@/lib/reseller-form-draft.mjs";

type Fields = {name:string;email:string;phone:string;cpfCnpj:string;postalCode:string;street:string;number:string;complement:string;district:string;city:string;state:string};
const blank:Fields = {name:"",email:"",phone:"",cpfCnpj:"",postalCode:"",street:"",number:"",complement:"",district:"",city:"",state:""};
type Invitation = {url:string;expiresAt:string|null};

export function ManualResellerRegistration({onCreated}:{onCreated:()=>Promise<void>}) {
 const [draft,setDraft]=useState<Fields>(blank),[busy,setBusy]=useState(false),[postalBusy,setPostalBusy]=useState(false);
 const [message,setMessage]=useState(""),[invitation,setInvitation]=useState<Invitation|null>(null);
 const set=(key:keyof Fields)=>(event:ChangeEvent<HTMLInputElement>)=>setDraft(v=>({...v,[key]:event.target.value}));
 async function lookup() {
  const cep=draft.postalCode.replace(/\D/g,"");
  if(cep.length!==8){setMessage("Digite um CEP válido com oito dígitos.");return}
  setPostalBusy(true);setMessage("");
  try {
   const response=await fetch(`/api/admin/resellers/postal-code?cep=${encodeURIComponent(cep)}`,{cache:"no-store"});
   const data=await response.json();if(!response.ok)throw Error(data.error||"CEP indisponível.");
   setDraft(v=>applyPostalAddress(v,data));setMessage("Endereço localizado. Confira número e complemento.");
  }catch(error){setMessage(error instanceof Error?error.message:"Preencha o endereço manualmente.")}
  finally{setPostalBusy(false)}
 }
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();if(busy)return;setBusy(true);setMessage("");setInvitation(null);
  try {
   const response=await fetch("/api/admin/resellers",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(draft)});
   const data=await response.json();if(!response.ok)throw Error(data.error||"Não foi possível cadastrar.");
   setDraft(blank);await onCreated();
   if(data.activationPath)setInvitation({url:location.origin+data.activationPath,expiresAt:data.expiresAt||null});
   setMessage(data.activationPath?"Revendedor cadastrado com estoque zero. Envie o convite de ativação em privado.":data.notice||"Cadastro criado. Gere um convite na lista.");
  }catch(error){setMessage(error instanceof Error?error.message:"Erro no cadastro.")}
  finally{setBusy(false)}
 }
 async function copy() {
  if(!invitation)return;
  try{await navigator.clipboard.writeText(invitation.url);setMessage("Convite copiado. Envie somente ao titular.")}
  catch{setMessage("Não foi possível copiar. Selecione e copie o link.")}
 }
 return <section className="portal-card"><div className="card-title"><div><span className="section-kicker">NOVO REVENDEDOR</span><h2>Cadastro manual, sem compra de kit</h2><p className="portal-form-help">Este cadastro não gera cobrança, estoque ou pedido Asaas. O frete será calculado na futura reposição.</p></div></div>
  <form className="portal-form" onSubmit={submit}>
   <label>Nome completo<input required minLength={2} maxLength={120} value={draft.name} onChange={set("name")} autoComplete="name"/></label>
   <label>E-mail<input required type="email" maxLength={254} value={draft.email} onChange={set("email")} autoComplete="email"/></label>
   <label>WhatsApp com DDD<input required type="tel" maxLength={24} value={draft.phone} onChange={set("phone")} autoComplete="tel" placeholder="(11) 99999-9999"/></label>
   <label>CPF ou CNPJ<input required maxLength={20} value={draft.cpfCnpj} onChange={set("cpfCnpj")} inputMode="numeric" placeholder="CPF ou CNPJ"/></label>
   <label>CEP<div className="purchase-postal"><input required value={draft.postalCode} onChange={set("postalCode")} maxLength={9} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"/>
    <button type="button" className="secondary-button compact" disabled={postalBusy} onClick={()=>void lookup()}>{postalBusy?"Consultando…":"Consultar CEP"}</button></div></label>
   <label>Rua / Avenida<input required maxLength={220} value={draft.street} onChange={set("street")} autoComplete="address-line1"/></label>
   <label>Número<input required maxLength={32} value={draft.number} onChange={set("number")} inputMode="numeric"/></label>
   <label>Complemento (opcional)<input maxLength={160} value={draft.complement} onChange={set("complement")} autoComplete="address-line2"/></label>
   <label>Bairro<input required maxLength={120} value={draft.district} onChange={set("district")}/></label>
   <label>Cidade<input required maxLength={120} value={draft.city} onChange={set("city")} autoComplete="address-level2"/></label>
   <label>UF<input required maxLength={2} value={draft.state} onChange={set("state")} autoComplete="address-level1" placeholder="SP"/></label>
   <button className="primary-button compact" disabled={busy}>{busy?"Cadastrando…":"Cadastrar revendedor"}</button>
  </form>
  {message?<p role="status" className="portal-form-help">{message}</p>:null}
  {invitation?<div className="crm-campaign-link"><strong>Convite privado para definir senha (24 horas)</strong><input readOnly value={invitation.url} onFocus={event=>event.currentTarget.select()}/><button className="secondary-button compact" onClick={()=>void copy()}>Copiar convite</button><p className="crm-quiet">Este link não é uma cobrança e não deve ser publicado. O revendedor criará a própria senha.</p></div>:null}
 </section>;
}
