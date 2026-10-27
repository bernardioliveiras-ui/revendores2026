import { createHash } from "node:crypto";
import { getMysqlPool } from "@/db";
import { INDICATOR_TERMS_VERSION, indicatorTermsPlainText } from "@/lib/indicator-terms";
let pending:Promise<void>|undefined;
export type TermsAcceptance={id:string;userId:string;version:string;sha256:string;acceptedAt:string;ipAddress:string|null;userAgent:string|null};
export async function ensureIndicatorTermsSchema(){
 if(!pending)pending=(async()=>{
  await getMysqlPool().query(`CREATE TABLE IF NOT EXISTS indicator_terms_acceptances (
    id varchar(80) NOT NULL PRIMARY KEY,
    user_id varchar(80) NOT NULL,
    terms_version varchar(40) NOT NULL,
    terms_sha256 char(64) NOT NULL,
    terms_snapshot longtext NOT NULL,
    accepted_at varchar(40) NOT NULL,
    ip_address varchar(64) NULL,
    user_agent varchar(512) NULL,
    UNIQUE KEY idx_indicator_terms_once (user_id, terms_version),
    KEY idx_indicator_terms_time (accepted_at),
    CONSTRAINT fk_indicator_terms_user FOREIGN KEY (user_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
 })().catch(e=>{pending=undefined;throw e});
 await pending;
}
export function currentTermsHash(){return createHash("sha256").update(indicatorTermsPlainText(),"utf8").digest("hex")}
export async function findTermsAcceptance(userId:string):Promise<TermsAcceptance|null>{
 await ensureIndicatorTermsSchema();
 const [rows]=await getMysqlPool().execute("SELECT id,user_id AS userId,terms_version AS version,terms_sha256 AS sha256,accepted_at AS acceptedAt,ip_address AS ipAddress,user_agent AS userAgent FROM indicator_terms_acceptances WHERE user_id=? AND terms_version=? AND terms_sha256=? LIMIT 1",[userId,INDICATOR_TERMS_VERSION,currentTermsHash()]);
 return (rows as TermsAcceptance[])[0]||null;
}
export async function requireIndicatorTerms(userId:string){if(!await findTermsAcceptance(userId))throw new Error("TERMS_REQUIRED")}
