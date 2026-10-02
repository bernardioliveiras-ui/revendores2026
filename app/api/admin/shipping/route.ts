import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

import { canAdvanceShipping } from "@/lib/delivery-progress";

const allowed = new Set(["separating","shipped","delivered"]);
function clean(v:unknown,max=120){return typeof v==="string"?v.trim().slice(0,max):""}
export async function PATCH(request: Request){
  try{
    await requireAdmin(request);
    const body=await request.json() as {purchaseId?:unknown;status?:unknown;carrier?:unknown;trackingCode?:unknown};
    const purchaseId=clean(body.purchaseId,80);const status=clean(body.status,30);
    if(!purchaseId||!allowed.has(status))return Response.json({error:"Atualização inválida."},{status:400});
    const db=getDb();const [purchase]=await db.select().from(purchases).where(eq(purchases.id,purchaseId)).limit(1);
    if(!purchase)return Response.json({error:"Compra não encontrada."},{status:404});
    if(purchase.paymentStatus!=="paid")return Response.json({error:"A expedição só pode avançar após pagamento confirmado."},{status:409});
    if(!canAdvanceShipping(purchase.shippingStatus,status))return Response.json({error:"A expedição não pode voltar para uma etapa anterior."},{status:409});
    const now=new Date().toISOString();
    await db.update(purchases).set({shippingStatus:status,carrier:clean(body.carrier)||purchase.carrier||null,trackingCode:clean(body.trackingCode)||purchase.trackingCode||null,shippedAt:status==="shipped"?(purchase.shippedAt||now):purchase.shippedAt,deliveredAt:status==="delivered"?(purchase.deliveredAt||now):purchase.deliveredAt,updatedAt:now}).where(and(eq(purchases.id,purchaseId),eq(purchases.paymentStatus,"paid"),eq(purchases.shippingStatus,purchase.shippingStatus)));
    return Response.json({updated:true});
  }catch(error){if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});if(error instanceof Error&&error.message==="FORBIDDEN")return Response.json({error:"Acesso restrito ao BKO."},{status:403});console.error("shipping_update_failed",error);return Response.json({error:"Não foi possível atualizar a expedição."},{status:500});}
}
