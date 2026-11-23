"use client";
import {useState} from "react";

type OrderInfo = {id:string;orderNumber:string;name:string;paymentStatus:string};

/** Operação explícita do administrador; nunca cancela a cobrança no Asaas. */
export function BkoOrderDeleteButton({purchase,onDeleted}:{purchase:OrderInfo;onDeleted:()=>void|Promise<void>}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function remove() {
    if(busy)return;
    setError("");
    const isPaid=purchase.paymentStatus==="paid";
    const confirmation=window.prompt(
      `EXCLUSÃO DEFINITIVA DE PEDIDO\n\n${purchase.name} · ${purchase.orderNumber}\n`+
      `Os registros locais serão apagados sem possibilidade de desfazer. `+
      `O Asaas NÃO será cancelado nem reembolsado. `+
      `${isPaid?"ATENÇÃO: este pedido está marcado como pago.\n":""}\n`+
      `Digite o número completo do pedido para confirmar:`,
      "",
    );
    if(confirmation===null)return;
    if(confirmation!==purchase.orderNumber){setError("Número diferente. Nada foi excluído.");return;}
    if(isPaid&&!window.confirm("Última confirmação: excluir este pedido PAGO do banco local sem cancelar a cobrança no Asaas?"))return;
    setBusy(true);
    try {
      const response=await fetch("/api/admin/orders/delete",{
        method:"DELETE",headers:{"content-type":"application/json"},
        body:JSON.stringify({purchaseId:purchase.id,orderNumber:purchase.orderNumber,confirm:confirmation}),
      });
      const result=await response.json().catch(()=>({error:"Servidor sem resposta válida."}));
      if(!response.ok)throw new Error(result.error||"Não foi possível excluir este pedido.");
      await onDeleted();
    } catch(reason) {setError(reason instanceof Error?reason.message:"Não foi possível excluir este pedido.");}
    finally {setBusy(false);}
  }

  return <div className="bko-order-delete-control">
    <button type="button" className="bko-delete-order-button compact" onClick={()=>void remove()} disabled={busy} aria-label={`Excluir definitivamente o pedido ${purchase.orderNumber}`}>{busy?"Excluindo…":"Excluir definitivamente"}</button>
    {error?<small role="alert" className="bko-delete-order-error">{error}</small>:null}
  </div>;
}
