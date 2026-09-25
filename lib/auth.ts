import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { authSessions, users } from "@/db/schema";
import { getOptionalEnv } from "@/lib/env";

const SESSION_COOKIE = "mix10_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

export type SessionUser = { id: string; email: string; name: string; role: "admin" | "reseller"; mustChangePassword: boolean };

function secret() {
  const value = getOptionalEnv("AUTH_SECRET");
  if (!value || value.length < 32) throw new Error("AUTH_SECRET precisa ter pelo menos 32 caracteres.");
  return value;
}
function bytesToHex(bytes: ArrayBuffer) { return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2,"0")).join(""); }
function randomToken() { const b = crypto.getRandomValues(new Uint8Array(32)); return Buffer.from(b).toString("base64url"); }
async function keyedHash(purpose: string, value: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  return bytesToHex(await crypto.subtle.sign("HMAC", key, enc.encode(`${purpose}:${value}`)));
}
function cookieValue(request: Request, name: string) {
  for (const item of (request.headers.get("cookie") || "").split(";")) {
    const i = item.indexOf("="); if (i < 0) continue;
    if (item.slice(0,i).trim() === name) return decodeURIComponent(item.slice(i+1).trim());
  }
  return null;
}
function secureSuffix(request: Request) { const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(request.url).protocol.replace(":",""); return proto === "https" ? "; Secure" : ""; }


export function safeHashEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i += 1) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}
export function normalizeEmail(value: unknown) { const e = typeof value === "string" ? value.trim().toLowerCase() : ""; return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null; }
export function isAdminEmail(email: string) { return (getOptionalEnv("ADMIN_EMAILS") || "").split(/[;,\n]/).map(v=>v.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase()); }

export async function createSession(userId: string, request: Request) {
  const token = randomToken(); const now = new Date(); const expiresAt = new Date(now.getTime()+SESSION_DURATION_SECONDS*1000).toISOString();
  await getDb().insert(authSessions).values({ tokenHash: await keyedHash("session",token), userId, expiresAt, createdAt: now.toISOString(), lastSeenAt: now.toISOString() });
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Priority=High; Max-Age=${SESSION_DURATION_SECONDS}${secureSuffix(request)}`;
}
export async function getSessionUser(request: Request): Promise<SessionUser|null> {
  const token = cookieValue(request, SESSION_COOKIE); if (!token) return null;
  const [row] = await getDb().select({ id: users.id, email: users.email, name: users.name, role: users.role, mustChangePassword: users.mustChangePassword }).from(authSessions).innerJoin(users, eq(users.id,authSessions.userId)).where(and(eq(authSessions.tokenHash, await keyedHash("session",token)),gt(authSessions.expiresAt,new Date().toISOString()),eq(users.status,"active"))).limit(1);
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role === "admin" ? "admin" : "reseller", mustChangePassword: Boolean(row.mustChangePassword) };
}
export async function requireSession(request: Request) { const user = await getSessionUser(request); if (!user) throw new Error("UNAUTHORIZED"); return user; }
export async function requireAdmin(request: Request) { const user = await requireSession(request); if (user.role !== "admin") throw new Error("FORBIDDEN"); return user; }
export async function revokeSession(request: Request) { const token = cookieValue(request,SESSION_COOKIE); if (token) await getDb().delete(authSessions).where(eq(authSessions.tokenHash,await keyedHash("session",token))); }
export function clearSessionCookie(request: Request) { return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureSuffix(request)}`; }
