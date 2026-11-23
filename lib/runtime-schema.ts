import { getMysqlPool } from "@/db";
import { ensureNullableResellerPurchaseId } from "@/lib/reseller-schema-migration.mjs";

type RuntimeSchemaGlobal = typeof globalThis & { __lordnutriOperationalSchema?: Promise<void> };

const userColumns: Record<string, string> = {
  name: "varchar(120) NOT NULL DEFAULT ''",
  phone: "varchar(32) NOT NULL DEFAULT ''",
  role: "varchar(20) NOT NULL DEFAULT 'reseller'",
  status: "varchar(20) NOT NULL DEFAULT 'active'",
  password_hash: "varchar(255) NULL",
  must_change_password: "int NOT NULL DEFAULT 1",
  failed_login_attempts: "int NOT NULL DEFAULT 0",
  locked_until: "varchar(40) NULL",
  updated_at: "varchar(40) NOT NULL DEFAULT ''",
};

const purchaseColumns: Record<string, string> = {
  asaas_installment_id: "varchar(120) NULL",
  campaign_id: "varchar(80) NULL",
  indicator_cashback_cents: "int NULL",
  asaas_verified_at: "varchar(40) NULL",
  carrier: "varchar(120) NULL",
  postal_event: "varchar(240) NULL",
  postal_event_at: "varchar(40) NULL",
  postal_checked_at: "varchar(40) NULL",
  postal_attempt_at: "varchar(40) NULL",
  postal_issue: "varchar(120) NULL",
  tracking_code: "varchar(120) NULL",
  shipped_at: "varchar(40) NULL",
  delivered_at: "varchar(40) NULL",
  user_id: "varchar(80) NULL",
  access_released_at: "varchar(40) NULL",
  product_total_cents: "int NOT NULL DEFAULT 0",
  shipping_type: "varchar(20) NOT NULL DEFAULT ''",
  shipping_cents: "int NOT NULL DEFAULT 0",
  payment_method: "varchar(20) NOT NULL DEFAULT ''",
  installments: "int NOT NULL DEFAULT 1",
  installment_value_cents: "int NOT NULL DEFAULT 0",
  interest_cents: "int NOT NULL DEFAULT 0",
  welcome_status: "varchar(30) NOT NULL DEFAULT 'pending'",
  welcome_secret: "varchar(1000) NULL",
  welcome_iv: "varchar(40) NULL",
  welcome_sent_at: "varchar(40) NULL",
};

async function addMissingColumns(table: string, columns: Record<string, string>) {
  const pool = getMysqlPool();
  const [rows] = await pool.execute(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    [table],
  );
  const existing = new Set((rows as Array<{ COLUMN_NAME: string }>).map((row) => row.COLUMN_NAME));
  for (const [name, definition] of Object.entries(columns)) {
    if (existing.has(name)) continue;
    try {
      await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${definition}`);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code || "") : "";
      if (code !== "ER_DUP_FIELDNAME") throw error;
    }
  }
}

async function migrateOperationalSchema() {
  const pool = getMysqlPool();

  await pool.query(`CREATE TABLE IF NOT EXISTS \`stock_movements\` (
    \`id\` varchar(80) NOT NULL,
    \`user_id\` varchar(80) NOT NULL,
    \`type\` varchar(30) NOT NULL,
    \`boxes\` int NOT NULL,
    \`reference_type\` varchar(30) NOT NULL DEFAULT 'manual',
    \`reference_id\` varchar(80) NOT NULL DEFAULT '',
    \`notes\` varchar(1000) NOT NULL DEFAULT '',
    \`occurred_at\` varchar(40) NOT NULL,
    \`created_at\` varchar(40) NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`idx_stock_user_date\` (\`user_id\`,\`occurred_at\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`sales\` (
    \`id\` varchar(80) NOT NULL,
    \`user_id\` varchar(80) NOT NULL,
    \`boxes\` int NOT NULL,
    \`unit_value_cents\` int NOT NULL,
    \`total_value_cents\` int NOT NULL,
    \`channel\` varchar(40) NOT NULL DEFAULT 'other',
    \`customer_name\` varchar(120) NOT NULL DEFAULT '',
    \`notes\` varchar(1000) NOT NULL DEFAULT '',
    \`sold_at\` varchar(40) NOT NULL,
    \`created_at\` varchar(40) NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`idx_sales_user_date\` (\`user_id\`,\`sold_at\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`reseller_profiles\` (
    \`id\` varchar(80) NOT NULL,
    \`user_id\` varchar(80) NOT NULL,
    \`purchase_id\` varchar(80) NULL,
    \`cpf_cnpj\` varchar(24) NOT NULL,
    \`postal_code\` varchar(16) NOT NULL,
    \`street\` varchar(220) NOT NULL,
    \`number\` varchar(32) NOT NULL,
    \`complement\` varchar(160) NOT NULL DEFAULT '',
    \`district\` varchar(120) NOT NULL,
    \`city\` varchar(120) NOT NULL,
    \`state\` varchar(2) NOT NULL,
    \`initial_kit\` varchar(20) NOT NULL,
    \`initial_boxes\` int NOT NULL,
    \`created_at\` varchar(40) NOT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`idx_reseller_profiles_user\` (\`user_id\`),
    UNIQUE KEY \`idx_reseller_profiles_purchase\` (\`purchase_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await ensureNullableResellerPurchaseId(pool);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`reseller_invitations\` (
    \`token_hash\` varchar(64) NOT NULL,
    \`user_id\` varchar(80) NOT NULL,
    \`expires_at\` varchar(40) NOT NULL,
    \`used_at\` varchar(40) NULL,
    \`created_at\` varchar(40) NOT NULL,
    PRIMARY KEY (\`token_hash\`),
    KEY \`idx_reseller_invitation_user\` (\`user_id\`),
    CONSTRAINT \`fk_reseller_invitation_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`affiliate_referrals\` (
    \`id\` varchar(80) NOT NULL,
    \`user_id\` varchar(80) NOT NULL,
    \`public_code\` varchar(64) NOT NULL,
    \`customer_name\` varchar(120) NOT NULL DEFAULT '',
    \`whatsapp\` varchar(24) NOT NULL,
    \`status\` varchar(30) NOT NULL DEFAULT 'created',
    \`click_count\` int NOT NULL DEFAULT 0,
    \`created_at\` varchar(40) NOT NULL,
    \`updated_at\` varchar(40) NOT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`idx_referrals_code\` (\`public_code\`),
    KEY \`idx_referrals_user_created\` (\`user_id\`,\`created_at\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // These are additive repairs for older Hostinger databases. Nothing is dropped.
  await addMissingColumns("users", userColumns);
  await addMissingColumns("purchases", purchaseColumns);
}

/**
 * Hostinger may launch the Next.js process without executing the custom npm start hook.
 * Operational APIs call this once per server process so BKO and reseller sales can
 * self-heal the additive tables/columns they need instead of rendering a blank portal.
 */
export async function ensureOperationalSchema() {
  const runtime = globalThis as RuntimeSchemaGlobal;
  if (!runtime.__lordnutriOperationalSchema) {
    runtime.__lordnutriOperationalSchema = migrateOperationalSchema().catch((error) => {
      runtime.__lordnutriOperationalSchema = undefined;
      throw error;
    });
  }
  await runtime.__lordnutriOperationalSchema;
}
