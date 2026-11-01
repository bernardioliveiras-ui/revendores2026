import { createHash, randomBytes } from "node:crypto";

export function cleanText(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
export function cleanPhone(value: unknown) {
  const digits = cleanText(value, 40).replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}
export function newInvitationToken() { return randomBytes(32).toString("base64url"); }
export function invitationHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function indicatedError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "Acesso não permitido." }, { status: 403 });
  if (message === "TERMS_REQUIRED") return Response.json({ error: "Aceite os Termos do Programa de Indicadores antes de utilizar sua campanha.", code: "TERMS_REQUIRED" }, { status: 403, headers: privateResponseHeaders });
  console.error("indicated_access_error", error);
  return Response.json({ error: "Não foi possível concluir a operação." }, { status: 500 });
}
export const privateResponseHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
};
