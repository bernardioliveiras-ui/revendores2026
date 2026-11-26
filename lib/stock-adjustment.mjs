const MAX_BOXES = 2147483647;

/** Correções definem um saldo total, nunca a quantidade a acrescentar. */
export function validateStockCorrection(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {error:"Dados inválidos."};
  const userId=typeof body.userId==="string"?body.userId.trim():"";
  const reason=typeof body.reason==="string"?body.reason.trim().replace(/\s+/g," "):"";
  if (!userId || userId.length>80) return {error:"Selecione um revendedor válido."};
  if (typeof body.desiredStock!=="number"||!Number.isSafeInteger(body.desiredStock)||body.desiredStock<0||body.desiredStock>MAX_BOXES)
    return {error:"Informe o estoque total em caixas inteiras, de 0 a 2.147.483.647."};
  if (typeof body.expectedStock!=="number"||!Number.isSafeInteger(body.expectedStock)||body.expectedStock<0||body.expectedStock>MAX_BOXES)
    return {error:"Saldo-base inválido. Atualize o BKO antes de corrigir."};
  if(reason.length<3||reason.length>500)return {error:"Informe o motivo do ajuste (3 a 500 caracteres)."};
  return {value:{userId,desiredStock:body.desiredStock,expectedStock:body.expectedStock,reason}};
}

/**
 * @param {number} current
 * @param {number} desired
 * @param {string} reason
 * @param {string} actorId
 * @returns {{changed:false,stock:number}|{changed:true,type:"adjustment_in"|"adjustment_out",boxes:number,stock:number,notes:string}}
 */
export function planStockCorrection(current,desired,reason,actorId){
  if(current===desired)return {changed:false,stock:current};
  return {
    changed:true,
    type:desired>current?"adjustment_in":"adjustment_out",
    boxes:Math.abs(desired-current),
    stock:desired,
    notes:`Ajuste de estoque pelo BKO ${actorId} · ${reason}`,
  };
}
