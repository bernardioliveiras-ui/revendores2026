const resellerKits = new Set(['kit20', 'kit50', 'kit100']);

export function isResellerKitPurchase(purchase) {
  return resellerKits.has(purchase?.kit);
}

export function isInfluencerUnitPurchase(purchase) {
  return purchase?.kit === 'mix10-unit' && typeof purchase.campaignId === 'string' && purchase.campaignId.trim().length > 0;
}

export function isDirectUnitPurchase(purchase) {
  return purchase?.kit === 'mix10-unit' && !isInfluencerUnitPurchase(purchase);
}

/**
 * @template T
 * @param {T[]} purchases
 * @returns {{resellerKits:T[], influencerUnits:T[], directUnits:T[], unknown:T[]}}
 */
export function segmentPurchases(purchases = []) {
  /** @type {{resellerKits:T[], influencerUnits:T[], directUnits:T[], unknown:T[]}} */
  const result = { resellerKits: [], influencerUnits: [], directUnits: [], unknown: [] };
  for (const purchase of purchases) {
    if (isResellerKitPurchase(purchase)) result.resellerKits.push(purchase);
    else if (isInfluencerUnitPurchase(purchase)) result.influencerUnits.push(purchase);
    else if (isDirectUnitPurchase(purchase)) result.directUnits.push(purchase);
    else result.unknown.push(purchase);
  }
  return result;
}

export function countPendingResellerAccess(purchases = []) {
  return purchases.filter(p => isResellerKitPurchase(p) && p.paymentStatus === 'paid' && !!p.asaasVerifiedAt && !p.accessReleasedAt).length;
}
