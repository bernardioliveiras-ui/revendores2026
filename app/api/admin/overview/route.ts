import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { affiliateReferrals, purchases, sales, stockMovements, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

function signed(type:string,boxes:number){if(type==="entry"||type==="adjustment_in")return boxes;if(type==="sale"||type==="adjustment_out")return -boxes;return 0;}
export async function GET(request: Request){
  try{
    await requireAdmin(request);const db=getDb();
    const [purchaseRows,userRows,saleRows,stockRows,referralRows]=await Promise.all([
      db.select().from(purchases).orderBy(desc(purchases.createdAt)),
      db.select().from(users),db.select().from(sales),db.select().from(stockMovements),db.select().from(affiliateReferrals),
    ]);
    const paid=purchaseRows.filter(p=>p.paymentStatus==="paid");
    const metrics={
      activeResellers:userRows.filter(u=>u.role==="reseller"&&u.status==="active").length,
      paidPurchases:paid.length,
      pendingAccess:paid.filter(p=>!p.accessReleasedAt).length,
      kitRevenueCents:paid.reduce((s,p)=>s+p.totalCents,0),
      boxesSold:saleRows.reduce((s,row)=>s+row.boxes,0),
      grossSalesCents:saleRows.reduce((s,row)=>s+row.totalValueCents,0),
      aggregateStock:stockRows.reduce((s,row)=>s+signed(row.type,row.boxes),0),
      affiliateLinks:referralRows.length,
      affiliateClicks:referralRows.reduce((s,row)=>s+row.clickCount,0),
    };
    return Response.json({metrics,purchases:purchaseRows.map(p=>{const {welcomeSecret, welcomeIv, ...safe}=p;void welcomeSecret;void welcomeIv;return safe;}),resellers:userRows.filter(u=>u.role==="reseller").map(u=>({id:u.id,email:u.email,name:u.name,phone:u.phone,role:u.role,status:u.status,createdAt:u.createdAt,updatedAt:u.updatedAt})),sales:saleRows,referrals:referralRows},{headers:{"cache-control":"no-store"}});
  }catch(error){if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});if(error instanceof Error&&error.message==="FORBIDDEN")return Response.json({error:"Acesso restrito ao BKO."},{status:403});console.error("admin_overview_failed",error);return Response.json({error:"Não foi possível carregar o BKO."},{status:500});}
}
