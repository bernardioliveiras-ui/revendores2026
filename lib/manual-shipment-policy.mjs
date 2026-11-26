/** Remessas sem pedido financeiro e sem cobrança Asaas. */
export function planManualShipment(boxes) {
  if (typeof boxes !== 'number' || !Number.isSafeInteger(boxes) || boxes < 1 || boxes > 2147483647)
    throw Error('Informe uma quantidade válida de caixas para a remessa.');
  return { boxes, stockCreditMode:'on_delivery', shippingStatus:'separating' };
}

export function planManualDelivery(shipment, confirmedByCorreios=false) {
  if (shipment.shippingStatus === 'delivered') return { creditBoxes:0, delivered:false };
  if (shipment.shippingStatus !== 'shipped' && !(shipment.shippingStatus === 'separating' && confirmedByCorreios)) throw Error('Confirme a postagem antes da entrega.');
  return { creditBoxes:shipment.stockCreditMode === 'on_delivery' && !shipment.stockCreditedAt ? shipment.boxes : 0, delivered:true };
}

export function planLegacySuspension(shipment, currentStock) {
  if (shipment.stockCreditMode !== 'already_in_stock') throw Error('Esta remessa já aguarda recebimento; o estoque não pode ser suspenso de novo.');
  if (shipment.shippingStatus === 'delivered') throw Error('Uma remessa entregue não pode ser suspensa.');
  if (currentStock < shipment.boxes) throw Error('Saldo disponível insuficiente para suspender a remessa antiga. Confira vendas e ajustes antes de continuar.');
  return shipment.boxes;
}
