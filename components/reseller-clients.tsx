"use client";
import { useMemo, useState } from "react";
import { MessageCircle, Search, Users } from "lucide-react";

export type ResellerClient = { name:string;phone:string;salesCount:number;totalBoxes:number;lastSoldAt:string;whatsappUrl:string };
type Props={clients:ResellerClient[];loading:boolean;error:string;onRefresh:()=>void;onSell:()=>void};

function displayPhone(phone:string){
  if(phone.length===11)return `(${phone.slice(0,2)}) ${phone.slice(2,7)}-${phone.slice(7)}`;
  return `(${phone.slice(0,2)}) ${phone.slice(2,6)}-${phone.slice(6)}`;
}
const searchable=(text:string)=>text.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
export function ResellerClients({clients,loading,error,onRefresh,onSell}:Props){
  const [query,setQuery]=useState("");
  const visible=useMemo(()=>{
    const term=searchable(query.trim());const digits=query.replace(/\D/g,"");
    return clients.filter(c=>!term||searchable(c.name).includes(term)||(digits.length>0&&c.phone.includes(digits)));
  },[clients,query]);
  return <section className="reseller-clients-area">
    <div className="clients-toolbar"><div><span className="section-kicker">SUA CARTEIRA</span><h2>{clients.length} cliente{clients.length===1?"":"s"}</h2><p>Contatos organizados automaticamente a partir das vendas registradas.</p></div><button className="secondary-button compact" type="button" disabled={loading} onClick={onRefresh}>{loading?"Atualizando…":"Atualizar"}</button></div>
    <label className="clients-search" htmlFor="clients-search-input"><Search size={20}/><input id="clients-search-input" type="search" placeholder="Buscar nome ou telefone" autoComplete="off" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    {error?<p className="portal-notice" role="alert">{error} <button type="button" onClick={onRefresh}>Tentar novamente</button></p>:null}
    {loading&&clients.length===0?<div className="clients-empty">Carregando seus clientes…</div>:visible.length?<div className="clients-grid">{visible.map(client=><article className="client-card" key={client.phone}>
      <div className="client-avatar" aria-hidden="true">{client.name.charAt(0).toLocaleUpperCase("pt-BR")}</div>
      <div className="client-card-content"><h3>{client.name}</h3><a className="client-phone" href={`tel:+55${client.phone}`}>{displayPhone(client.phone)}</a><p>{client.salesCount} venda{client.salesCount===1?"":"s"} · {client.totalBoxes} caixa{client.totalBoxes===1?"":"s"}</p><small>Última compra: {new Date(client.lastSoldAt).toLocaleDateString("pt-BR")}</small></div>
      <a className="client-whatsapp" href={client.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={`Chamar ${client.name} no WhatsApp`}><MessageCircle size={19}/> Conversar no WhatsApp</a>
    </article>)}</div>:error?<div className="clients-empty"><strong>Não foi possível consultar seus clientes agora.</strong><p>Tente atualizar a lista quando sua conexão estiver disponível.</p></div>:<div className="clients-empty"><Users size={31}/><strong>{clients.length?"Nenhum cliente encontrado":"Sua carteira começa com a primeira venda"}</strong><p>{clients.length?"Tente outro nome ou telefone.":"Registre o nome e o telefone na tela Vendas. O contato aparecerá aqui automaticamente."}</p>{clients.length===0?<button type="button" className="primary-button" onClick={onSell}>Registrar primeira venda</button>:null}</div>}
  </section>;
}
