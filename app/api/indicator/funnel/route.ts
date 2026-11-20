import { requireIndicator } from "@/lib/auth";
import { indicatedError, privateResponseHeaders } from "@/lib/indicator-security";

/** Endpoint antigo mantido com acesso negado para remover exposição de contatos. */
export async function GET(request: Request) {
  try {
    await requireIndicator(request);
    return Response.json({ error: "O atendimento ao cliente é realizado pela equipe LORD NUTRI." },
      { status: 403, headers: privateResponseHeaders });
  } catch (error) { return indicatedError(error); }
}
