import { getMysqlPool } from "@/db";
import { ensureOperationalSchema } from "@/lib/runtime-schema";
import { reserveCampaignSlugs } from "@/lib/campaign-slug.mjs";

let pending: Promise<void> | undefined;
export async function ensureCampaignSchema() {
  if (!pending) pending = (async () => {
    await ensureOperationalSchema();
    const pool=getMysqlPool();
    // Hostinger can start Next directly, bypassing the startup migration script.
    await pool.query(`CREATE TABLE IF NOT EXISTS asaas_events (
      event_id varchar(180) NOT NULL PRIMARY KEY,
      event_type varchar(100) NOT NULL,
      purchase_id varchar(80) NULL,
      payment_id varchar(120) NULL,
      received_at varchar(40) NOT NULL,
      KEY idx_asaas_event_payment (payment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    const [eventColumns] = await pool.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='asaas_events'");
    const eventNames = new Set((eventColumns as Array<{COLUMN_NAME:string}>).map(row=>row.COLUMN_NAME));
    if (!eventNames.has("purchase_id")) {
      try { await pool.query("ALTER TABLE asaas_events ADD COLUMN purchase_id varchar(80) NULL"); }
      catch(error) { if (!(error instanceof Error && "code" in error && error.code === "ER_DUP_FIELDNAME")) throw error; }
    }
    await pool.query(`CREATE TABLE IF NOT EXISTS indicator_campaigns (
      id varchar(80) NOT NULL PRIMARY KEY, indicator_user_id varchar(80) NOT NULL,
      name varchar(120) NOT NULL, public_code varchar(64) NOT NULL,
      public_slug varchar(100) NULL,
      cashback_mode varchar(12) NOT NULL DEFAULT 'fixed', cashback_value int NOT NULL DEFAULT 1500,
      active int NOT NULL DEFAULT 1, click_count int NOT NULL DEFAULT 0,
      created_at varchar(40) NOT NULL, updated_at varchar(40) NOT NULL,
      UNIQUE KEY idx_indicator_campaign_code (public_code),
      UNIQUE KEY idx_indicator_campaign_slug (public_slug),
      UNIQUE KEY idx_indicator_campaign_owner (indicator_user_id),
      CONSTRAINT fk_indicator_campaign_owner FOREIGN KEY (indicator_user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await pool.query(`CREATE TABLE IF NOT EXISTS indicator_external_orders (
      id varchar(80) NOT NULL PRIMARY KEY,
      external_order_id varchar(120) NOT NULL,
      campaign_id varchar(80) NOT NULL,
      asaas_payment_id varchar(120) NOT NULL,
      payment_status varchar(30) NOT NULL DEFAULT 'payment_pending',
      product_total_cents int NOT NULL,
      indicator_cashback_cents int NULL,
      asaas_verified_at varchar(40) NULL,
      created_at varchar(40) NOT NULL,
      updated_at varchar(40) NOT NULL,
      UNIQUE KEY idx_external_order_id (external_order_id),
      UNIQUE KEY idx_external_asaas_payment (asaas_payment_id),
      KEY idx_external_campaign_id (campaign_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    const [cols] = await pool.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='indicator_campaigns'");
    const names = new Set((cols as Array<{COLUMN_NAME:string}>).map(r=>r.COLUMN_NAME));
    for (const [field,definition] of Object.entries({cashback_mode:"varchar(12) NOT NULL DEFAULT 'fixed'",cashback_value:"int NOT NULL DEFAULT 1500"})) {
      if (names.has(field)) continue;
      try { await pool.query(`ALTER TABLE indicator_campaigns ADD COLUMN \`${field}\` ${definition}`); }
      catch (error) { if (!(error instanceof Error && "code" in error && error.code==="ER_DUP_FIELDNAME")) throw error; }
    }
    if (!names.has("public_slug")) {
      try { await pool.query("ALTER TABLE indicator_campaigns ADD COLUMN public_slug varchar(100) NULL"); }
      catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ER_DUP_FIELDNAME")) throw error; }
    }
    const [slugIndexes] = await pool.query("SHOW INDEX FROM indicator_campaigns WHERE Key_name='idx_indicator_campaign_slug'");
    if (!(slugIndexes as unknown[]).length) {
      try { await pool.query("CREATE UNIQUE INDEX idx_indicator_campaign_slug ON indicator_campaigns(public_slug)"); }
      catch(error) { if (!(error instanceof Error && "code" in error && error.code === "ER_DUP_KEYNAME")) throw error; }
    }
    // Backfill only non-financial link metadata; preserve public_code and all orders.
    const [rows] = await pool.query("SELECT id,name,public_slug AS publicSlug FROM indicator_campaigns ORDER BY created_at,id");
    for (const {id,slug} of reserveCampaignSlugs(rows as Array<{id:string;name:string;publicSlug:string|null}>)) {
      try { await pool.execute("UPDATE indicator_campaigns SET public_slug=? WHERE id=? AND public_slug IS NULL",[slug,id]); }
      catch(error) { if (!(error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY")) throw error; }
    }
  })().catch(error=>{ pending=undefined;throw error; });
  await pending;
}
