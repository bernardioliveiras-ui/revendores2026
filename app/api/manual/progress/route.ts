// Compatibility tombstone: replaces the unsupported organizations-based route
// during GitHub uploads that do not remove files. Original retained in docs/legacy-source.
import { requireSession } from "@/lib/auth";
async function retired(request: Request) {
  try {
    await requireSession(request);
    return Response.json({ error: "Esta rota antiga foi descontinuada. Use o portal LORDNUTRI atualizado.", code: "LEGACY_ROUTE_RETIRED" }, { status: 410 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
    return Response.json({ error: "Não foi possível verificar o acesso." }, { status: 500 });
  }
}
export { retired as GET, retired as POST, retired as PATCH, retired as DELETE };
