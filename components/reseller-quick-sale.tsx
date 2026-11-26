"use client";
import { FormEvent, useRef, useState } from "react";
import { salePreview } from "@/lib/reseller-sale-calculation.mjs";

type RecentSale={id:string;boxes:number;totalValueCents:number;customerName:string;channel:string;soldAt:string};
type Props={stock:number;unitPriceCents:number;sales:RecentSale[];onSaved:()=>Promise<void>;onNotice:(value:string)=>void;onRestock:()=>void};
const money=(c:number)=>(c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const shortDate=(value:string)=>new Date(value).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});

export function ResellerQuickSale({stock,unitPriceCents,sales,onSaved,onNotice,onRestock}:Props){
  const [boxesInput,setBoxesInput]=useState("1");
  const [detailsOpen,setDetailsOpen]=useState(false);
  const [channel,setChannel]=useState("whatsapp");
  const [customerName,setCustomerName]=useState("");
  const [notes,setNotes]=useState("");
  const [busy,setBusy]=useState(false);
  const inFlight=useRef(false);
  const requestId=useRef<string|null>(null);
  const quantity=Number(boxesInput);
  const preview=salePreview({available:stock,boxes:quantity,unitPriceCents});
  const updateQuantity=(value:string)=>{setBoxesInput(value);requestId.current=null;};

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(inFlight.current||!preview.valid)return;
    inFlight.current=true;setBusy(true);onNotice("");
    if(!requestId.current)requestId.current=crypto.randomUUID();
    try{
      const response=await fetch("/api/sales",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({boxes:quantity,channel,customerName,notes,requestId:requestId.current})});
      const result=await response.json().catch(()=>({error:"Não foi possível confirmar a venda."}));
      if(!response.ok){onNotice(result.error||"Não foi possível registrar a venda.");if(response.status===409)requestId.current=null;return;}
      requestId.current=null;setBoxesInput("1");setCustomerName("");setNotes("");
      onNotice(result.created===false?"Essa venda já estava registrada. O estoque não foi baixado novamente.":"Venda registrada! Estoque atualizado automaticamente.");
      try { await onSaved(); } catch { onNotice("Venda salva. O painel não conseguiu atualizar o saldo agora; toque em Estoque para consultar novamente."); }
    }catch{onNotice("Sem conexão para confirmar. Tente novamente: a mesma venda não será duplicada.");}
    finally{inFlight.current=false;setBusy(false);}
  }

  return <section className="quick-sale-layout" aria-label="Venda rápida e últimas vendas">
    <form className="portal-card quick-sale-card" onSubmit={submit}>
      <span className="section-kicker">VENDA RÁPIDA</span><h2>Quantas caixas você vendeu?</h2><p className="quick-sale-hint">Registre em segundos. O sistema reduz o estoque e guarda a venda no histórico.</p>
      <div className="quick-sale-stock"><span>Seu estoque disponível</span><strong>{stock} <small>caixa{stock===1?"":"s"}</small></strong></div>
      {stock>0?<>
        <label htmlFor="quick-sale-boxes">Quantidade vendida</label>
        <div className="quick-sale-counter">
          <button type="button" aria-label="Diminuir quantidade" disabled={busy||quantity<=1} onClick={()=>updateQuantity(String(Math.max(1,(Number.isSafeInteger(quantity)?quantity:1)-1)))}>−</button>
          <input id="quick-sale-boxes" type="number" inputMode="numeric" min="1" max={stock} step="1" value={boxesInput} onChange={e=>updateQuantity(e.target.value)} aria-describedby="quick-sale-stock-left" required/>
          <button type="button" aria-label="Aumentar quantidade" disabled={busy||quantity>=stock} onClick={()=>updateQuantity(String(Math.min(stock,(Number.isSafeInteger(quantity)?quantity:0)+1)))}>+</button>
        </div>
        <div className="quick-sale-preview">
          <div><span>Preço por caixa <small>definido pelo BKO</small></span><strong>{money(unitPriceCents)}</strong></div>
          <div id="quick-sale-stock-left"><span>Saldo após a venda</span><strong>{preview.valid?preview.remaining:"—"} caixas</strong></div>
          <div className="quick-sale-total"><span>Valor total</span><strong>{preview.valid?money(preview.totalCents):"—"}</strong></div>
        </div>
        <button className="quick-sale-options-toggle" type="button" aria-expanded={detailsOpen} onClick={()=>setDetailsOpen(open=>!open)}>{detailsOpen?"− Ocultar detalhes":"＋ Adicionar detalhes (opcional)"}</button>
        {detailsOpen?<div className="quick-sale-details"><label>Canal da venda<select value={channel} onChange={e=>{setChannel(e.target.value);requestId.current=null;}}><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="presencial">Presencial</option><option value="marketplace">Marketplace</option><option value="other">Outro</option></select></label><label>Cliente (opcional)<input value={customerName} maxLength={120} placeholder="Nome do cliente" onChange={e=>{setCustomerName(e.target.value);requestId.current=null;}}/></label><label>Observações (opcional)<textarea value={notes} maxLength={1000} rows={2} onChange={e=>{setNotes(e.target.value);requestId.current=null;}}/></label></div>:null}
        <button className="primary-button quick-sale-submit" type="submit" disabled={busy||!preview.valid}>{busy?"Registrando venda…":`Confirmar venda de ${preview.valid?quantity:0} caixa${quantity===1?"":"s"}`}</button>
        <p className="quick-sale-footnote">Ao confirmar, {preview.valid?quantity:0} caixa{quantity===1?" será descontada":"s serão descontadas"} automaticamente do seu estoque.</p>
      </>:<div className="empty-stock"><strong>Seu estoque está zerado.</strong><p>Faça uma reposição para voltar a vender. O pedido é integrado ao Asaas e entra no estoque após o pagamento ser confirmado.</p><button className="primary-button" type="button" onClick={onRestock}>Repor estoque</button></div>}
    </form>
    <section className="portal-card quick-sale-history"><div className="card-title"><div><span className="section-kicker">REGISTROS</span><h2>Últimas vendas</h2></div><span>{sales.length} registro{sales.length===1?"":"s"}</span></div>
      {sales.length?<div className="sale-list">{sales.slice(0,20).map(s=><article key={s.id}><div><strong>{s.boxes} caixa{s.boxes===1?"":"s"}</strong><span>{s.customerName||s.channel}</span></div><div><strong>{money(s.totalValueCents)}</strong><span>{shortDate(s.soldAt)}</span></div></article>)}</div>:<div className="quick-sale-empty">Sua primeira venda aparecerá aqui, com data e valor.</div>}
    </section>
  </section>;
}
