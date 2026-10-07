"use client";

import { useMemo, useState } from "react";

const format = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function scenario(target: number, expenses: number, days: number, salePrice: number, cost: number) {
  const margin = salePrice - cost;
  const boxes = margin > 0 ? Math.ceil((Math.max(0,target)+Math.max(0,expenses))/margin) : 0;
  return { boxes, perDay: days > 0 ? boxes / days : boxes, result: boxes * margin - expenses };
}

export function ProfitSimulator() {
  const [target, setTarget] = useState(2000);
  const [days, setDays] = useState(26);
  const [salePrice, setSalePrice] = useState(109.9);
  const [expenses, setExpenses] = useState(0);
  const kit20 = useMemo(() => scenario(target, expenses, days, salePrice, 74.9), [target, expenses, days, salePrice]);
  const kit50 = useMemo(() => scenario(target, expenses, days, salePrice, 69.9), [target, expenses, days, salePrice]);

  return (
    <div className="simulator-grid" data-cms-text-protected="1">
      <div className="lnr-sim-fields"><label>Meta mensal de resultado (R$)<input type="number" min="0" step="100" value={target} onChange={(e) => setTarget(Number(e.target.value) || 0)} /></label>
      <label>Dias de venda no mês<input type="number" min="1" max="31" value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} /></label>
      <label>Preço médio por caixa<input type="number" min="0" step="0.01" value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value) || 0)} /></label>
      <label>Despesas estimadas (R$)<input type="number" min="0" step="0.01" value={expenses} onChange={(e) => setExpenses(Number(e.target.value) || 0)} /></label>
      </div>
      <div className="lnr-sim-results">
      <div className="simulator-result"><span>KIT20 · caixas necessárias</span><strong>{kit20.boxes}</strong><small>≈ {kit20.perDay.toFixed(1)} caixa(s)/dia · resultado estimado {format(kit20.result)}</small></div>
      <div className="simulator-result featured"><span>KIT50 · caixas necessárias</span><strong>{kit50.boxes}</strong><small>≈ {kit50.perDay.toFixed(1)} caixa(s)/dia · resultado estimado {format(kit50.result)}</small></div>
      </div>
      <p className="fine-print">Cenário de referência para R$ 10 mil de ganho bruto: 250 caixas vendidas no mês a R$ 109,90, com custo de R$ 69,90 por caixa (KIT50). Frete, taxas, juros, impostos, descontos e outras despesas reduzem o resultado. Vendas e resultados dependem da atuação de cada revendedor.</p>
    </div>
  );
}
