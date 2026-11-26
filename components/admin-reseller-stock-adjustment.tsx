"use client";

import { FormEvent, useState } from "react";

type StockAdjustment = {id:string;type:string;boxes:number;notes:string;occurredAt:string};
type StockReseller = {id:string;name:string;stock:number;stockAdjustments:StockAdjustment[]};

/** Mantém o saldo conferido congelado enquanto o BKO digita para impedir sobrescritas. */
export function AdminResellerStockAdjustment({reseller,onUpdated}:{reseller:StockReseller;onUpdated:()=>Promise<void>}){
  const [open,setOpen]=useState(false);
  const [desired,setDesired]=useState(String(reseller.stock));
  const [expected,setExpected]=useState(reseller.stock);
  const [reason,setReason]=useState("");
  const [shipmentBoxes,setShipmentBoxes]=useState("0");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  function toggle(){
    if(!open){setDesired(String(reseller.stock));setExpected(reseller.stock);setReason("");setMessage("");}
    setOpen(value=>!value);
  }

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;
    const desiredStock=Number(desired);
    if(!/^(0|[1-9]\d*)$/.test(desired)||!Number.isSafeInteger(desiredStock)||desiredStock>2147483647){setMessage("Informe uma quantidade inteira de caixas, sem valores negativos.");return;}
    if(reason.trim().length<3){setMessage("Descreva o motivo da conferência.");return;}
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/admin/resellers/stock",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify({userId:reseller.id,expectedStock:expected,desiredStock,reason})});
      const result=await response.json();
      if(response.status===409&&result.code==="STALE_STOCK"){
        setExpected(result.stock);setDesired(String(result.stock));
        await onUpdated();setMessage("O saldo mudou desde a abertura. Confira o novo estoque e informe novamente o total desejado.");return;
      }
      if(!response.ok)throw Error(result.error||"Não foi possível atualizar o estoque.");
      setExpected(result.stock);setDesired(String(result.stock));setReason("");
      await onUpdated();setMessage(result.changed?`Estoque atualizado para ${result.stock} caixas. Ajuste registrado no histórico.`:`Saldo conferido: ${result.stock} caixas. Nenhum ajuste necessário.`);
    }catch(error){setMessage(error instanceof Error?error.message:"Não foi possível atualizar o estoque.");}
    finally{setBusy(false)}
  }

  async function createShipment(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;
    const boxes=Number(shipmentBoxes);
    if(!/^[1-9]\d*$/.test(shipmentBoxes)||!Number.isSafeInteger(boxes)||boxes>2147483647){setMessage("Informe uma quantidade positiva de caixas a enviar.");return;}
    setBusy(true);setMessage("");
    try{
      const r=await fetch("/api/admin/manual-shipments",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify({userId:reseller.id,boxes})});
      const b=await r.json();if(!r.ok)throw Error(b.error||"Não foi possível criar a remessa.");
      setShipmentBoxes("0");await onUpdated();setMessage(`Remessa de ${boxes} caixa(s) criada na Expedição. O estoque disponível será creditado após a entrega.`);
    }catch(error){setMessage(error instanceof Error?error.message:"Não foi possível criar a remessa.");}
    finally{setBusy(false)}
  }

  return <>
    <button type="button" className="secondary-button compact" disabled={busy} onClick={toggle}>{open?"Fechar estoque":"Atualizar estoque"}</button>
    {open?<div className="bko-stock-correction" style={{flexBasis:"100%",minWidth:0,width:"100%",borderTop:"1px solid #dce2ea",paddingTop:12}}>
      <form onSubmit={submit} className="portal-form">
        <strong>Conferir estoque · {reseller.name}</strong>
        <p className="portal-form-help">Saldo mostrado pelo BKO: {reseller.stock} caixas. Informe o <b>total físico disponível</b>, não apenas as caixas a adicionar. Vendas e reposições são preservadas.</p>
        <label>Novo estoque total (caixas)<input required type="number" min="0" max="2147483647" step="1" value={desired} onChange={event=>setDesired(event.target.value)}/></label>
        <label>Motivo do ajuste<input required minLength={3} maxLength={500} value={reason} onChange={event=>setReason(event.target.value)} placeholder="Ex.: Conferência física de 25/11"/></label>
        <button className="primary-button compact" disabled={busy}>{busy?"Salvando…":"Salvar saldo conferido"}</button>
      </form>
      <form onSubmit={createShipment} className="portal-form" style={{borderTop:"1px solid #dce2ea",marginTop:16,paddingTop:16}}>
        <strong>Programar novo envio pelos Correios</strong>
        <p className="portal-form-help">Cria uma remessa automaticamente na aba Expedição, onde você cadastrará o rastreio. Não soma ao estoque disponível antes da entrega e não cria cobrança Asaas.</p>
        <label>Caixas a enviar<input required type="number" min="1" max="2147483647" step="1" value={shipmentBoxes} onChange={event=>setShipmentBoxes(event.target.value)}/></label>
        <button type="submit" className="primary-button compact" disabled={busy}>{busy?"Salvando…":"Criar remessa na Expedição"}</button>
      </form>
      {message?<p role="status" className="portal-form-help">{message}</p>:null}
      <div className="portal-form-help" style={{marginTop:12}}><strong>Últimas movimentações manuais</strong>
        {reseller.stockAdjustments?.length?<ul>{reseller.stockAdjustments.map(item=><li key={item.id}><strong>{item.type==="adjustment_out"?"−": "+"}{item.boxes} caixas</strong> · {item.type==="entry"?"Estoque inicial":"Ajuste"} · {new Date(item.occurredAt).toLocaleString("pt-BR")} · {item.notes}</li>)}</ul>:<p>Nenhuma entrada ou ajuste manual registrado.</p>}
      </div>
    </div>:null}
  </>;
}
