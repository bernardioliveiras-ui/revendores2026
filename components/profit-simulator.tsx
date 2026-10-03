"use client";
import { useMemo, useState } from "react";
const money=(v:number)=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
function scenario(target:number,expenses:number,days:number,price:number,cost:number){
 const margin=Math.round((price-cost)*100)/100;
 if(margin<=0)return null;
 const boxes=Math.ceil((target+expenses)/margin);
 return {boxes,perDay:boxes/days,result:boxes*margin-expenses};
}
export function ProfitSimulator(){
 const [target,setTarget]=useState(2000);const [days,setDays]=useState(26);const [price,setPrice]=useState(109.9);const [expenses,setExpenses]=useState(0);
 const kit20=useMemo(()=>scenario(target,expenses,days,price,74.9),[target,expenses,days,price]);
 const kit50=useMemo(()=>scenario(target,expenses,days,price,69.9),[target,expenses,days,price]);
 return <div className="simulator"><div className="simulator-fields"><h3>Monte o seu cenário</h3>
 <label>Meta mensal de ganho bruto (R$)<input type="number" min="0" max="100000000" step="100" value={target} onChange={e=>setTarget(Math.min(100000000,Math.max(0,Number(e.target.value)||0)))}/></label>
 <label>Dias de venda no mês<input type="number" min="1" max="31" step="1" value={days} onChange={e=>setDays(Math.min(31,Math.max(1,Math.floor(Number(e.target.value)||1))))}/></label>
 <label>Preço de revenda por caixa (R$)<input type="number" min="0" max="100000" step="0.01" value={price} onChange={e=>setPrice(Math.min(100000,Math.max(0,Number(e.target.value)||0)))}/></label>
 <label>Despesas estimadas (R$)<input type="number" min="0" max="100000000" step="0.01" value={expenses} onChange={e=>setExpenses(Math.min(100000000,Math.max(0,Number(e.target.value)||0)))}/></label>
 <p className="fine-print">Sem despesas, a meta representa ganho bruto. Ao incluir despesas, calculamos as vendas necessárias para cobrir esses custos e ainda alcançar a meta. Inclua frete, taxas, juros, impostos e outros custos.</p></div>
 <div className="simulator-results" aria-live="polite"><span>CAIXAS PARA ATINGIR SUA META</span>{([["KIT20",kit20],["KIT50",kit50]] as const).map(([label,result])=><div className="simulator-result" key={label}><div><span>{label} · {label==="KIT20"?"R$ 74,90":"R$ 69,90"}/caixa</span><strong>{result?result.boxes.toLocaleString("pt-BR"):"—"} <small>{result?"caixas":"sem margem"}</small></strong><small>{result?`≈ ${result.perDay.toLocaleString("pt-BR",{maximumFractionDigits:1,minimumFractionDigits:1})} por dia`:'Preço de venda igual ou menor que o custo.'}</small></div>{result?<div className="simulator-value"><small>Após despesas informadas</small>{money(result.result)}</div>:null}</div>)}
 <p className="fine-print">Estimativa considerando a venda de todas as caixas calculadas e as despesas informadas. Não representa promessa de renda.</p></div></div>;
}
