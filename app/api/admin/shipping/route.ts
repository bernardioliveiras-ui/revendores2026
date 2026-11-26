import { requireAdmin } from "@/lib/auth";
import { updatePurchaseShipping } from "@/lib/shipping";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
import { suspendLegacyManualShipment, updateManualShipmentShipping } from "@/lib/manual-shipments";
export async function PATCH(request: Request){
  try {
    const actor=await requireAdmin(request);
    const origin=request.headers.get("origin"),host=request.headers.get("host")||new URL(request.url).host;
    if(!origin||new URL(origin).host!==host||!(new URL(origin).protocol==="https:"||new URL(origin).hostname==="localhost"))return Response.json({error:"Origem não autorizada."},{status:403});
    await ensureOperationalSchema();
    const body=await request.json().catch(()=>null);
    if(typeof body?.manualShipmentId==="string"&&body.manualShipmentId){
      if(body.action==="suspend_legacy"){
        if(!Number.isSafeInteger(body.expectedStock)||body.expectedStock<0)return Response.json({error:"Atualize a conferência do saldo."},{status:400});
        return Response.json(await suspendLegacyManualShipment(body.manualShipmentId,body.expectedStock,actor.id));
      }
      if(!["separating","shipped","delivered"].includes(body.status))return Response.json({error:"Etapa inválida."},{status:400});
      const result=await updateManualShipmentShipping(body.manualShipmentId,body.status,body.carrier,body.trackingCode);
      if(result.ignored)return Response.json({error:"Não é permitido retornar a uma etapa anterior."},{status:409});
      return Response.json(result);
    }
    if(typeof body?.purchaseId!=="string" || !body.purchaseId || !["separating","shipped","delivered"].includes(body.status)) return Response.json({error:"Atualização inválida."},{status:400});
    const result=await updatePurchaseShipping(body.purchaseId,body.status,body.carrier,body.trackingCode);
    if(result.ignored) return Response.json({error:"A expedição não pode voltar para uma etapa anterior."},{status:409});
    return Response.json(result);
  }catch(error){
    const message=error instanceof Error?error.message:"";
    if(message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});
    if(message==="FORBIDDEN")return Response.json({error:"Acesso restrito ao BKO."},{status:403});
    if(message==="PURCHASE_NOT_FOUND")return Response.json({error:"Compra não encontrada."},{status:404});
    if(message==="PAYMENT_REQUIRED")return Response.json({error:"A expedição só pode avançar após pagamento confirmado."},{status:409});
    if(message==="MANUAL_SHIPMENT_NOT_FOUND")return Response.json({error:"Remessa manual não encontrada."},{status:404});
    if(message==="TRACKING_REQUIRED")return Response.json({error:"Cadastre o código de rastreio antes de marcar como postada."},{status:400});
    if(message==="TRACKING_INVALID")return Response.json({error:"Rastreio dos Correios inválido. Confira duas letras, nove números e duas letras."},{status:400});
    if(message==="STALE_STOCK")return Response.json({error:"O saldo mudou. Atualize a lista de revendedores antes de suspender o estoque."},{status:409});
    if(/(?:saldo disponível insuficiente|remessa já|remessa entregue|confirme a postagem|já aguarda recebimento)/i.test(message))return Response.json({error:message},{status:409});
    console.error("shipping_update_failed",error);
    return Response.json({error:"Não foi possível atualizar a expedição."},{status:500});
  }
}
