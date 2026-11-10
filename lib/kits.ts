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
