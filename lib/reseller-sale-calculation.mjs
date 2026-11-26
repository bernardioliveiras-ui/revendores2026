/** Prévia é só informativa. O servidor recalcula tudo de forma autoritativa. */
export function salePreview({ available, boxes, unitPriceCents }) {
  if (!Number.isSafeInteger(available) || !Number.isSafeInteger(boxes) || !Number.isSafeInteger(unitPriceCents) || available < 0 || boxes < 1 || boxes > available || unitPriceCents < 1 || boxes * unitPriceCents > 2147483647) {
    return { valid: false, remaining: available, totalCents: 0 };
  }
  return { valid: true, remaining: available - boxes, totalCents: boxes * unitPriceCents };
}
