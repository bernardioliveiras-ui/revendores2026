/** Public addresses only. Never use this slug to identify a financial attribution. */
export function campaignSlug(name) {
  const normalized = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 85)
    .replace(/-+$/g, '');
  const base = normalized || 'campanha';
  return /^[a-f0-9]{32}$/.test(base) ? `${base}-campanha` : base;
}

export function reserveCampaignSlugs(campaigns) {
  // Existing published addresses have priority, including after a campaign rename.
  const reserved = new Set(campaigns.map(row => row.publicSlug).filter(Boolean));
  const updates = [];
  for (const row of campaigns) {
    if (row.publicSlug) continue;
    const base = campaignSlug(row.name);
    let candidate = base;
    for (let n = 2; reserved.has(candidate); n++) candidate = `${base}-${n}`;
    reserved.add(candidate);
    updates.push({id:row.id,slug:candidate});
  }
  return updates;
}
