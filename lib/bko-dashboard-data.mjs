// Agrega somente fatos confirmados, usando a data de VERIFICAÇÃO pelo Asaas
// para receita e a data do pedido para pendências. Sem crédito presumido.
const saoPaulo = new Intl.DateTimeFormat('en-US', {
  timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit',
});

function dateKey(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = Object.fromEntries(saoPaulo.formatToParts(date).map(p => [p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function shiftDateKey(key, days) {
  const date = new Date(`${key}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0,10);
}

function matchesPeriod(key, period, todayKey) {
  if (!key || key > todayKey) return false;
  if (period === 'all') return true;
  if (period === 'today') return key === todayKey;
  if (period === '7d' || period === '30d') return key >= shiftDateKey(todayKey, period === '7d' ? -6 : -29);
  if (period === 'month') return key.slice(0,7) === todayKey.slice(0,7);
  if (period === 'prev_month') {
    const [year,month] = todayKey.split('-').map(Number);
    const previous = new Date(Date.UTC(year,month-2,15)).toISOString().slice(0,7);
    return key.slice(0,7) === previous;
  }
  return false;
}

function productValue(purchase) {
  const explicit = purchase.productTotalCents;
  const fallback = Number(purchase.totalCents) - Number(purchase.shippingCents ?? 0) - Number(purchase.interestCents ?? 0);
  const cents = explicit == null ? fallback : Number(explicit);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : 0;
}

/** Dados apenas de leitura para os cartões do BKO; nenhum endpoint financeiro é acionado. */
export function buildBkoDashboard(purchases = [], period = '7d', now = new Date()) {
  const today = dateKey(now);
  if (!today) throw new TypeError('Data de referência inválida');
  const verified = purchases.filter(p => p.paymentStatus === 'paid' && p.asaasVerifiedAt
    && matchesPeriod(dateKey(p.asaasVerifiedAt),period,today));
  const pending = purchases.filter(p => p.paymentStatus === 'pending'
    && matchesPeriod(dateKey(p.createdAt),period,today));
  const dates = Array.from({length:7},(_,i) => shiftDateKey(today,i-6));
  const daily = dates.map(day => ({day, cents:verified.filter(p => dateKey(p.asaasVerifiedAt) === day)
    .reduce((total,p) => total + productValue(p),0)}));
  return {
    verifiedCount:verified.length,
    productRevenueCents:verified.reduce((total,p) => total + productValue(p),0),
    pendingCount:pending.length,
    pendingAccessCount:verified.filter(p => !p.accessReleasedAt).length,
    shippingCount:verified.filter(p => !['delivered','cancelled'].includes(p.shippingStatus)).length,
    daily,
  };
}
