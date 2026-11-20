"use client";
import { landingText, type LandingTexts } from "@/lib/landing-texts";

import { useMemo, useState } from "react";

const format = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function scenario(target: number, expenses: number, days: number, salePrice: number, cost: number) {
  const margin = salePrice - cost;
  const boxes = margin > 0 ? Math.ceil((Math.max(0,target)+Math.max(0,expenses))/margin) : 0;
  return { boxes, perDay: days > 0 ? boxes / days : boxes, result: boxes * margin - expenses };
}

export function ProfitSimulator({texts={}}:{texts?:LandingTexts}={}) {
  const [target, setTarget] = useState(2000);
  const [days, setDays] = useState(26);
  const [salePrice, setSalePrice] = useState(109.9);
  const [expenses, setExpenses] = useState(0);
  const kit20 = useMemo(() => scenario(target, expenses, days, salePrice, 74.9), [target, expenses, days, salePrice]);
  const kit50 = useMemo(() => scenario(target, expenses, days, salePrice, 69.9), [target, expenses, days, salePrice]);

  return (
    <div className="simulator-grid" data-cms-text-protected="1">
      <div className="lnr-sim-fields"><label>{landingText(texts, "simulador.018")}<input type="number" min="0" step="100" value={target} onChange={(e) => setTarget(Number(e.target.value) || 0)} /></label>
      <label>{landingText(texts, "simulador.019")}<input type="number" min="1" max="31" value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} /></label>
      <label>{landingText(texts, "simulador.020")}<input type="number" min="0" step="0.01" value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value) || 0)} /></label>
      <label>{landingText(texts, "simulador.021")}<input type="number" min="0" step="0.01" value={expenses} onChange={(e) => setExpenses(Number(e.target.value) || 0)} /></label>
      </div>
      <div className="lnr-sim-results">
      <div className="simulator-result"><span>{landingText(texts, "simulador.022")}</span><strong>{kit20.boxes}</strong><small>≈ {kit20.perDay.toFixed(1)} {landingText(texts, "simulador.023")}{format(kit20.result)}</small></div>
      <div className="simulator-result featured"><span>{landingText(texts, "simulador.024")}</span><strong>{kit50.boxes}</strong><small>≈ {kit50.perDay.toFixed(1)} {landingText(texts, "simulador.025")}{format(kit50.result)}</small></div>
      </div>
      <p className="fine-print">{landingText(texts, "simulador.026")}</p>
    </div>
  );
}
