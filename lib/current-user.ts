import { getSessionUser, type SessionUser } from "@/lib/auth";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Autenticação necessária.");
    this.name = "AuthenticationRequiredError";
  }
}

export class OrganizationRequiredError extends Error {
  constructor() {
    super("A arquitetura multi-organização foi desativada nesta versão.");
    this.name = "OrganizationRequiredError";
  }
}

export async function getCurrentUser(request: Request): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) throw new AuthenticationRequiredError();
  return user;
}

export async function getCurrentContext(request: Request) {
  const user = await getCurrentUser(request);
  return { user, membership: null };
}

export async function requireOrganization(request: Request): Promise<never> {
  await getCurrentUser(request);
  throw new OrganizationRequiredError();
}

export function apiErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (
    message.includes("doesn't exist") ||
    message.includes("unknown column") ||
    message.includes("no such table") ||
    message.includes("no such column")
  ) {
    console.error("database_schema_outdated", error);
    return Response.json(
      {
        error:
          "O banco MySQL da plataforma não está com o schema esperado. Em instalação existente, aplique database/migrations/2026-09-18-structural-update.sql na Hostinger; em banco novo, importe database/schema.sql.",
      },
      { status: 503 },
    );
  }
  if (error instanceof AuthenticationRequiredError) {
    return Response.json(
      { error: "Entre com seu acesso individual para continuar." },
      { status: 401 },
    );
  }
  if (error instanceof OrganizationRequiredError) {
    return Response.json({ error: error.message }, { status: 410 });
  }
  return Response.json({ error: fallbackMessage }, { status: 500 });
}
