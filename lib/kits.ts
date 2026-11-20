export const KITS = {
  kit20: {
    id: "kit20",
    label: "KIT20",
    boxes: 20,
    unitPriceCents: 7490,
    totalCents: 149800,
    positioning: "Menor investimento inicial",
  },
  kit50: {
    id: "kit50",
    label: "KIT50",
    boxes: 50,
    unitPriceCents: 6990,
    totalCents: 349500,
    positioning: "Melhor custo por unidade",
  },
} as const;

export const RETAIL_SKU = "mix10-unit";
export const RETAIL_UNIT_CENTS = 10990;
export const MAX_RETAIL_BOXES = 5;
export function getRetailProduct(quantity: unknown) {
  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_RETAIL_BOXES) return null;
  return { id: RETAIL_SKU, label: "MIX10 PRO", boxes: quantity, unitPriceCents: RETAIL_UNIT_CENTS, totalCents: RETAIL_UNIT_CENTS * quantity };
}

export type KitId = keyof typeof KITS;

export function getKit(value: unknown) {
  if (value === "kit20" || value === "kit50") return KITS[value];
  return null;
}

// Kit exclusivo para reposição no portal; não alterar os kits públicos da landing page.
export const REPLENISHMENT_KITS = {
  ...KITS,
  kit100: { id: "kit100", label: "KIT100", boxes: 100, unitPriceCents: 6790, totalCents: 679000, positioning: "Reposição de 100 unidades" },
} as const;
export function getReplenishmentKit(value: unknown) {
  if (value === "kit20" || value === "kit50" || value === "kit100") return REPLENISHMENT_KITS[value];
  return null;
}
