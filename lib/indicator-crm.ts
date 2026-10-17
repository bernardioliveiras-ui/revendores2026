/** Indicadores operacionais, não integração de pagamentos, WhatsApp ou rastreamento de entrega. */
export type CrmLead={receiptId?:string|null;receiptReview:string;status:string;clickCount?:number|null;shareAttempts?:number|null};
export type CrmStage="confirmed"|"pending"|"rejected"|"reviewed"|"in_progress";
export function crmLeadStage(lead:CrmLead):CrmStage {
 if(lead.receiptId && lead.receiptReview==="APROVADO" && lead.status==="COMPROU")return "confirmed";
 if(lead.receiptId && lead.receiptReview==="REJEITADO")return "rejected";
 if(lead.receiptId && lead.receiptReview==="PENDENTE")return "pending";
 if(lead.receiptId && lead.receiptReview==="APROVADO")return "reviewed";
 return "in_progress";
}
export function crmMetrics(leads:CrmLead[]){
 const count=(stage:CrmStage)=>leads.filter(l=>crmLeadStage(l)===stage).length;
 return {
  generated:leads.length,
  shareIntent:leads.reduce((n,l)=>n+Math.max(0,l.shareAttempts||0),0),
  visits:leads.reduce((n,l)=>n+Math.max(0,l.clickCount||0),0),
  withReceipt:leads.filter(l=>!!l.receiptId).length,
  pending:count("pending"),
  confirmed:count("confirmed"),
  rejected:count("rejected"),
  reviewed:count("reviewed"),
 };
}
