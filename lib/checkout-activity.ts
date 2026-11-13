import { getMysqlPool } from "@/db";
import { ensureCampaignSchema } from "@/lib/campaign-schema";

let pending: Promise<void> | undefined;
export async function ensureCheckoutActivity() {
  if (!pending) pending = (async () => {
    await ensureCampaignSchema();
    await getMysqlPool().query(`CREATE TABLE IF NOT EXISTS checkout_activity (
      id varchar(36) PRIMARY KEY, campaign_id varchar(80) NOT NULL,
      name varchar(120) NOT NULL DEFAULT '', phone varchar(15) NOT NULL DEFAULT '',
      started_at varchar(40) NULL, last_seen_at varchar(40) NOT NULL,
      created_at varchar(40) NOT NULL, purchase_id varchar(80) NULL,
      KEY idx_activity_campaign (campaign_id, created_at),
      KEY idx_activity_purchase (purchase_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  })().catch(error => { pending = undefined; throw error; });
  await pending;
}
export async function readCheckoutFunnel(ownerId?: string) {
  await ensureCheckoutActivity();
  const [rows] = await getMysqlPool().execute(`SELECT a.id, a.campaign_id AS campaignId,
    c.name AS campaignName, a.name, a.phone, a.started_at AS startedAt,
    a.last_seen_at AS lastSeenAt, a.created_at AS createdAt,
    p.payment_status AS paymentStatus, p.payment_method AS paymentMethod,
    p.asaas_payment_id AS asaasPaymentId, p.order_number AS orderNumber
    FROM checkout_activity a INNER JOIN indicator_campaigns c ON c.id=a.campaign_id
    LEFT JOIN purchases p ON p.id=a.purchase_id
    ${ownerId ? "WHERE c.indicator_user_id=?" : ""}
    ORDER BY a.created_at DESC LIMIT 1000`, ownerId ? [ownerId] : []);
  return rows;
}
