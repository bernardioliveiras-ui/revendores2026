import { getSessionUser } from "@/lib/auth";
export async function GET(request: Request) { try { const user = await getSessionUser(request); return Response.json(user ? { authenticated:true, user } : { authenticated:false }, { headers:{"cache-control":"no-store"} }); } catch { return Response.json({ authenticated:false }, { headers:{"cache-control":"no-store"} }); } }
