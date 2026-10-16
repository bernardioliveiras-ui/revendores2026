import { getMysqlPool } from "@/db";

let pending: Promise<void> | undefined;
export function ensureIndicatorSchema() {
 if (!pending) pending=(async()=>{
  const pool=getMysqlPool();
  await pool.query(`CREATE TABLE IF NOT EXISTS indicator_profiles (
    user_id varchar(80) NOT NULL PRIMARY KEY, created_at varchar(40) NOT NULL,
    KEY idx_indicator_profiles_created (created_at),
    CONSTRAINT fk_indicator_profiles_user FOREIGN KEY (user_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await pool.query(`CREATE TABLE IF NOT EXISTS indicator_leads (
    id varchar(80) NOT NULL PRIMARY KEY, indicator_user_id varchar(80) NOT NULL,
    public_code varchar(64) NOT NULL, name varchar(120) NOT NULL,
    phone varchar(32) NOT NULL, channel varchar(120) NOT NULL DEFAULT 'WhatsApp',
    status varchar(32) NOT NULL DEFAULT 'LINK GERADO', click_count int NOT NULL DEFAULT 0,
    last_clicked_at varchar(40) NULL, verification_notes varchar(500) NOT NULL DEFAULT '',
    receipt_id varchar(80) NULL, receipt_sent_at varchar(40) NULL,
    receipt_review varchar(16) NOT NULL DEFAULT 'PENDENTE',
    reviewed_at varchar(40) NULL, reviewed_by varchar(80) NULL,
    cashback_cents int NULL, cashback_status varchar(16) NOT NULL DEFAULT 'PENDENTE',
    created_at varchar(40) NOT NULL, updated_at varchar(40) NOT NULL,
    UNIQUE KEY idx_indicator_leads_code (public_code),
    KEY idx_indicator_leads_owner (indicator_user_id,created_at),
    CONSTRAINT fk_indicator_leads_owner FOREIGN KEY (indicator_user_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [columns]=await pool.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='indicator_leads'");
  const available=new Set((columns as Array<{COLUMN_NAME:string}>).map(c=>c.COLUMN_NAME));
  for (const [key,definition] of Object.entries({receipt_id:'varchar(80) NULL',receipt_sent_at:'varchar(40) NULL',receipt_review:"varchar(16) NOT NULL DEFAULT 'PENDENTE'",reviewed_at:'varchar(40) NULL',reviewed_by:'varchar(80) NULL'})) {
    if (!available.has(key)) await pool.query(`ALTER TABLE indicator_leads ADD COLUMN \`${key}\` ${definition}`);
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS indicator_receipts (
    id varchar(80) NOT NULL PRIMARY KEY, lead_id varchar(80) NOT NULL,
    filename varchar(255) NOT NULL, mime_type varchar(80) NOT NULL,
    size_bytes int NOT NULL, bytes longblob NOT NULL, created_at varchar(40) NOT NULL,
    KEY idx_indicator_receipts_lead (lead_id),
    CONSTRAINT fk_indicator_receipts_lead FOREIGN KEY (lead_id) REFERENCES indicator_leads(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
 })().catch(error=>{pending=undefined;throw error});
 return pending;
}
