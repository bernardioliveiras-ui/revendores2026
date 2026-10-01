import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import {
  authLoginCodes,
  invitations,
  memberships,
  users,
} from "@/db/schema";
import {
  AuthConfigurationError,
  createSession,
  hashLoginCode,
  isAdminEmail,
  normalizeEmail,
  safeHashEqual,
} from "@/lib/auth";

function isNativeForm(request: Request) {
  return (request.headers.get("content-type") ?? "").includes(
    "application/x-www-form-urlencoded",
  );
}

function loginErrorRedirect(request: Request, message: string) {
  const target = new URL("/entrar", request.url);
  target.searchParams.set("erro", message);
  return new Response(null, {
    status: 303,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Location: `${target.pathname}${target.search}`,
    },
  });
}

function errorResponse(
  request: Request,
  nativeForm: boolean,
  message: string,
  status: number,
) {
  if (nativeForm) return loginErrorRedirect(request, message);
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const nativeForm = isNativeForm(request);
  try {
    const payload = (nativeForm
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json()) as {
      email?: unknown;
      code?: unknown;
    };
    const email = normalizeEmail(payload.email);
    const code =
      typeof payload.code === "string"
        ? payload.code.replace(/\D/g, "").slice(0, 6)
        : "";
    if (!email || code.length !== 6) {
      return errorResponse(
        request,
        nativeForm,
        "Informe o e-mail e o código de 6 dígitos.",
        400,
      );
    }

    const db = getDb();
    const [loginCode] = await db
      .select()
      .from(authLoginCodes)
      .where(
        and(
          eq(authLoginCodes.email, email),
          isNull(authLoginCodes.consumedAt),
        ),
      )
      .orderBy(desc(authLoginCodes.createdAt))
      .limit(1);
    if (!loginCode || new Date(loginCode.expiresAt).getTime() <= Date.now()) {
      return errorResponse(
        request,
        nativeForm,
        "O código expirou. Solicite um novo código.",
        400,
      );
    }
    if (loginCode.attempts >= 5) {
      return errorResponse(
        request,
        nativeForm,
        "Código bloqueado por excesso de tentativas.",
        429,
      );
    }
    const receivedHash = await hashLoginCode(loginCode.id, email, code);
    if (!safeHashEqual(receivedHash, loginCode.codeHash)) {
      await db
        .update(authLoginCodes)
        .set({ attempts: loginCode.attempts + 1 })
        .where(eq(authLoginCodes.id, loginCode.id));
      return errorResponse(request, nativeForm, "Código incorreto.", 400);
    }

    const now = new Date().toISOString();
    const admin = isAdminEmail(email);
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user) {
      const id = `usr_${crypto.randomUUID()}`;
      await db.insert(users).values({
        id,
        email,
        name: email.split("@")[0] || "Revendedor",
        systemRole: admin ? "admin" : "member",
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    } else {
      await db
        .update(users)
        .set({
          emailVerifiedAt: now,
          systemRole: admin ? "admin" : "member",
          updatedAt: now,
        })
        .where(eq(users.id, user.id));
      [user] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    }
    if (!user) throw new Error("Falha ao criar usuário.");

    const [invite] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          isNull(invitations.acceptedAt),
          gt(invitations.expiresAt, now),
        ),
      )
      .orderBy(desc(invitations.createdAt))
      .limit(1);
    if (invite) {
      await db
        .insert(memberships)
        .values({
          organizationId: invite.organizationId,
          userId: user.id,
          role: invite.role,
          status: "active",
          createdAt: now,
        })
        .onDuplicateKeyUpdate({ set: { role: invite.role, status: "active" } });
      await db
        .update(invitations)
        .set({ acceptedAt: now })
        .where(eq(invitations.id, invite.id));
      await db
        .update(users)
        .set({ onboardingStatus: "complete", updatedAt: now })
        .where(eq(users.id, user.id));
      user = { ...user, onboardingStatus: "complete" };
    }

    const consumed = await db
      .update(authLoginCodes)
      .set({ consumedAt: now })
      .where(
        and(eq(authLoginCodes.id, loginCode.id), isNull(authLoginCodes.consumedAt)),
      );
    const affectedRows = (consumed as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0;
    if (affectedRows === 0) {
      return errorResponse(
        request,
        nativeForm,
        "Este código já foi utilizado.",
        409,
      );
    }

    const sessionCookie = await createSession(user.id, request);
    const headers = new Headers({
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": sessionCookie,
    });
    if (nativeForm) {
      headers.set("Location", "/painel");
      return new Response(null, { status: 303, headers });
    }
    return new Response(
      JSON.stringify({
        authenticated: true,
        needsOnboarding: user.onboardingStatus !== "complete" && !admin,
      }),
      { status: 200, headers },
    );
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      return errorResponse(request, nativeForm, error.message, 503);
    }
    console.error("auth_code_verification_failed", error);
    return errorResponse(
      request,
      nativeForm,
      "Não foi possível confirmar o código de acesso.",
      500,
    );
  }
}
