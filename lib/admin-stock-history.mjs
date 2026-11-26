/** Resumo para o BKO: o histórico completo continua em stock_movements. */
export function groupManualStockHistory(rows,limit=5){
  const byUser=new Map();
  for(const row of rows){
    if(!["manual_initial_stock","manual_physical_stock","bko_stock_adjustment","bko_stock_physical_adjustment","manual_shipment_hold","manual_shipment_delivery"].includes(row.referenceType))continue;
    if(!byUser.has(row.userId))byUser.set(row.userId,[]);
    byUser.get(row.userId).push({id:row.id,type:row.type,boxes:row.boxes,notes:row.notes,occurredAt:row.occurredAt});
  }
  for(const [userId,history] of byUser){
    history.sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt));
    byUser.set(userId,history.slice(0,limit));
  }
  return byUser;
}
