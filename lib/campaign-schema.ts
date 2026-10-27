import { getMysqlPool } from "@/db";
import { ensureOperationalSchema } from "@/lib/runtime-schema";

let pending: Promise<void> | undefined;
export async function ensureCampaignSchema() {
  if (!pending) pending = (async () => {
    await ensureOperationalSchema();
    const pool=getMysqlPool();
    await pool.query(`CREATE TABLE IF NOT EXISTS indicator_campaigns (
      id varchar(80) NOT NULL PRIMARY KEY, indicator_user_id varchar(80) NOT NULL,
      name varchar(120) NOT NULL, public_code varchar(64) NOT NULL,
      active int NOT NULL DEFAULT 1, click_count int NOT NULL DEFAULT 0,
      created_at varchar(40) NOT NULL, updated_at varchar(40) NOT NULL,
      UNIQUE KEY idx_indicator_campaign_code (public_code),
      UNIQUE KEY idx_indicator_campaign_owner (indicator_user_id),
      CONSTRAINT fk_indicator_campaign_owner FOREIGN KEY (indicator_user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  })().catch(error=>{ pending=undefined;throw error; });
  await pending;
}
