"use client";
import { FormEvent, useEffect, useState } from "react";

type History={id:string;oldPriceCents:number;newPriceCents:number;reason:string;changedAt:string};
const money=(c:number)=>(c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function AdminResellerSalePrice({onPriceChange}:{onPriceChange?:(cents:number)=>void}){
  const [current,setCurrent]=useState(10990),[value,setValue]=useState("109,90"),[reason,setReason]=useState(""),[history,setHistory]=useState<History[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function load(){const r=await fetch("/api/admin/reseller-sale-price",{cache:"no-store"});const b=await r.json();if(!r.ok)throw Error(b.error||"Preço indisponível.");setCurrent(b.priceCents);setValue((b.priceCents/100).toFixed(2).replace(".",","));setHistory(b.history||[]);onPriceChange?.(b.priceCents);}
  useEffect(()=>{
    let active=true;
    void fetch("/api/admin/reseller-sale-price",{cache:"no-store"}).then(async r=>{const b=await r.json();if(!r.ok)throw Error(b.error||"Preço indisponível.");return b;})
      .then(b=>{if(!active)return;setCurrent(b.priceCents);setValue((b.priceCents/100).toFixed(2).replace(".",","));setHistory(b.history||[]);onPriceChange?.(b.priceCents);})
      .catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;};
  },[onPriceChange]);
  async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;setBusy(true);setError("");try{
    const raw=value.trim().replace(/\s/g,"");const normalized=raw.includes(",")?raw.replace(/\./g,"").replace(",","."):raw;const parsed=Number(normalized);const cents=Math.round(parsed*100);
    if(!Number.isFinite(parsed)||!Number.isSafeInteger(cents)||Math.abs(cents/100-parsed)>0.0001)throw Error("Informe um valor válido com até duas casas decimais.");
    if(!window.confirm(`Alterar preço de venda dos revendedores de ${money(current)} para ${money(cents)}? A mudança valerá para novas vendas.`))return;
    const r=await fetch("/api/admin/reseller-sale-price",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({priceCents:cents,reason})});const b=await r.json();if(!r.ok)throw Error(b.error||"Alteração não concluída.");await load();setReason("");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar.");}finally{setBusy(false);}}
  return <section className="portal-card bko-sale-price"><div className="card-title"><div><span className="section-kicker">CONTROLE DE PREÇO</span><h2>Preço da venda pelo revendedor</h2><p>O revendedor vê o valor abaixo, mas não pode editá-lo. O ajuste vale apenas para vendas futuras; o histórico permanece intacto.</p></div><strong className="bko-price-current">{money(current)}</strong></div>
    <form className="bko-sale-price-form" onSubmit={save}><label>Novo preço por caixa (R$)<input inputMode="decimal" value={value} onChange={e=>setValue(e.target.value)} required/></label><label>Motivo da alteração<input maxLength={240} minLength={3} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ex.: atualização de tabela comercial" required/></label><button className="primary-button" disabled={busy}>{busy?"Salvando…":"Atualizar preço no BKO"}</button></form>
    {error?<p className="portal-notice" role="alert">{error}</p>:null}
    {history.length>0?<details className="bko-sale-price-audit"><summary>Histórico de alterações de preço ({history.length})</summary><div className="simple-table">{history.map(h=><div key={h.id}><span>{new Date(h.changedAt).toLocaleString("pt-BR")}</span><strong>{money(h.oldPriceCents)} → {money(h.newPriceCents)}</strong><span>{h.reason}</span></div>)}</div></details>:null}
  </section>;
}
