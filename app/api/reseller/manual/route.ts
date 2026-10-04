import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(request: Request) {
  try {
    const user = await requireSession(request);
    if (user.mustChangePassword) {
      return Response.json({ error: "Atualize sua senha para acessar o material." }, { status: 403, headers: privateHeaders });
    }
    if (user.role !== "admin") {
      const [purchase] = await getDb().select({ id: purchases.id }).from(purchases).where(and(
        eq(purchases.userId, user.id),
        eq(purchases.paymentStatus, "paid"),
        or(eq(purchases.kit, "kit20"), eq(purchases.kit, "kit50")),
        isNotNull(purchases.accessReleasedAt),
      )).limit(1);
      if (!purchase) {
        return Response.json({ error: "Material exclusivo para compradores de kit com pagamento confirmado e acesso liberado." }, { status: 403, headers: privateHeaders });
      }
    }
    const pdf = await readFile(join(process.cwd(), "private", "manual", "Manual_do_Revendedor_LORD_NUTRI.pdf"));
    return new Response(new Uint8Array(pdf), { headers: {
      ...privateHeaders,
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": 'inline; filename="Manual_do_Revendedor_LORD_NUTRI.pdf"',
    } });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHORIZED";
    if (!unauthenticated) console.error("private_manual_unavailable");
    return Response.json({ error: unauthenticated ? "Entre no portal para acessar o material." : "Não foi possível abrir o manual. Tente novamente." }, {
      status: unauthenticated ? 401 : 503, headers: privateHeaders,
    });
  }
}
