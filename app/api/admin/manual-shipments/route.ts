import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/db";
import { manualShipments, users } from "@/db/schema";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
import { planManualShipment } from "@/lib/manual-shipment-policy.mjs";
import { privateResponseHeaders } from "@/lib/indicator-security";

export const runtime="nodejs";
export async function POST(request:Request){
  try{
    await requireAdmin(request);
    const origin=request.headers.get("origin");
    const host=request.headers.get("host")||new URL(request.url).host;
    if(!origin||new URL(origin).host!==host||!(new URL(origin).protocol==="https:"||new URL(origin).hostname==="localhost"))return Response.json({error:"Origem não autorizada."},{status:403,headers:privateResponseHeaders});
    const body=await request.json().catch(()=>null);
    if(typeof body?.userId!=="string"||!body.userId||body.userId.length>80)return Response.json({error:"Selecione um revendedor."},{status:400,headers:privateResponseHeaders});
    let plan;
    try{plan=planManualShipment(body.boxes)}catch(error){return Response.json({error:error instanceof Error?error.message:"Quantidade inválida."},{status:400,headers:privateResponseHeaders})}
    await ensureOperationalSchema();
    const [seller]=await getDb().select({id:users.id,role:users.role}).from(users).where(eq(users.id,body.userId)).limit(1);
    if(!seller||seller.role!=="reseller")return Response.json({error:"Revendedor não encontrado."},{status:404,headers:privateResponseHeaders});
    const now=new Date().toISOString(),id=crypto.randomUUID();
    await getDb().insert(manualShipments).values({id,userId:seller.id,orderNumber:`MAN-${crypto.randomUUID().replace(/-/g,"").slice(0,24)}`,boxes:plan.boxes,stockCreditMode:plan.stockCreditMode,shippingStatus:plan.shippingStatus,createdAt:now,updatedAt:now});
    return Response.json({created:true,id,stockCredited:false},{status:201,headers:privateResponseHeaders});
  }catch(error){const message=error instanceof Error?error.message:"";if(message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});if(message==="FORBIDDEN")return Response.json({error:"Acesso restrito ao BKO."},{status:403});console.error("manual_shipment_create_failed",error);return Response.json({error:"Não foi possível criar a remessa."},{status:500});}
}
