import { requireAdmin } from "@/lib/auth";
import { issueResellerInvitation } from "@/lib/reseller-invitations";
import { privateResponseHeaders } from "@/lib/indicated-security";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const origin = request.headers.get("origin");
    const host = request.headers.get("host") || new URL(request.url).host;
    let parsed: URL;
    try { parsed = new URL(origin || ""); }
    catch { return Response.json({error:"Origem não autorizada."},{status:403,headers:privateResponseHeaders}); }
    const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
    if (parsed.host !== host || !(parsed.protocol === "https:" || (parsed.protocol === "http:" && local)))
      return Response.json({error:"Origem não autorizada."},{status:403,headers:privateResponseHeaders});
    const body = await request.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    if (!userId || userId.length > 80) return Response.json({error:"Revendedor inválido."},{status:400,headers:privateResponseHeaders});
    return Response.json(await issueResellerInvitation(userId),{headers:privateResponseHeaders});
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({error:"Faça login novamente."},{status:401});
    if (error instanceof Error && error.message === "FORBIDDEN") return Response.json({error:"Acesso reservado ao BKO."},{status:403});
    if (error instanceof Error && error.message === "RESELLER_INVITE_FORBIDDEN") return Response.json({error:"Convites estão disponíveis somente para revendedores manuais ativos."},{status:403,headers:privateResponseHeaders});
    console.error("reseller_invitation_failed",error);
    return Response.json({error:"Não foi possível gerar o convite."},{status:500,headers:privateResponseHeaders});
  }
}
