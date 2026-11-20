/** Somente contas sem qualquer histórico operacional podem ser removidas no painel. */
export function resellerDeletionBlockers(counts={}) {
 const labels={purchases:'pedidos vinculados',profiles:'perfil de compra inicial',sales:'vendas registradas',stock:'movimentações de estoque',referrals:'indicações',cashbacks:'cashback ou repasses'};
 return Object.entries(labels).filter(([key])=>Number(counts[key]||0)>0).map(([,label])=>label);
}
