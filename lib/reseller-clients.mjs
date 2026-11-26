/** Retorna o telefone brasileiro sem DDI ou vazio se não for discável. */
export function normalizeCustomerPhone(input) {
  if(typeof input!=='string')return '';
  let digits=input.replace(/\D/g,'');
  if(digits.startsWith('55')&&(digits.length===12||digits.length===13))digits=digits.slice(2);
  if(!/^[1-9][0-9]{9,10}$/.test(digits))return '';
  if(!/^(?:1[1-9]|2[12478]|3[1-8]|4[1-9]|5[1345]|6[1-9]|7[134579]|8[1-9]|9[1-9])$/.test(digits.slice(0,2)))return '';
  return digits;
}

/** Projeção de contatos: não cria cadastros, apenas resume vendas existentes. */
export function buildResellerClients(sales) {
  const clients=new Map();
  for(const sale of sales){
    const phone=normalizeCustomerPhone(sale.customerPhone);
    const name=typeof sale.customerName==='string'?sale.customerName.trim():'';
    if(!phone||!name)continue;
    const soldAt=typeof sale.soldAt==='string'?sale.soldAt:'';
    const existing=clients.get(phone);
    const boxes=Number.isSafeInteger(sale.boxes)&&sale.boxes>0?sale.boxes:0;
    if(existing){
      existing.salesCount++;
      existing.totalBoxes+=boxes;
      if(soldAt>existing.lastSoldAt){existing.lastSoldAt=soldAt;existing.name=name;}
    }else{
      clients.set(phone,{name,phone,salesCount:1,totalBoxes:boxes,lastSoldAt:soldAt,whatsappUrl:`https://wa.me/55${phone}`});
    }
  }
  return [...clients.values()].sort((a,b)=>b.lastSoldAt.localeCompare(a.lastSoldAt));
}
