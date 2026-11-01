import { getMysqlPool } from "@/db";

// Fallback for hosts which bypass `npm start`; production migrations also include these tables.
let pending: Promise<void> | undefined;
export function ensureIndicatedSchema() {
  if (!pending) pending = (async () => {
    const pool = getMysqlPool();
    await pool.query(`CREATE TABLE IF NOT EXISTS indicated_clients (
      id varchar(80) NOT NULL PRIMARY KEY, client_user_id varchar(80) NOT NULL,
      name varchar(120) NOT NULL, phone varchar(32) NOT NULL, channel varchar(120) NOT NULL,
      responsible varchar(120) NOT NULL, status varchar(32) NOT NULL DEFAULT 'ENTROU NO LINK',
      receipt_id varchar(80) NULL, receipt_sent_at varchar(40) NULL,
      receipt_review varchar(16) NOT NULL DEFAULT 'PENDENTE', receipt_guidance varchar(500) NOT NULL DEFAULT '',
      reviewed_at varchar(40) NULL, reviewed_by varchar(80) NULL,
      cashback_cents int NULL, cashback_status varchar(16) NOT NULL DEFAULT 'PENDENTE',
      created_at varchar(40) NOT NULL, updated_at varchar(40) NOT NULL,
      UNIQUE KEY idx_indicated_client_user (client_user_id), KEY idx_indicated_status (status),
      CONSTRAINT fk_indicated_user FOREIGN KEY (client_user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await pool.query(`CREATE TABLE IF NOT EXISTS indicated_invitations (
      token_hash varchar(64) NOT NULL PRIMARY KEY, client_user_id varchar(80) NOT NULL,
      expires_at varchar(40) NOT NULL, used_at varchar(40) NULL, created_at varchar(40) NOT NULL,
      KEY idx_indicated_invitation_user (client_user_id),
      CONSTRAINT fk_indicated_invitation_user FOREIGN KEY (client_user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await pool.query(`CREATE TABLE IF NOT EXISTS indicated_receipts (
      id varchar(80) NOT NULL PRIMARY KEY, indication_id varchar(80) NOT NULL,
      filename varchar(255) NOT NULL, mime_type varchar(80) NOT NULL,
      size_bytes int NOT NULL, bytes longblob NOT NULL, created_at varchar(40) NOT NULL,
      KEY idx_indicated_receipt_indication (indication_id),
      CONSTRAINT fk_indicated_receipt_indication FOREIGN KEY (indication_id) REFERENCES indicated_clients(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  })().catch(error => { pending = undefined; throw error; });
  return pending;
}
