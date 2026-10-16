import { createHash, randomBytes } from "node:crypto";

export const INDICATED_STATUSES = ["ENTROU NO LINK", "ESPERANDO NO CARRINHO", "COMPROU"] as const;
export const RECEIPT_REVIEWS = ["PENDENTE", "APROVADO", "REJEITADO"] as const;
export const MANUAL_CASHBACK_STATUSES = ["PENDENTE", "LIBERADO", "PAGO"] as const;
export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;
export const PURCHASE_URL = "https://mix10pro.com.br/lp-v2";
export function cleanText(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
export function cleanPhone(value: unknown) {
  const digits = cleanText(value, 40).replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}
export function validChoice<T extends string>(value: unknown, choices: readonly T[]): value is T {
  return typeof value === "string" && choices.includes(value as T);
}
export function mayMarkBought(review: string, hasReceipt: boolean) {
  return hasReceipt && review === "APROVADO";
}
export function newInvitationToken() { return randomBytes(32).toString("base64url"); }
export function invitationHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function safeReceiptMime(buffer: Buffer): "application/pdf" | "image/jpeg" | "image/png" | null {
  if (buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) return "application/pdf";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  return null;
}
export function clientOwnsIndication(sessionRole: string, sessionId: string, clientUserId: string) {
  return sessionRole === "client_indicated" && sessionId === clientUserId;
}
export function indicatedError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "Acesso não permitido." }, { status: 403 });
  console.error("indicated_access_error", error);
  return Response.json({ error: "Não foi possível concluir a operação." }, { status: 500 });
}
export const privateResponseHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
};
