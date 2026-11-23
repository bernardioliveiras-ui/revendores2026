import { getMysqlPool } from "@/db";
import type { PoolConnection } from "mysql2/promise";

export type ManualMaterialDecision = {
  action: "grant" | "revoke";
  actorId: string;
  reason: string;
  createdAt: string;
};

let schemaReady: Promise<unknown> | null = null;

/** Tabela independente: nenhuma coluna financeira ou de estoque é alterada. */
export async function ensureManualMaterialAccessTable() {
  if (!schemaReady) {
    schemaReady = getMysqlPool().query(`CREATE TABLE IF NOT EXISTS reseller_material_access_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(80) NOT NULL,
      action VARCHAR(10) NOT NULL,
      actor_id VARCHAR(80) NOT NULL,
      reason VARCHAR(500) NOT NULL,
      proof_reference VARCHAR(200) NOT NULL DEFAULT '',
      created_at VARCHAR(40) NOT NULL,
      KEY idx_material_access_user_event (user_id,id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`).catch(error => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

type SqlReader = Pick<PoolConnection, "execute">;

export async function getManualMaterialDecision(userId: string, connection?: SqlReader): Promise<ManualMaterialDecision | null> {
  if (!userId || userId.length > 80) return null;
  await ensureManualMaterialAccessTable();
  const sql = `SELECT action,actor_id AS actorId,reason,created_at AS createdAt
    FROM reseller_material_access_events WHERE user_id=? ORDER BY id DESC LIMIT 1`;
  const result: unknown = connection ? await connection.execute(sql, [userId]) : await getMysqlPool().execute(sql, [userId]);
  const [rows] = result as [ManualMaterialDecision[]];
  return rows[0] || null;
}

/** Concede acesso somente quando o último evento administrativo o autoriza. */
export async function hasActiveManualMaterialGrant(userId: string): Promise<boolean> {
  const latest = await getManualMaterialDecision(userId);
  return latest?.action === "grant";
}

export async function appendManualMaterialDecision(connection: SqlReader, data: {
  userId: string; action: "grant" | "revoke"; actorId: string; reason: string; proofReference: string;
}) {
  const createdAt = new Date().toISOString();
  await connection.execute(`INSERT INTO reseller_material_access_events
    (user_id,action,actor_id,reason,proof_reference,created_at) VALUES (?,?,?,?,?,?)`,
  [data.userId, data.action, data.actorId, data.reason, data.proofReference, createdAt]);
  return createdAt;
}
