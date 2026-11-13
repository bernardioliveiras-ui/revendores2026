import { shippingRegions } from "../data/shippingRates";
import { shippingAdditions } from "../data/shippingAdditions";

export const SHIPPING_PACKAGE = Object.freeze({
  lengthCm: 16,
  widthCm: 19,
  heightCm: 19,
  weightKg: 1
});

function getPackagingCost(quantity: number): number {
  if (quantity <= 0) return 0;
  
  let mediumBoxesCount = Math.floor(quantity / 6);
  let remainder = quantity % 6;
  
  let cost = mediumBoxesCount * 0.90;
  
  if (remainder > 0) {
    if (remainder <= 2) {
      cost += 0.70;
    } else {
      cost += 0.90;
    }
  }
  
  return cost;
}

export function calculateShipping(
  cep: string,
  quantity: number
) {
  const cleanCep = Number(cep.replace(/\D/g, ""));

  const region = shippingRegions.find((item) => {
    return cleanCep >= item.cepStart && cleanCep <= item.cepEnd;
  });

  if (!region) {
    console.warn(
      `[SHIPPING_DIAGNOSTIC] Unmatched CEP: "${cep}" (clean: ${cleanCep}). Rule applied: none. Request timestamp: ${new Date().toISOString()}. Request origin: calculateShipping.`
    );
    return null;
  }

  // Use the standard package configuration for the freight calculation
  const packageData = SHIPPING_PACKAGE;

  // The package configuration does not vary according to the kit,
  // so the additions and packaging are evaluated for a single standard package (quantity = 1).
  const additional = shippingAdditions[1] || 0;
  const packagingCost = getPackagingCost(1);
  const totalAdditional = additional + packagingCost;

  // Apply programmatic minimum floor rates for pure shipping
  const economicalPure = Math.max(region.economical, 25.80);
  const expressPure = Math.max(region.express, 27.60);

  return [
    {
      type: "Entrega Econômica",
      price: Number((economicalPure + totalAdditional).toFixed(2)),
      deliveryTime: "5 a 12 dias úteis"
    },
    {
      type: "Entrega Expressa",
      price: Number((expressPure + totalAdditional).toFixed(2)),
      deliveryTime: "2 a 5 dias úteis"
    }
  ];
}
