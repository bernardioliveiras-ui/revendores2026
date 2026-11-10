import { and, eq, isNotNull, or } from "drizzle-orm";
import { getDb, getMysqlPool } from "@/db";
import { purchases } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export async function authorizeMaterials(request: Request) {
  const user = await requireSession(request);
  if (user.mustChangePassword) throw new Error("PASSWORD_REQUIRED");
  if (user.role === "admin") return user;
  if (user.role !== "reseller") throw new Error("FORBIDDEN");
  const [purchase] = await getDb().select({ id: purchases.id }).from(purchases).where(and(
    eq(purchases.userId, user.id), eq(purchases.paymentStatus, "paid"),
    or(eq(purchases.kit, "kit20"), eq(purchases.kit, "kit50"), eq(purchases.kit, "kit100")),
    isNotNull(purchases.accessReleasedAt),
  )).limit(1);
  if (!purchase) throw new Error("FORBIDDEN");
  return user;
}

export async function ensureMaterialsTable() {
  await getMysqlPool().query(`CREATE TABLE IF NOT EXISTS reseller_materials (
    id varchar(80) NOT NULL PRIMARY KEY,
    title varchar(180) NOT NULL,
    file_name varchar(255) NOT NULL,
    mime_type varchar(120) NOT NULL,
    size_bytes int NOT NULL,
    file_bytes longblob NOT NULL,
    created_at varchar(40) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}
export function materialError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED") return Response.json({error:"Faça login novamente."},{status:401});
  if (message === "FORBIDDEN" || message === "PASSWORD_REQUIRED") return Response.json({error:"Acesso não autorizado."},{status:403});
  console.error("reseller_materials_failed", error);
  return Response.json({error:"Não foi possível concluir a operação."},{status:500});
}
