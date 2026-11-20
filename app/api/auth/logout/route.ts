import { clearSessionCookie, revokeSession } from "@/lib/auth";
export async function POST(request: Request) { try { await revokeSession(request); } catch {} return Response.json({ ok:true }, { headers:{"set-cookie":clearSessionCookie(request)} }); }
