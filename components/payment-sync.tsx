"use client";
import { useState } from "react";
export function PaymentSync({purchaseId,onUpdated}:{purchaseId?:string;onUpdated?:()=>Promise<void>}) {
 const [number,setNumber]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function sync(){
  if(busy)return;setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/orders/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(purchaseId?{purchaseId}:{orderNumber:number.trim()}),signal:AbortSignal.timeout(60000)});
   const body=await response.json();if(!response.ok)throw Error(body.error||"Não foi possível consultar o pagamento.");
   setMessage(body.message);if(body.updated)await onUpdated?.();
  }catch(e){setMessage(e instanceof Error?e.message:"Falha ao consultar.")}finally{setBusy(false)}
 }
 return <div className="payment-sync" style={{margin:"12px 0"}}>
 {!purchaseId?<label style={{display:"block",marginBottom:8}}>Consultar pagamento de revendedor ou influenciador<input value={number} onChange={e=>setNumber(e.target.value)} placeholder="Número do pedido · MIX…" maxLength={80} style={{display:"block",maxWidth:"100%",padding:10}}/></label>:null}
 <button type="button" className="secondary-button compact" disabled={busy||(!purchaseId&&!number.trim())} onClick={()=>void sync()}>{busy?"Consultando Asaas…":"Sincronizar com Asaas"}</button>
 {message?<p role="status" style={{fontSize:13,overflowWrap:"anywhere"}}>{message}</p>:null}
 </div>;
}
