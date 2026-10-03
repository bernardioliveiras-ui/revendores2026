export function profitScenario(target:number, expenses:number, days:number, price:number, cost:number) {
  const priceCents=Math.round(price*100), costCents=Math.round(cost*100);
  const marginCents=priceCents-costCents;
  if(marginCents<=0) return null;
  const boxes=Math.ceil(Math.round(target*100)/marginCents);
  const grossCents=boxes*marginCents;
  return {boxes, perDay:boxes/days, revenue:boxes*priceCents/100, gross: grossCents/100, result:(grossCents-Math.round(expenses*100))/100};
}
