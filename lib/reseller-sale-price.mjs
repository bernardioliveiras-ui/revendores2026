/** Preço de venda do revendedor: sempre definido pelo BKO, em centavos. */
export const DEFAULT_RESELLER_SALE_PRICE_CENTS = 10990;

export function validateResellerSalePrice(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Informe o novo preço.');
  const { priceCents, reason } = payload;
  if (!Number.isSafeInteger(priceCents) || priceCents < 1 || priceCents > 1000000) throw new Error('Informe um preço entre R$ 0,01 e R$ 10.000,00.');
  if (typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 240) throw new Error('Informe o motivo da alteração (3 a 240 caracteres).');
  return { priceCents, reason: reason.trim() };
}
