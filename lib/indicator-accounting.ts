export type IndicatorProofRecord={receiptId:string|null;receiptReview:string;status:string};
export function indicatorProofTotals(records:IndicatorProofRecord[]){
 const submitted=records.filter(r=>!!r.receiptId);
 const confirmed=submitted.filter(r=>r.receiptReview==="APROVADO"&&r.status==="COMPROU");
 return {submitted:submitted.length,pending:submitted.filter(r=>r.receiptReview==="PENDENTE").length,
  approved:confirmed.length,rejected:submitted.filter(r=>r.receiptReview==="REJEITADO").length};
}
