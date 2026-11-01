/**
 * A permanent removal from the BKO is reserved for disposable indicator records.
 * Paid orders, even if they are manually marked, must never be deleted through the UI.
 * Bulk commercial-data resets use the separate backup-first maintenance script.
 */
export function indicatorDeletionBlockers({purchases=0,affiliateReferrals=0,affiliateCashbacks=0,resellerProfiles=0,sales=0,stockMovements=0,indicatorReceipts=0,indicatedReceipts=0,financialLeads=0,financialIndications=0}={}) {
 const rows=[
  [purchases,'pedidos vinculados'],
  [affiliateReferrals,'indicações comerciais antigas'],
  [affiliateCashbacks,'cashback/repasse registrado'],
  [resellerProfiles,'cadastro de revendedor'],
  [sales,'vendas do revendedor'],
  [stockMovements,'movimentações de estoque'],
  [indicatorReceipts,'comprovantes do indicador'],
  [indicatedReceipts,'comprovantes de clientes'],
  [financialLeads,'indicações com situação financeira'],
  [financialIndications,'clientes com situação financeira'],
 ];
 return rows.filter(([count])=>Number(count)>0).map(([,label])=>label);
}
