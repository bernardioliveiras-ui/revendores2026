import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ensureOperationalSchema } from "@/lib/runtime-schema";

// No external sends here: the BKO sends via WhatsApp or its own mail client.
// Record *only* the operator's explicit confirmation that the message was sent.
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body.purchaseId !== "string" || body.purchaseId.length > 80 ||
        body.confirm !== "CONFIRMO_ENVIO" || !["whatsapp", "email"].includes(body.channel)) {
      return Response.json({ error: "Confirme o envio manual pelo WhatsApp ou e-mail." }, { status: 400 });
    }
    await ensureOperationalSchema();
    return await getDb().transaction(async tx => {
      const [purchase] = await tx.select().from(purchases).where(eq(purchases.id, body.purchaseId)).limit(1).for("update");
      if (!purchase) return Response.json({ error: "Pedido não localizado." }, { status: 404 });
      if (purchase.paymentStatus !== "paid" || !purchase.userId || !purchase.accessReleasedAt || purchase.welcomeStatus === "not_required") {
        return Response.json({ error: "O revendedor ainda não possui acesso liberado." }, { status: 409 });
      }
      if (purchase.welcomeStatus === "sent") return Response.json({ recorded: true, duplicate: true });
      const now = new Date().toISOString();
      await tx.update(purchases).set({ welcomeStatus: "sent", welcomeSentAt: now,
        welcomeSecret: null, welcomeIv: null, updatedAt: now }).where(eq(purchases.id, purchase.id));
      return Response.json({ recorded: true, channel: body.channel, recordedAt: now });
    });
  } catch(error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return Response.json({ error: "Acesso restrito ao BKO." }, { status: 403 });
    console.error("manual_welcome_record_failed");
    return Response.json({ error: "Não foi possível registrar o envio manual." }, { status: 500 });
  }
}
