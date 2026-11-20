import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession, isAdminEmail, normalizeEmail } from "@/lib/auth";
import { getOptionalEnv } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/passwords";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return Response.json({ error: "Informe e-mail e senha." }, { status: 400 });
    const email = normalizeEmail(payload.email); const password = typeof payload.password === "string" ? payload.password : "";
    if (!email || !password) return Response.json({ error: "Informe e-mail e senha." }, { status: 400 });
    // Serialize attempts on the account row so parallel requests cannot lose
    // increments or authenticate while another request is locking the account.
    const result = await getDb().transaction(async db => {
      let [user] = await db.select().from(users).where(eq(users.email,email)).limit(1).for("update");

      if (!user && isAdminEmail(email)) {
        const bootstrap = getOptionalEnv("ADMIN_BOOTSTRAP_PASSWORD");
        if (bootstrap && password === bootstrap) {
          const now = new Date().toISOString(); const id = crypto.randomUUID();
          await db.insert(users).values({ id, email, name: "BKO MIX10", phone: "", role: "admin", status: "active", passwordHash: await hashPassword(bootstrap), mustChangePassword: 1, failedLoginAttempts: 0, createdAt: now, updatedAt: now });
          [user] = await db.select().from(users).where(eq(users.id,id)).limit(1);
        }
      }
      if (!user || !["admin","reseller","indicator"].includes(user.role) || user.status !== "active") return Response.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
      const now = new Date();
      if (user.lockedUntil && new Date(user.lockedUntil).getTime() > now.getTime()) return Response.json({ error: "Acesso temporariamente bloqueado. Tente novamente em alguns minutos." }, { status: 429 });
      const valid = await verifyPassword(password,user.passwordHash);
      if (!valid) {
        const attempts = (user.failedLoginAttempts || 0)+1; const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(now.getTime()+LOCK_MINUTES*60_000).toISOString() : null;
        await db.update(users).set({ failedLoginAttempts: lockedUntil ? 0 : attempts, lockedUntil, updatedAt: now.toISOString() }).where(eq(users.id,user.id));
        return Response.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
      }
      if (isAdminEmail(email) && user.role === "reseller") {
        await db.update(users).set({ role: "admin", updatedAt: now.toISOString() }).where(eq(users.id, user.id));
        user = { ...user, role: "admin" };
      }
      await db.update(users).set({ failedLoginAttempts:0, lockedUntil:null, updatedAt:now.toISOString() }).where(eq(users.id,user.id));
      return user;
    });
    if (result instanceof Response) return result;
    const cookie = await createSession(result.id,request);
    return Response.json({ authenticated:true, mustChangePassword:Boolean(result.mustChangePassword), role:result.role }, { headers:{ "set-cookie":cookie, "cache-control":"no-store" } });
  } catch (error) { console.error("login_failed",error); return Response.json({ error:"Não foi possível entrar agora." }, { status:500 }); }
}
