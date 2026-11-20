import React, { useState } from "react";
import { Check, ShieldCheck, Truck, Plus, Minus } from "lucide-react";
import { trackSelectKit } from "../../services/tracking";
import { calculateInstallmentPrice } from "../../utils/installmentCalculator";

export const KITS_DATA = [
  {
    id: 1,
    title: "1 Caixa",
    tagline: "Tratamento para 30 dias • Início Imediato",
    price: 109.9,
    originalPrice: 149.9,
    installments: 3,
    installmentValue: 38.85,
    saving: 40,
    savingPercent: 27,
    badge: "⭐ OFERTA ESPECIAL",
    image: "/kit-1.webp",
    freight: "Frete Sob Consulta",
  },
  {
    id: 2,
    title: "3 Caixas",
    tagline: "Mais Vendido • Recomendado",
    price: 229.7,
    originalPrice: 389.7,
    installments: 6,
    installmentValue: 42.39,
    saving: 160,
    savingPercent: 41,
    badge: "⭐ MAIS VENDIDO",
    image: "/kit-3.webp",
    freight: "Frete Grátis",
  },
  {
    id: 3,
    title: "5 Caixas",
    tagline: "Melhor Custo-Benefício • Maior Economia",
    price: 349.7,
    originalPrice: 649.5,
    installments: 10,
    installmentValue: 40.97,
    saving: 299.8,
    savingPercent: 46,
    badge: "🏆 MELHOR CUSTO-BENEFÍCIO",
    image: "/kit-5.webp",
    freight: "Frete Grátis",
  },
];

interface KitSelectorProps {
  onBuy: (id: number, origin: "OfferTop" | "OfferBottom", quantity?: number) => void;
  origin: "OfferTop" | "OfferBottom";
  selectedKitId: number;
  onSelectKit: (id: number) => void;
}

export default function KitSelector({ onBuy, origin, selectedKitId, onSelectKit }: KitSelectorProps) {
  const [quantity, setQuantity] = useState(1);
  const visibleKits = KITS_DATA.filter((kit) => kit.id === 1);
  const selectedKit = visibleKits.find((kit) => kit.id === selectedKitId) || visibleKits[0] || KITS_DATA[0];

  const handleSelectKit = (id: number) => {
    onSelectKit(id);
    trackSelectKit(id, "v3");
  };

  // Dynamic calculations based on unit quantity
  const unitPrice = selectedKit.price;
  const unitOriginalPrice = selectedKit.originalPrice;
  const totalPrice = Math.round(unitPrice * quantity * 100) / 100;
  const totalOriginalPrice = Math.round(unitOriginalPrice * quantity * 100) / 100;
  const totalSaving = Math.round((totalOriginalPrice - totalPrice) * 100) / 100;

  // Max installments: 1 caixa = up to 3x, 2-4 caixas = up to 6x, 5+ caixas = up to 10x
  const maxInst = quantity >= 5 ? 10 : quantity >= 2 ? 6 : 3;
  const installmentCalc = calculateInstallmentPrice(totalPrice, maxInst);
  const displayInstallments = maxInst;
  const displayInstallmentValue = installmentCalc.installmentValue;

  return (
    <div className="w-full flex flex-col gap-3 text-left">
      <div className="flex flex-col gap-2 md:gap-3">
        {visibleKits.map((kit) => {
          const isSelected = kit.id === selectedKitId;

          return (
            <div
              key={kit.id}
              onClick={() => handleSelectKit(kit.id)}
              className={`relative flex flex-col p-3.5 md:p-4.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                isSelected
                  ? "border-emerald-600 bg-emerald-50/40 shadow-md scale-[1.01]"
                  : "border-gray-200/80 bg-white hover:border-emerald-600/40 hover:bg-gray-50/50"
              }`}
            >
              {kit.badge && (
                <span className="absolute -top-2.5 right-4 bg-emerald-700 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  {kit.badge}
                </span>
              )}

              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* Custom radio button */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                      <span className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight whitespace-nowrap">
                        {quantity === 1 ? "1 Caixa" : `${quantity} Caixas`}
                      </span>

                      {/* Seletor de quantidade ao lado da caixa selecionada */}
                      <div
                        className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-0.5 shadow-xs hover:border-emerald-500 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuantity((prev) => Math.max(1, prev - 1));
                          }}
                          disabled={quantity <= 1}
                          className="w-6 h-6 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          aria-label="Diminuir caixas"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black text-gray-900 w-5 text-center text-xs">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuantity((prev) => Math.min(20, prev + 1));
                          }}
                          className="w-6 h-6 rounded-md border border-emerald-600 bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
                          aria-label="Aumentar caixas"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <span className="text-[10px] sm:text-xs text-gray-500 font-medium leading-normal mt-0.5">
                      Tratamento para {30 * quantity} dias • Início Imediato
                    </span>
                  </div>
                </div>

                {/* Price block */}
                <div className="flex flex-col items-end shrink-0 ml-2">
                  <div className="flex items-baseline gap-1 md:gap-1.5 whitespace-nowrap">
                    {totalOriginalPrice > totalPrice && (
                      <span className="text-[10px] md:text-xs text-gray-400 line-through font-medium">
                        R$ {totalOriginalPrice.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    <span className="text-base md:text-xl font-black text-emerald-800">
                      R$ {totalPrice.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <span className="text-[11px] md:text-sm font-bold text-gray-700 whitespace-nowrap">
                    {displayInstallments}x de R$ {displayInstallmentValue.toFixed(2).replace(".", ",")}
                  </span>
                  {selectedKit.savingPercent > 0 && (
                    <span className="text-[9px] md:text-[11px] font-extrabold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md mt-1 uppercase tracking-wide">
                      Poupe {selectedKit.savingPercent}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action CTA Button */}
      <button
        onClick={() => onBuy(selectedKitId, origin, quantity)}
        className="w-full mt-1.5 block rounded-xl bg-[#0d2e1f] hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm uppercase tracking-widest py-3.5 md:py-4.5 text-center shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-95 cursor-pointer"
      >
        Comprar Agora
      </button>

      {/* Offer Summary Review Box */}
      <div className="w-full rounded-2xl bg-gray-50 p-3.5 border border-gray-200/60 flex flex-col gap-1.5 md:gap-2">
        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Você está comprando:
        </span>
        <div className="flex flex-col gap-1 md:gap-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={3} />
            <span>{quantity === 1 ? "1 Caixa" : `${quantity} Caixas`} de MIX10 PRO</span>
          </div>
          {selectedKit.savingPercent > 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={3} />
              <span>Economia garantida de R$ {totalSaving.toFixed(2).replace(".", ",")} ({selectedKit.savingPercent}%)</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2} />
            <span>Envio rápido e seguro para todo o Brasil</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2} />
            <span>Fórmula Premium regularizada e certificada</span>
          </div>
        </div>

        <div className="w-full h-[1px] bg-gray-200/80 my-0.5" />

        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Total da Compra:</span>
          <div className="text-right">
            <div className="text-base font-black text-emerald-800">
              R$ {totalPrice.toFixed(2).replace(".", ",")}
            </div>
            <span className="text-[9px] md:text-[10px] text-gray-500 font-medium">
              Ou em {displayInstallments}x de R$ {displayInstallmentValue.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
