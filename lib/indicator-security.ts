import { cleanText, cleanPhone, privateResponseHeaders, indicatedError } from "@/lib/indicated-security";
export { cleanText, cleanPhone, privateResponseHeaders, indicatedError };
export const INDICATOR_STATUSES=["LINK GERADO","ENTROU NO LINK","ESPERANDO NO CARRINHO","COMPROU"] as const;
export const INDICATOR_CASHBACK_STATUSES=["PENDENTE","LIBERADO","PAGO"] as const;
export const INDICATOR_PURCHASE_URL="https://mix10pro.com.br/lp-v2";
export function indicatorOwnsLead(role:string,id:string,owner:string){return role==="indicator" && id===owner;}
export function validIndicatorStatus(status:unknown){return typeof status==="string" && INDICATOR_STATUSES.some(s=>s===status);}
export function indicatorLink(code:string){return `/i/${encodeURIComponent(code)}`;}
