import { safeHashEqual } from "@/lib/auth";
import { getOptionalEnv } from "@/lib/env";
import { updatePurchaseShipping } from "@/lib/shipping";
export async function POST(request:Request){
 const expected=getOptionalEnv("SHIPPING_WEBHOOK_TOKEN")||"";
 if(!expected||!safeHashEqual(expected,request.headers.get("x-shipping-token")||""))return Response.json({error:"Webhook não autorizado."},{status:401});
 try{
  const b=await request.json().catch(()=>null);
  const id=typeof b?.purchaseId==="string"?b.purchaseId:typeof b?.orderId==="string"?b.orderId:"";
  const mapped:Record<string,string>={processing:"separating",ready_to_ship:"separating",in_transit:"shipped",separating:"separating",shipped:"shipped",delivered:"delivered"};
  const status=typeof b?.status==="string" && Object.hasOwn(mapped,b.status)?mapped[b.status]:"";
  if(!id||!status)return Response.json({error:"Evento logístico inválido."},{status:400});
  const result=await updatePurchaseShipping(id,status,b.carrier,b.trackingCode);
  return Response.json({received:true,...result});
 }catch(error){
  const message=error instanceof Error?error.message:"";
  if(message==="PURCHASE_NOT_FOUND")return Response.json({error:"Compra não encontrada."},{status:404});
  if(message==="PAYMENT_REQUIRED")return Response.json({error:"Aguardando pagamento."},{status:409});
  console.error("shipping_webhook_failed",error);return Response.json({error:"Não foi possível atualizar a entrega."},{status:500});
 }
}
