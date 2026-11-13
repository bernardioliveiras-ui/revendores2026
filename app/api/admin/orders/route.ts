import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { operationalPurchaseFields } from "@/lib/purchase-fields";
import { requireAdmin } from "@/lib/auth";
import { provisionPaidPurchase } from "@/lib/access-provisioning";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    await ensureOperationalSchema();
    const b = await request.json();
    const id = typeof b.purchaseId === "string" ? b.purchaseId : typeof b.orderId === "string" ? b.orderId : "";
    if (!id || b.status !== "paid") return Response.json({error:"Informe um pedido e o status paid para confirmar manualmente."},{status:400});
    const db=getDb();const [p]=await db.select(operationalPurchaseFields).from(purchases).where(eq(purchases.id,id)).limit(1);
    if(!p)return Response.json({error:"Compra não encontrada."},{status:404});
    if(p.paymentStatus==="cancelled")return Response.json({error:"Compra cancelada não pode ser aprovada."},{status:409});
    await db.update(purchases).set({paymentStatus:"paid",shippingStatus:p.shippingStatus==="awaiting_payment"?"separating":p.shippingStatus,updatedAt:new Date().toISOString()}).where(and(eq(purchases.id,id),eq(purchases.paymentStatus,p.paymentStatus)));
    const access=await provisionPaidPurchase(id);
    // Even a manual payment confirmation must not dispatch messages.
    // The separate authenticated /api/admin/welcome action is the only welcome trigger.
    return Response.json({updated:true,welcomePending:p.kit !== "mix10-unit",...access});
  } catch(error) {
    if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});
    if(error instanceof Error&&error.message==="FORBIDDEN")return Response.json({error:"Acesso restrito ao BKO."},{status:403});
    console.error("manual_payment_failed",error);
    return Response.json({error:"Não foi possível concluir a aprovação. Verifique Acessos no BKO."},{status:500});
  }
}
