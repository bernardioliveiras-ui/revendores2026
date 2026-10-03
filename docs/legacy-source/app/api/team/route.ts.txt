import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { invitations, memberships, users } from "@/db/schema";
import { apiErrorResponse, requireOrganization } from "@/lib/current-user";

export async function GET(request: Request) {
  try {
    const { membership } = await requireOrganization(request);
    const db = getDb();
    const [members, pendingInvites] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          status: memberships.status,
          role: memberships.role,
          joinedAt: memberships.createdAt,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(eq(memberships.organizationId, membership.organization.id)),
      db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.organizationId, membership.organization.id),
            isNull(invitations.acceptedAt),
            gt(invitations.expiresAt, new Date().toISOString()),
          ),
        )
        .orderBy(desc(invitations.createdAt)),
    ]);
    return Response.json({ members, invitations: pendingInvites });
  } catch (error) {
    return apiErrorResponse(error, "Não foi possível carregar a equipe.");
  }
}

export async function POST() {
  return Response.json(
    { error: "Convites de multiusuário estão desativados nesta versão." },
    { status: 410 },
  );
}

export async function PATCH(request: Request) {
  try {
    const { user, membership } = await requireOrganization(request);
    if (membership.role !== "owner") {
      return Response.json(
        { error: "Somente o proprietário pode alterar acessos." },
        { status: 403 },
      );
    }
    const payload = (await request.json()) as {
      userId?: unknown;
      status?: unknown;
    };
    const targetUserId =
      typeof payload.userId === "string" ? payload.userId.trim() : "";
    const status = payload.status === "active" ? "active" : "disabled";
    if (!targetUserId || targetUserId === user.id) {
      return Response.json(
        { error: "Não é possível alterar o próprio acesso por aqui." },
        { status: 400 },
      );
    }
    await getDb()
      .update(memberships)
      .set({ status })
      .where(
        and(
          eq(memberships.organizationId, membership.organization.id),
          eq(memberships.userId, targetUserId),
        ),
      );
    return Response.json({ updated: true });
  } catch (error) {
    return apiErrorResponse(error, "Não foi possível alterar o acesso.");
  }
}
