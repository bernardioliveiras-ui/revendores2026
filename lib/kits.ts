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
