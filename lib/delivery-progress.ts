export function deliveryProgress(paymentStatus: string, shippingStatus: string) {
  if (paymentStatus !== "paid") return { step: -1, label: paymentStatus === "cancelled" ? "Pedido cancelado" : "Aguardando pagamento" };
  const step = ["separating", "shipped", "delivered"].indexOf(shippingStatus);
  return { step, label: ["Em separação", "Em percurso", "Entregue"][step] || "Pagamento confirmado" };
}
export function canAdvanceShipping(current: string, next: string) {
  const states = ["awaiting_payment", "separating", "shipped", "delivered"];
  return states.includes(current) && states.includes(next) && states.indexOf(next) >= states.indexOf(current);
}
