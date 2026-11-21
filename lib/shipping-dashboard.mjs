export function shippingCounts(purchases) {
  const paid = purchases.filter(p => p.paymentStatus === 'paid');
  return {
    separating: paid.filter(p => p.shippingStatus === 'separating').length,
    shipped: paid.filter(p => p.shippingStatus === 'shipped').length,
    delivered: paid.filter(p => p.shippingStatus === 'delivered').length,
    withoutLabel: paid.filter(p => p.shippingStatus !== 'delivered' && !p.trackingCode).length,
  };
}

export function filterShippingPurchases(purchases, search) {
  const query=String(search||'').trim().toLocaleLowerCase('pt-BR');
  return purchases.filter(p => !query || [p.orderNumber,p.name,p.city,p.state,p.carrier,p.trackingCode,p.postalEvent]
    .some(value => String(value||'').toLocaleLowerCase('pt-BR').includes(query)));
}
