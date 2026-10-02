import { requireAdmin } from "@/lib/auth";
import { updatePurchaseShipping } from "@/lib/shipping";
export async function PATCH(request: Request){
  try {
    await requireAdmin(request);
    const body=await request.json().catch(()=>null);
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
    console.error("shipping_update_failed",error);
    return Response.json({error:"Não foi possível atualizar a expedição."},{status:500});
  }
}
