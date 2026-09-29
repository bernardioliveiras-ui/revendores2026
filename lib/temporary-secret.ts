import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getEnv } from "@/lib/env";

function key() {
  return createHash("sha256").update(getEnv("AUTH_SECRET")).digest();
}

export function encryptTemporarySecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: `${encrypted.toString("base64url")}.${tag.toString("base64url")}`,
    iv: iv.toString("base64url"),
  };
}

export function decryptTemporarySecret(ciphertext: string, ivValue: string) {
  const [encryptedValue, tagValue] = ciphertext.split(".");
  if (!encryptedValue || !tagValue) throw new Error("Segredo temporário inválido.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}
