import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sales } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
import { buildResellerClients } from "@/lib/reseller-clients.mjs";

export async function GET(request:Request){
  try{
    const user=await requireSession(request);
    if(user.role!=="reseller")return Response.json({error:"Área exclusiva do revendedor."},{status:403});
    await ensureOperationalSchema();
    const ownSales=await getDb().select().from(sales).where(eq(sales.userId,user.id));
    return Response.json({clients:buildResellerClients(ownSales)},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});
    console.error("reseller_clients_failed",error);
    return Response.json({error:"Não foi possível carregar seus clientes."},{status:500});
  }
}
