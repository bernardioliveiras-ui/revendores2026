export const portalRoutes = { admin: "/bko", reseller: "/revendedor", indicator: "/influenciador" } as const;
export type PortalRole = keyof typeof portalRoutes;

export function portalRoute(role: unknown) {
  if (role === "admin" || role === "reseller" || role === "indicator") return portalRoutes[role];
  return "/entrar";
}
