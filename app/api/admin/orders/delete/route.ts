import { getMysqlPool } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { validateOrderDeletion, deletionBlockers } from "@/lib/bko-order-deletion.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {"cache-control":"private, no-store"};

function sameOrigin(request: Request) {
  try {
    const origin = request.headers.get("origin"), host = request.headers.get("host") || new URL(request.url).host;
    const url = new URL(origin || "");
    return url.host === host && (url.protocol === "https:" || (url.protocol === "http:" && /^(localhost|127\.0\.0\.1)(:|$)/.test(host)));
  } catch { return false; }
}

class DeletionDenied extends Error {
  code: string;
  status: number;
  blockers: string[];
  constructor(message: string, code: string, status: number = 409, blockers: string[] = []) {
    super(message);
    this.code = code;
    this.status = status;
    this.blockers = blockers;
  }
}

async function prepareDeletionAudit() {
  // Guardar somente referências operacionais, sem cópia dos dados pessoais removidos.
  await getMysqlPool().query(`CREATE TABLE IF NOT EXISTS bko_order_deletions (
    id char(36) NOT NULL PRIMARY KEY,
    purchase_id varchar(80) NOT NULL,
    order_number varchar(60) NOT NULL,
    asaas_payment_id varchar(120) NULL,
    payment_status varchar(30) NOT NULL,
    deleted_by varchar(80) NOT NULL,
    deleted_at varchar(40) NOT NULL,
    UNIQUE KEY idx_deleted_purchase (purchase_id),
    KEY idx_deleted_order (order_number)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

type PurchaseRow = { id:string; order_number:string; user_id:string|null; shipping_status:string; tracking_code:string|null; shipped_at:string|null; delivered_at:string|null; asaas_payment_id:string|null; payment_status:string };
type UserRow = { id:string; role:string };
type CountRow = { n:number|string };
type CashbackRow = { status:string; paid_at?:string|null; payout_reference?:string|null };
const count = (rows: unknown) => Number((rows as CountRow[])[0]?.n || 0);

export async function DELETE(request: Request) {
  try {
    const actor = await requireAdmin(request);
    if (!sameOrigin(request)) return Response.json({error:"Origem não autorizada."},{status:403,headers});
    const input = validateOrderDeletion(await request.json().catch(()=>null));
    if ("error" in input) return Response.json({error:input.error},{status:400,headers});
    await prepareDeletionAudit();
    const connection = await getMysqlPool().getConnection();
    try {
      await connection.beginTransaction();
      const [matches] = await connection.execute("SELECT id,order_number,user_id,shipping_status,tracking_code,shipped_at,delivered_at,asaas_payment_id,payment_status FROM purchases WHERE id=? FOR UPDATE",[input.purchaseId]);
      const purchase = (matches as PurchaseRow[])[0];
      if (!purchase || purchase.order_number !== input.orderNumber) throw new DeletionDenied("Pedido não encontrado ou número divergente.","PURCHASE_NOT_FOUND",404);

      const [tableRows] = await connection.execute("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'");
      const tables = new Set((tableRows as Array<{name:string}>).map(row=>row.name));
      const [foreignKeyRows] = await connection.execute("SELECT TABLE_NAME AS name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME='purchases'");
      const knownForeignKeys = new Set(["reseller_profiles","purchase_measurement","measurement_outbox"]);
      if ((foreignKeyRows as Array<{name:string}>).some(row=>!knownForeignKeys.has(row.name))) throw new DeletionDenied("Existe uma dependência desconhecida deste pedido; nenhuma exclusão foi feita.","UNKNOWN_RELATION");

      const userId = purchase.user_id;
      let user: UserRow | undefined;
      let profilePurchaseId: string | null | undefined;
      let salesCount=0, referralCount=0, otherPurchases=0, otherStock=0, outgoingMovements=0, otherCashbacks=0;
      let survivingPurchaseId: string | undefined;
      if (userId) {
        const [users] = await connection.execute("SELECT id,role FROM users WHERE id=? FOR UPDATE",[userId]);
        user = (users as UserRow[])[0];
        if (!user || user.role !== "reseller") throw new DeletionDenied("Conta vinculada inválida. Confira o cadastro antes de excluir.","ACCOUNT_CONFLICT");
        if (tables.has("reseller_profiles")) {
          const [profiles] = await connection.execute("SELECT purchase_id FROM reseller_profiles WHERE user_id=? LIMIT 1 FOR UPDATE",[userId]);
          profilePurchaseId = (profiles as Array<{purchase_id:string|null}>)[0]?.purchase_id;
        }
        if (tables.has("sales")) { const [rows] = await connection.execute("SELECT COUNT(*) AS n FROM sales WHERE user_id=?",[userId]); salesCount=count(rows); }
        if (tables.has("affiliate_referrals")) { const [rows] = await connection.execute("SELECT COUNT(*) AS n FROM affiliate_referrals WHERE user_id=?",[userId]); referralCount=count(rows); }
        if (tables.has("stock_movements")) {
          const [outgoing] = await connection.execute("SELECT COUNT(*) AS n FROM stock_movements WHERE user_id=? AND reference_id<>? AND type IN ('sale','adjustment_out')",[userId,purchase.id]);
          outgoingMovements=count(outgoing);
          const [others] = await connection.execute("SELECT COUNT(*) AS n FROM stock_movements WHERE user_id=? AND reference_id<>?",[userId,purchase.id]);
          otherStock=count(others);
        }
        const [purchases] = await connection.execute("SELECT COUNT(*) AS n FROM purchases WHERE user_id=? AND id<>?",[userId,purchase.id]);
        otherPurchases=count(purchases);
        if (tables.has("affiliate_cashbacks")) {
          const [others] = await connection.execute("SELECT COUNT(*) AS n FROM affiliate_cashbacks WHERE reseller_user_id=? AND purchase_id<>?",[userId,purchase.id]);
          otherCashbacks=count(others);
        }
        if (profilePurchaseId===purchase.id && otherPurchases>0) {
          const [survivors] = await connection.execute("SELECT id FROM purchases WHERE user_id=? AND id<>? ORDER BY created_at ASC LIMIT 1 FOR UPDATE",[userId,purchase.id]);
          survivingPurchaseId=(survivors as Array<{id:string}>)[0]?.id;
          if (!survivingPurchaseId) throw new DeletionDenied("Outra compra vinculada não foi localizada. Nenhuma exclusão foi feita.","ACCOUNT_CONFLICT");
        }
        if (profilePurchaseId===purchase.id && otherPurchases===0 && (otherStock>0 || otherCashbacks>0))
          throw new DeletionDenied("O revendedor possui estoque ou registros financeiros de outra origem. Preserve o vínculo e confira o cadastro antes de excluir.","ACCOUNT_CONFLICT");
      }

      let paidCashback=false;
      if (tables.has("affiliate_cashbacks")) {
        const [cashbacks] = await connection.execute("SELECT status,paid_at,payout_reference FROM affiliate_cashbacks WHERE purchase_id=? FOR UPDATE",[purchase.id]);
        paidCashback=(cashbacks as CashbackRow[]).some(row=>row.status==="paid"||Boolean(row.paid_at)||Boolean(row.payout_reference));
      }
      const blockers=deletionBlockers({shippingStatus:purchase.shipping_status,trackingCode:purchase.tracking_code,shippedAt:purchase.shipped_at,deliveredAt:purchase.delivered_at,sales:salesCount,referrals:referralCount,paidCashback,outgoingMovements});
      if (blockers.length) throw new DeletionDenied(`Não é seguro excluir: ${blockers.join(", ")}.`,"HAS_COMMERCIAL_HISTORY",409,blockers);

      const exclusiveAccount=Boolean(user && profilePurchaseId===purchase.id && otherPurchases===0 && otherStock===0 && otherCashbacks===0);
      // Auditoria é gravada na MESMA transação; rollback remove qualquer tentativa parcial.
      await connection.execute("INSERT INTO bko_order_deletions (id,purchase_id,order_number,asaas_payment_id,payment_status,deleted_by,deleted_at) VALUES (?,?,?,?,?,?,?)",[
        crypto.randomUUID(),purchase.id,purchase.order_number,purchase.asaas_payment_id,purchase.payment_status,actor.id,new Date().toISOString(),
      ]);
      if (tables.has("measurement_outbox")) await connection.execute("DELETE FROM measurement_outbox WHERE purchase_id=?",[purchase.id]);
      if (tables.has("purchase_measurement")) await connection.execute("DELETE FROM purchase_measurement WHERE purchase_id=?",[purchase.id]);
      if (tables.has("affiliate_cashbacks")) await connection.execute("DELETE FROM affiliate_cashbacks WHERE purchase_id=?",[purchase.id]);
      // Preservar a chave idempotente dos webhooks recebidos, inclusive após remover a compra local.
      if (tables.has("asaas_events")) await connection.execute("UPDATE asaas_events SET purchase_id=NULL WHERE purchase_id=?",[purchase.id]);
      if (userId && tables.has("stock_movements")) await connection.execute("DELETE FROM stock_movements WHERE user_id=? AND reference_id=?",[userId,purchase.id]);

      if (userId && exclusiveAccount) {
        if (tables.has("auth_sessions")) await connection.execute("DELETE FROM auth_sessions WHERE user_id=?",[userId]);
        if (tables.has("reseller_invitations")) await connection.execute("DELETE FROM reseller_invitations WHERE user_id=?",[userId]);
        if (tables.has("reseller_profiles")) await connection.execute("DELETE FROM reseller_profiles WHERE user_id=? AND purchase_id=?",[userId,purchase.id]);
      } else if (userId && tables.has("reseller_profiles") && profilePurchaseId===purchase.id) {
        // Nunca converter silenciosamente revendedor originado por compra em cadastro manual.
        if (!survivingPurchaseId) throw new DeletionDenied("Cadastro vinculado não pode ser desvinculado com segurança.","ACCOUNT_CONFLICT");
        await connection.execute("UPDATE reseller_profiles SET purchase_id=? WHERE purchase_id=?",[survivingPurchaseId,purchase.id]);
      }

      const [deleted] = await connection.execute("DELETE FROM purchases WHERE id=? AND order_number=?",[purchase.id,purchase.order_number]);
      if ((deleted as {affectedRows:number}).affectedRows!==1) throw new Error("Pedido alterado durante a exclusão.");
      if (userId && exclusiveAccount) await connection.execute("DELETE FROM users WHERE id=? AND role='reseller'",[userId]);
      await connection.commit();
      console.info("bko_purchase_deleted",{actorId:actor.id,orderNumber:purchase.order_number,asaasUnchanged:true});
      return Response.json({deleted:true,orderNumber:purchase.order_number,asaasUnchanged:true},{headers});
    } catch(error) {
      await connection.rollback().catch(()=>{});
      if (error instanceof DeletionDenied) return Response.json({error:error.message,code:error.code,blockers:error.blockers},{status:error.status,headers});
      if (error && typeof error==="object" && "code" in error && ["ER_ROW_IS_REFERENCED_2","ER_ROW_IS_REFERENCED"].includes(String(error.code)))
        return Response.json({error:"Há outros registros vinculados à compra. Nada foi excluído.",code:"UNKNOWN_RELATION"},{status:409,headers});
      throw error;
    } finally { connection.release(); }
  } catch(error) {
    if (error instanceof Error && error.message==="UNAUTHORIZED") return Response.json({error:"Faça login novamente."},{status:401,headers});
    if (error instanceof Error && error.message==="FORBIDDEN") return Response.json({error:"Acesso restrito ao BKO."},{status:403,headers});
    console.error("bko_purchase_delete_failed",{reason:error instanceof Error?error.message:"UNKNOWN"});
    return Response.json({error:"Não foi possível excluir o pedido. Nenhuma exclusão parcial foi confirmada."},{status:500,headers});
  }
}
