import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stockMovements, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
import { repairPaidPurchaseStockForUser } from "@/lib/stock-repair";
import { calculateStock } from "@/lib/stock";
import { planStockCorrection, validateStockCorrection } from "@/lib/stock-adjustment.mjs";
import { indicatedError, privateResponseHeaders } from "@/lib/indicator-security";

export const runtime="nodejs";

function sameOrigin(request:Request) {
  try {
    const origin=request.headers.get("origin"),host=request.headers.get("host")||new URL(request.url).host;
    const url=new URL(origin||"");
    return url.host===host&&(url.protocol==="https:"||(url.protocol==="http:"&&/^(localhost|127\.0\.0\.1)(:|$)/.test(host)));
  }catch{return false;}
}

/** Confere estoque físico em saldo absoluto; movimentação é a única fonte de verdade. */
export async function POST(request:Request){
  try {
    const actor=await requireAdmin(request);
    if(!sameOrigin(request))return Response.json({error:"Origem não autorizada."},{status:403,headers:privateResponseHeaders});
    const payload=await request.json().catch(()=>null);
    const result=validateStockCorrection(payload);
    if(result.error)return Response.json({error:result.error},{status:400,headers:privateResponseHeaders});
    const {userId,expectedStock,desiredStock,reason}=result.value!;
    await ensureOperationalSchema();
    const [owner]=await getDb().select({id:users.id,role:users.role}).from(users).where(eq(users.id,userId)).limit(1);
    if(!owner||owner.role!=="reseller")return Response.json({error:"Revendedor não encontrado."},{status:404,headers:privateResponseHeaders});
    // Corrige movimentos faltantes de pedidos já pagos ANTES de conferir o saldo-base.
    await repairPaidPurchaseStockForUser(userId);
    return await getDb().transaction(async tx=>{
      // O mesmo bloqueio de linha é usado pelo registro de vendas; nenhuma venda
      // pode ser gravada entre esta conferência e a criação do ajuste.
      const [seller]=await tx.select({id:users.id,role:users.role}).from(users).where(eq(users.id,userId)).limit(1).for("update");
      if(!seller||seller.role!=="reseller")return Response.json({error:"Revendedor não encontrado."},{status:404,headers:privateResponseHeaders});
      // Bloqueia também a faixa indexada de movimentos (incluindo lacunas no
      // InnoDB REPEATABLE READ), pois o webhook Asaas não bloqueia users.
      const movements=await tx.select().from(stockMovements).where(eq(stockMovements.userId,userId)).for("update");
      const currentStock=calculateStock(movements);
      if(currentStock!==expectedStock)return Response.json({error:`Estoque alterado desde a última consulta. Saldo atual: ${currentStock} caixas. Atualize o formulário e confira antes de salvar.`,code:"STALE_STOCK",stock:currentStock},{status:409,headers:privateResponseHeaders});
      const correction=planStockCorrection(currentStock,desiredStock,reason,actor.id);
      if(correction.changed){
        const now=new Date().toISOString();
        await tx.insert(stockMovements).values({id:crypto.randomUUID(),userId,type:correction.type,boxes:correction.boxes,referenceType:"bko_stock_physical_adjustment",referenceId:crypto.randomUUID(),notes:correction.notes,occurredAt:now,createdAt:now});
        console.info("bko_stock_corrected",{actorId:actor.id,userId,from:currentStock,to:desiredStock,at:now});
      }
      return Response.json({updated:true,changed:correction.changed,stock:correction.stock},{headers:privateResponseHeaders});
    });
  }catch(error){return indicatedError(error)}
}
