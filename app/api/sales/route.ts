import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { sales, stockMovements, users } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { calculateStock } from "@/lib/stock";

function clean(v:unknown,max=120){return typeof v==="string"?v.trim().slice(0,max):""}
export async function GET(request:Request){try{const user=await requireSession(request);if(user.role!=="reseller")return Response.json({error:"Área do revendedor."},{status:403});const rows=await getDb().select().from(sales).where(eq(sales.userId,user.id)).orderBy(desc(sales.soldAt));return Response.json({sales:rows});}catch(error){if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});return Response.json({error:"Não foi possível carregar as vendas."},{status:500});}}

export async function POST(request:Request){
  try{
    const user=await requireSession(request);if(user.role!=="reseller")return Response.json({error:"Área do revendedor."},{status:403});
    const body=await request.json() as {boxes?:unknown;unitValue?:unknown;channel?:unknown;customerName?:unknown;notes?:unknown;soldAt?:unknown};
    const boxes=Number(body.boxes);const unitValue=Number(body.unitValue);const unitValueCents=Math.round(unitValue*100);
    if(!Number.isSafeInteger(boxes)||boxes<=0||boxes>2147483647||!Number.isSafeInteger(unitValueCents)||unitValueCents<0||!Number.isSafeInteger(boxes*unitValueCents)||boxes*unitValueCents>2147483647)return Response.json({error:"Informe quantidade e valor válidos."},{status:400});
    const db=getDb();const now=new Date().toISOString();const soldAt=clean(body.soldAt,40)||now;const saleId=crypto.randomUUID();
    await db.transaction(async(tx)=>{
      await tx.execute(sql`SELECT id FROM ${users} WHERE ${users.id} = ${user.id} FOR UPDATE`);
      const movements=await tx.select().from(stockMovements).where(eq(stockMovements.userId,user.id));const stock=calculateStock(movements);
      if(stock<boxes)throw new Error("INSUFFICIENT_STOCK");
      await tx.insert(sales).values({id:saleId,userId:user.id,boxes,unitValueCents,totalValueCents:boxes*unitValueCents,channel:clean(body.channel,40)||"other",customerName:clean(body.customerName,120),notes:clean(body.notes,1000),soldAt,createdAt:now});
      await tx.insert(stockMovements).values({id:crypto.randomUUID(),userId:user.id,type:"sale",boxes,referenceType:"sale",referenceId:saleId,notes:`Venda registrada · ${clean(body.channel,40)||"other"}`,occurredAt:soldAt,createdAt:now});
    });
    return Response.json({created:true,id:saleId});
  }catch(error){if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});if(error instanceof Error&&error.message==="INSUFFICIENT_STOCK")return Response.json({error:"Estoque insuficiente para registrar esta venda."},{status:409});console.error("sale_create_failed",error);return Response.json({error:"Não foi possível registrar a venda."},{status:500});}
}
