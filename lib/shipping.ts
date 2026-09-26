import { shippingRegions } from "@/lib/shipping-rates";
import { shippingAdditions } from "@/lib/shipping-additions";

export const SHIPPING_PACKAGE = Object.freeze({
  lengthCm: 16,
  widthCm: 19,
  heightCm: 19,
  weightKg: 1,
});

export type ShippingType = "economical" | "express";
export type ShippingOption = {
  id: ShippingType;
  type: string;
  priceCents: number;
  deliveryTime: string;
};

function packagingCostCents(quantity: number) {
  if (quantity <= 0) return 0;
  const mediumBoxesCount = Math.floor(quantity / 6);
  const remainder = quantity % 6;
  let cents = mediumBoxesCount * 90;
  if (remainder > 0) cents += remainder <= 2 ? 70 : 90;
  return cents;
}

export function calculateShipping(cep: string, quantity: number): ShippingOption[] | null {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  const cleanCep = Number(clean);
  const region = shippingRegions.find((item) => cleanCep >= item.cepStart && cleanCep <= item.cepEnd);
  if (!region) return null;

  // Mantém exatamente a regra do checkout institucional: um pacote padrão,
  // acréscimo de embalagem calculado para 1 unidade lógica e pisos mínimos.
  void quantity;
  void SHIPPING_PACKAGE;
  const additionalCents = Math.round((shippingAdditions[1] || 0) * 100);
  const packagingCents = packagingCostCents(1);
  const economicalPureCents = Math.round(Math.max(region.economical, 25.8) * 100);
  const expressPureCents = Math.round(Math.max(region.express, 27.6) * 100);

  return [
    { id: "economical", type: "Correios · Econômica", priceCents: economicalPureCents + additionalCents + packagingCents, deliveryTime: "5 a 12 dias úteis" },
    { id: "express", type: "Correios · Expressa", priceCents: expressPureCents + additionalCents + packagingCents, deliveryTime: "2 a 5 dias úteis" },
  ];
}

export function getShippingOption(cep: string, quantity: number, type: unknown) {
  const options = calculateShipping(cep, quantity);
  if (!options) return null;
  return options.find((option) => option.id === type) || options[0];
}
