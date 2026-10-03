"use client";
import { useState } from "react";
import { profitScenario } from "@/lib/profit-scenario";
const money=(v:number)=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function ProfitSimulator(){
 const [target,setTarget]=useState(2000), [days,setDays]=useState(26), [price,setPrice]=useState(109.9), [expenses,setExpenses]=useState(0);
 return <div className="profit-calculator">
  <div className="calculator-inputs"><div className="calculator-form-heading"><span className="eyebrow">SIMULE SEU CENÁRIO</span><h3>Quanto você quer construir por mês?</h3></div>
   <label>Meta de ganho bruto (R$)<input type="number" min="0" max="100000000" step="100" value={target} onChange={e=>setTarget(Math.min(100000000,Math.max(0,Number(e.target.value)||0)))}/></label>
   <label>Dias de venda no mês<input type="number" min="1" max="31" step="1" value={days} onChange={e=>setDays(Math.min(31,Math.max(1,Math.floor(Number(e.target.value)||1))))}/></label>
   <label>Preço por caixa (R$)<input type="number" min="0" max="100000" step="0.01" value={price} onChange={e=>setPrice(Math.min(100000,Math.max(0,Number(e.target.value)||0)))}/></label>
   <label>Despesas no mês (R$)<input type="number" min="0" max="100000000" step="0.01" value={expenses} onChange={e=>setExpenses(Math.min(100000000,Math.max(0,Number(e.target.value)||0)))}/></label>
   <p className="calculator-help">A meta é de ganho bruto. Informe frete, taxas, juros, impostos, descontos e outras despesas para ver quanto restaria no cenário.</p>
  </div>
  <div className="calculator-comparison" aria-live="polite">{([['KIT20',74.9],['KIT50',69.9]] as const).map(([kit,cost])=>{const result=profitScenario(target,expenses,days,price,cost);return <article className="calculator-kit" key={kit}>
   <header><h3>{kit}</h3><span>Custo: {money(cost)} por caixa</span></header>
   {result?<><div className="calculator-volume"><div><span>CAIXAS NO MÊS</span><strong>{result.boxes.toLocaleString('pt-BR')}</strong></div><div><span>RITMO MÉDIO POR DIA</span><strong>{result.perDay.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}</strong><small>em {days} dias de venda</small></div></div>
   <dl><div><dt>Faturamento de referência</dt><dd>{money(result.revenue)}</dd></div><div className="gross-result"><dt>Ganho bruto</dt><dd>{money(result.gross)}</dd></div><div><dt>Despesas informadas</dt><dd>{money(expenses)}</dd></div><div className="net-result"><dt>Após despesas informadas</dt><dd>{money(result.result)}</dd></div></dl></>:<p className="no-margin"><strong>Sem margem</strong>O preço de venda precisa ser maior que o custo por caixa para construir ganho bruto.</p>}
  </article>})}</div>
  <p className="calculator-disclaimer">Estimativa considerando a venda de todas as caixas calculadas. Faturamento é o total das vendas; ganho bruto desconta o custo dos produtos. O resultado final também depende das despesas. Não há garantia de vendas ou renda.</p>
 </div>;
}
