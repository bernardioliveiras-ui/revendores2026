const api = "https://api.correios.com.br";
export const validPostalCode = /^[A-Z]{2}\d{9}[A-Z]{2}$/;

export type PostalEvent = { at: string; description: string; stage: "shipped" | "delivered" | null };
type EventInput = { dtHrCriado?: string; descricao?: string; codigo?: string; tipo?: string };
type PostalObject = { codObjeto?: string; eventos?: EventInput[] };

export function correiosConfig() {
  const user = process.env.CORREIOS_USUARIO?.trim();
  const key = process.env.CORREIOS_CODIGO_ACESSO?.trim();
  const contract = process.env.CORREIOS_CONTRATO?.trim();
  return user && key && contract ? { user, key, contract } : null;
}

async function request(path: string, init: RequestInit) {
  const response = await fetch(api + path, { ...init, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Correios HTTP " + response.status);
  return response.json();
}

export async function postalToken() {
  const config = correiosConfig();
  if (!config) throw new Error("Credenciais dos Correios ausentes");
  const dr = process.env.CORREIOS_DR?.trim();
  if (dr && !/^\d{1,2}$/.test(dr)) throw new Error("Superintendência estadual inválida");
  const body = await request("/token/v1/autentica/contrato", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Basic " + Buffer.from(config.user + ":" + config.key).toString("base64") },
    body: JSON.stringify({ numero: config.contract, dr: dr ? Number(dr) : undefined }),
  });
  if (typeof body?.token !== "string" || !body.token) throw new Error("Resposta de autenticação inválida");
  return body.token as string;
}

export function latestPostalEvent(objects: PostalObject[], code: string): PostalEvent | null {
  const object = objects.find(item => item?.codObjeto?.toUpperCase() === code);
  if (!Array.isArray(object?.eventos)) return null;
  const events = object.eventos.filter(event => typeof event?.dtHrCriado === "string" &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(event.dtHrCriado) &&
    Number.isFinite(Date.parse(event.dtHrCriado)) && typeof event.descricao === "string" && event.descricao.trim());
  events.sort((a,b) => Date.parse(b.dtHrCriado!) - Date.parse(a.dtHrCriado!));
  const first = events[0];
  if (!first) return null;
  const description = first.descricao!.trim().slice(0,240);
  const delivered = /^(objeto |encomenda )?entregue ao destinat[aá]rio[.!]?$/i.test(description);
  const shipped = ["PO","RO","DO","OEC"].includes(first.codigo || "") && !/pr[eé][ -]?postagem/i.test(description);
  return { at: first.dtHrCriado!.slice(0,40), description, stage: delivered ? "delivered" : shipped ? "shipped" : null };
}

export async function trackParcel(code: string, token: string) {
  if (!validPostalCode.test(code)) throw new Error("Código de rastreio inválido");
  const body = await request("/srorastro/v1/objetos/" + code + "?resultado=T", {
    headers: { Authorization: "Bearer " + token, Accept: "application/json" },
  });
  if (!Array.isArray(body?.objetos)) throw new Error("Resposta de rastreio inválida");
  return latestPostalEvent(body.objetos, code);
}
