import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { portalRoute, portalRoutes, type PortalRole } from "@/lib/portal-routes";

export async function requirePortalPage(role?: PortalRole) {
  const request = new Request("https://portal.local", { headers: await headers() });
  const user = await getSessionUser(request);
  if (!user) redirect(role ? "/entrar?perfil=" + portalRoutes[role].slice(1) : "/entrar");
  if (user.mustChangePassword) redirect("/trocar-senha");
  if (user.role !== role) redirect(portalRoute(user.role));
}
