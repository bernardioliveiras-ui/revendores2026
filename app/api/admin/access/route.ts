import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { authSessions, purchases, users } from "@/db/schema";
import { operationalPurchaseFields } from "@/lib/purchase-fields";
import { encryptTemporarySecret } from "@/lib/temporary-secret";
import { provisionPaidPurchase } from "@/lib/access-provisioning";
import { requireAdmin } from "@/lib/auth";
import { generateTemporaryPassword, hashPassword } from "@/lib/passwords";

import { ensureOperationalSchema } from "@/lib/runtime-schema";
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    await ensureOperationalSchema();
    const body = await request.json() as { purchaseId?: unknown; action?: unknown };
    const purchaseId = typeof body.purchaseId === "string" ? body.purchaseId : "";
    const action = body.action === "reset-password" ? "reset-password" : "release";
    if (!purchaseId) return Response.json({ error:"Compra inválida." }, { status:400 });
    const db = getDb();
    const [purchase] = await db.select(operationalPurchaseFields).from(purchases).where(eq(purchases.id,purchaseId)).limit(1);
    if (!purchase) return Response.json({ error:"Compra não encontrada." }, { status:404 });
    if (purchase.paymentStatus !== "paid") return Response.json({ error:"O acesso só pode ser liberado depois do pagamento confirmado." }, { status:409 });

    if (action === "reset-password") {
      if (!purchase.userId) return Response.json({ error:"O acesso ainda não foi liberado." }, { status:409 });
      const password = generateTemporaryPassword();
      const passwordHash=await hashPassword(password);
      const secret=encryptTemporarySecret(password);
      await db.transaction(async tx=>{
        const [locked]=await tx.select(operationalPurchaseFields).from(purchases).where(eq(purchases.id,purchaseId)).limit(1).for("update");
        if(!locked || locked.paymentStatus!=="paid" || !locked.userId)throw new Error("PAYMENT_REQUIRED");
        await tx.update(users).set({passwordHash,mustChangePassword:1,failedLoginAttempts:0,lockedUntil:null,updatedAt:new Date().toISOString()}).where(eq(users.id,locked.userId));
        await tx.delete(authSessions).where(eq(authSessions.userId,locked.userId));
        await tx.update(purchases).set({welcomeSecret:null,welcomeIv:null}).where(eq(purchases.userId,locked.userId));
        await tx.update(purchases).set({welcomeSecret:secret.ciphertext,welcomeIv:secret.iv,welcomeStatus:"pending",welcomeSentAt:null}).where(eq(purchases.id,locked.id));
      });
      return Response.json({ email:purchase.email, password, reset:true });
    }

    const result = await provisionPaidPurchase(purchase.id);
    if (!result.released) return Response.json({ error: "O acesso desta compra já foi liberado." }, { status: 409 });
    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error:"Faça login novamente." }, { status:401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return Response.json({ error:"Acesso restrito ao BKO." }, { status:403 });
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") return Response.json({error:"Já existe um usuário com este e-mail. Use a recuperação de acesso."},{status:409});
    console.error("admin_access_failed",error);
    return Response.json({ error:"Não foi possível liberar o acesso." }, { status:500 });
  }
}
