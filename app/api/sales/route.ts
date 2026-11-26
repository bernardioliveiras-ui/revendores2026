import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { resellerSalePriceSettings, sales, stockMovements, users } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { calculateStock } from "@/lib/stock";
import { repairPaidPurchaseStockForUser } from "@/lib/stock-repair";

import { ensureOperationalSchema } from "@/lib/runtime-schema";
const DEFAULT_RESELLER_SALE_PRICE_CENTS=10990;
function clean(v:unknown,max=120){return typeof v==="string"?v.trim().slice(0,max):""}
export async function GET(request:Request){try{const user=await requireSession(request);if(user.role!=="reseller")return Response.json({error:"Área do revendedor."},{status:403});const rows=await getDb().select().from(sales).where(eq(sales.userId,user.id)).orderBy(desc(sales.soldAt));return Response.json({sales:rows});}catch(error){if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});return Response.json({error:"Não foi possível carregar as vendas."},{status:500});}}

export async function POST(request:Request){
  try{
    const user=await requireSession(request);if(user.role!=="reseller")return Response.json({error:"Área do revendedor."},{status:403});
    await ensureOperationalSchema();
    const body=await request.json().catch(() => null) as {boxes?:unknown;unitValue?:unknown;requestId?:unknown;channel?:unknown;customerName?:unknown;notes?:unknown;soldAt?:unknown};
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({error:"Dados inválidos."},{status:400});
    if (body.soldAt && (typeof body.soldAt !== "string" || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(body.soldAt) || !Number.isFinite(Date.parse(body.soldAt)))) return Response.json({error:"Informe uma data válida para a venda."},{status:400});
    const boxes=Number(body.boxes);
    if(!Number.isSafeInteger(boxes)||boxes<=0||boxes>2147483647)return Response.json({error:"Informe uma quantidade válida."},{status:400});
    const clientRequestId=body.requestId===undefined?null:typeof body.requestId==="string"&&/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId)?body.requestId:null;
    if(body.requestId!==undefined&&!clientRequestId)return Response.json({error:"Identificador da venda inválido."},{status:400});
    await repairPaidPurchaseStockForUser(user.id);
    const db=getDb();const now=new Date().toISOString();const soldAt=clean(body.soldAt,40)||now;const saleId=crypto.randomUUID();
    let created=true;let remainingStock=0;let savedSaleId=saleId;let unitPriceCents=DEFAULT_RESELLER_SALE_PRICE_CENTS;
    await db.transaction(async(tx)=>{
      await tx.execute(sql`SELECT id FROM ${users} WHERE ${users.id} = ${user.id} FOR UPDATE`);
      if(clientRequestId){
        const [existing]=await tx.select().from(sales).where(and(eq(sales.userId,user.id),eq(sales.clientRequestId,clientRequestId))).limit(1);
        if(existing){
          if(existing.boxes!==boxes)throw new Error("REQUEST_ID_REUSED");
          created=false;savedSaleId=existing.id;
          const previousMovements=await tx.select().from(stockMovements).where(eq(stockMovements.userId,user.id));
          remainingStock=calculateStock(previousMovements);unitPriceCents=existing.unitValueCents;
          return;
        }
      }
      const [price]=await tx.select().from(resellerSalePriceSettings).where(eq(resellerSalePriceSettings.id,1)).limit(1);
      unitPriceCents=price?.priceCents??DEFAULT_RESELLER_SALE_PRICE_CENTS;
      if(!Number.isSafeInteger(unitPriceCents)||unitPriceCents<1||boxes*unitPriceCents>2147483647)throw new Error("INVALID_SALE_TOTAL");
      const movements=await tx.select().from(stockMovements).where(eq(stockMovements.userId,user.id));const stock=calculateStock(movements);
      if(stock<boxes)throw new Error("INSUFFICIENT_STOCK");
      remainingStock=stock-boxes;
      await tx.insert(sales).values({id:saleId,userId:user.id,clientRequestId,boxes,unitValueCents:unitPriceCents,totalValueCents:boxes*unitPriceCents,channel:clean(body.channel,40)||"other",customerName:clean(body.customerName,120),notes:clean(body.notes,1000),soldAt,createdAt:now});
      await tx.insert(stockMovements).values({id:crypto.randomUUID(),userId:user.id,type:"sale",boxes,referenceType:"sale",referenceId:saleId,notes:`Venda registrada · ${clean(body.channel,40)||"other"}`,occurredAt:soldAt,createdAt:now});
    });
    return Response.json({created,id:savedSaleId,remainingStock,unitPriceCents});
  }catch(error){if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});if(error instanceof Error&&error.message==="INSUFFICIENT_STOCK")return Response.json({error:"Estoque insuficiente para registrar esta venda."},{status:409});if(error instanceof Error&&error.message==="REQUEST_ID_REUSED")return Response.json({error:"Esta identificação já foi utilizada em outra venda."},{status:409});console.error("sale_create_failed",error);return Response.json({error:"Não foi possível registrar a venda."},{status:500});}
}
