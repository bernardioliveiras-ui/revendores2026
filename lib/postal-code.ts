export type PostalAddress = {postalCode: string; street: string; district: string; city: string; state: string};
export class PostalLookupError extends Error {}

export async function lookupPostalCode(postalCode: string): Promise<PostalAddress | null> {
  if (!/^\d{8}$/.test(postalCode)) return null;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${postalCode}/json/`, {signal: AbortSignal.timeout(6000), next: {revalidate: 86400}});
    if (!response.ok) throw new Error("POSTAL_PROVIDER_UNAVAILABLE");
    const body = await response.json();
    if (body.erro === true || body.erro === "true") return null;
    if (typeof body.localidade !== "string" || typeof body.uf !== "string" || !/^[A-Z]{2}$/.test(body.uf)) throw new Error("INVALID_POSTAL_RESPONSE");
    return {postalCode, street: typeof body.logradouro === "string" ? body.logradouro : "", district: typeof body.bairro === "string" ? body.bairro : "", city: body.localidade, state: body.uf};
  } catch {
    throw new PostalLookupError("A consulta de CEP está indisponível. Tente calcular o frete novamente.");
  }
}
