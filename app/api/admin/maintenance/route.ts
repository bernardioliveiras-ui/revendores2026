import { getMysqlPool } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { privateResponseHeaders, indicatedError } from "@/lib/indicator-security";

export const runtime = "nodejs";
/** Somente prévia, SEM rota destrutiva via navegador. */
const commercialTables = [
  "indicator_terms_acceptances","affiliate_cashbacks","indicator_receipts","indicator_leads",
  "indicated_receipts","indicated_clients","indicated_invitations","indicator_campaigns",
  "indicator_profiles","affiliate_clicks","affiliate_referrals","measurement_outbox",
  "purchase_measurement","reseller_profiles","stock_movements","sales","asaas_events",
  "purchases","auth_sessions"
] as const;

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const pool=getMysqlPool();
    const [tables]=await pool.query("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'");
    const existing=new Set((tables as Array<{name:string}>).map(row=>row.name));
    const counts:Record<string,number>={};
    for(const table of commercialTables){
      if(!existing.has(table))continue;
      const [rows]=await pool.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
      counts[table]=Number((rows as Array<{n:number}>)[0]?.n||0);
    }
    const [users]=await pool.query("SELECT role, COUNT(*) AS n FROM users GROUP BY role");
    const usersByRole:Record<string,number>={};
    for(const row of users as Array<{role:string;n:number}>)usersByRole[row.role]=Number(row.n);
    return Response.json({counts,usersByRole,generatedAt:new Date().toISOString(),mode:"preview_only",note:"Nenhum dado apagado. A limpeza real só pode ser executada no servidor após backup."},{headers:privateResponseHeaders});
  } catch(error){return indicatedError(error)}
}
