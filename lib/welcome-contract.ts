export function welcomeEndpoint(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function welcomeKey(purchaseId: string, generation = "initial") { return `lordnutri-welcome:${purchaseId}:${generation}`; }
