import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { resellerSalePriceHistory, resellerSalePriceSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
import { DEFAULT_RESELLER_SALE_PRICE_CENTS, validateResellerSalePrice } from "@/lib/reseller-sale-price.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error:unknown){const m=error instanceof Error?error.message:"";if(m==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});if(m==="FORBIDDEN")return Response.json({error:"Acesso exclusivo ao BKO."},{status:403});console.error("reseller_price_admin_failed",error);return Response.json({error:"Não foi possível consultar/alterar o preço."},{status:500});}

export async function GET(request:Request){
  try{
    await requireAdmin(request);await ensureOperationalSchema();
    const db=getDb();
    const [current,history]=await Promise.all([
      db.select().from(resellerSalePriceSettings).where(eq(resellerSalePriceSettings.id,1)).limit(1),
      db.select().from(resellerSalePriceHistory).orderBy(desc(resellerSalePriceHistory.changedAt)).limit(15),
    ]);
    return Response.json({priceCents:current[0]?.priceCents??DEFAULT_RESELLER_SALE_PRICE_CENTS,history},{headers:{"cache-control":"no-store"}});
  }catch(error){return fail(error);}
}

export async function PATCH(request:Request){
  try{
    const admin=await requireAdmin(request);await ensureOperationalSchema();
    const body=await request.json().catch(()=>null);
    let updated;
    try {updated=validateResellerSalePrice(body);} catch(error){return Response.json({error:error instanceof Error?error.message:"Dados inválidos."},{status:400});}
    const db=getDb();const now=new Date().toISOString();
    const old=await db.transaction(async(tx)=>{
      await tx.execute(sql`SELECT id FROM ${resellerSalePriceSettings} WHERE id = 1 FOR UPDATE`);
      const [current]=await tx.select().from(resellerSalePriceSettings).where(eq(resellerSalePriceSettings.id,1)).limit(1);
      const previous=current?.priceCents??DEFAULT_RESELLER_SALE_PRICE_CENTS;
      if(previous===updated.priceCents)return previous;
      await tx.update(resellerSalePriceSettings).set({priceCents:updated.priceCents,updatedBy:admin.id,updatedAt:now}).where(eq(resellerSalePriceSettings.id,1));
      await tx.insert(resellerSalePriceHistory).values({id:crypto.randomUUID(),oldPriceCents:previous,newPriceCents:updated.priceCents,reason:updated.reason,changedBy:admin.id,changedAt:now});
      return previous;
    });
    return Response.json({priceCents:updated.priceCents,previousPriceCents:old,changed:old!==updated.priceCents},{headers:{"cache-control":"no-store"}});
  }catch(error){return fail(error);}
}
