import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { safeHashEqual } from "@/lib/auth";
import { getOptionalEnv } from "@/lib/env";
import { canAdvanceShipping } from "@/lib/delivery-progress";
export async function POST(request:Request){
 const expected=getOptionalEnv("SHIPPING_WEBHOOK_TOKEN")||"";
 if(!expected||!safeHashEqual(expected,request.headers.get("x-shipping-token")||""))return Response.json({error:"Webhook não autorizado."},{status:401});
 try{
  const b=await request.json();const id=typeof b.purchaseId==="string"?b.purchaseId:typeof b.orderId==="string"?b.orderId:"";
  const mapped:Record<string,string>={processing:"separating",ready_to_ship:"separating",in_transit:"shipped",separating:"separating",shipped:"shipped",delivered:"delivered"};const status=mapped[b.status];
  if(!id||!status)return Response.json({error:"Evento logístico inválido."},{status:400});
  const db=getDb();const [p]=await db.select().from(purchases).where(eq(purchases.id,id)).limit(1);
  if(!p)return Response.json({error:"Compra não encontrada."},{status:404});
  if(p.paymentStatus!=="paid")return Response.json({error:"Aguardando pagamento."},{status:409});
  if(!canAdvanceShipping(p.shippingStatus,status))return Response.json({received:true,ignored:true});
  const now=new Date().toISOString();
  await db.update(purchases).set({shippingStatus:status,carrier:typeof b.carrier==="string"?b.carrier.trim().slice(0,120)||p.carrier:p.carrier,trackingCode:typeof b.trackingCode==="string"?b.trackingCode.trim().slice(0,120)||p.trackingCode:p.trackingCode,shippedAt:status==="shipped"?p.shippedAt||now:p.shippedAt,deliveredAt:status==="delivered"?p.deliveredAt||now:p.deliveredAt,updatedAt:now}).where(and(eq(purchases.id,id),eq(purchases.paymentStatus,"paid"),eq(purchases.shippingStatus,p.shippingStatus)));
  return Response.json({received:true});
 }catch(error){console.error("shipping_webhook_failed",error);return Response.json({error:"Não foi possível atualizar a entrega."},{status:500});}
}
