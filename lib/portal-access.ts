const RESELLER_VIEWS = new Set([
  "overview",
  "orders",
  "movements",
  "referrals",
  "team",
]);

export function isResellerView(view: string) {
  return RESELLER_VIEWS.has(view);
}

export function shouldPromptResellerSetup({
  hasOrganization,
  view,
}: {
  hasOrganization: boolean;
  view: string;
}) {
  return !hasOrganization && isResellerView(view);
}
