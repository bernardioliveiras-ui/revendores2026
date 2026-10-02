import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sales, stockMovements } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { calculateStock } from "@/lib/stock";
import { repairPaidPurchaseStockForUser } from "@/lib/stock-repair";

import { ensureOperationalSchema } from "@/lib/runtime-schema";
export async function GET(request: Request){
  try{
    await ensureOperationalSchema();
    const user=await requireSession(request);if(user.role!=="reseller")return Response.json({error:"Área do revendedor."},{status:403});
    await repairPaidPurchaseStockForUser(user.id);
    const db=getDb();const [movements,saleRows]=await Promise.all([db.select().from(stockMovements).where(eq(stockMovements.userId,user.id)).orderBy(desc(stockMovements.occurredAt)),db.select().from(sales).where(eq(sales.userId,user.id)).orderBy(desc(sales.soldAt))]);
    return Response.json({stock:calculateStock(movements),soldBoxes:saleRows.reduce((s,r)=>s+r.boxes,0),grossSalesCents:saleRows.reduce((s,r)=>s+r.totalValueCents,0),movements,sales:saleRows},{headers:{"cache-control":"no-store"}});
  }catch(error){if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});console.error("stock_load_failed",error);return Response.json({error:"Não foi possível carregar o estoque."},{status:500});}
}
