import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases, resellerProfiles, stockMovements, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { generateTemporaryPassword, hashPassword } from "@/lib/passwords";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json() as { purchaseId?: unknown; action?: unknown };
    const purchaseId = typeof body.purchaseId === "string" ? body.purchaseId : "";
    const action = body.action === "reset-password" ? "reset-password" : "release";
    if (!purchaseId) return Response.json({ error:"Compra inválida." }, { status:400 });
    const db = getDb();
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id,purchaseId)).limit(1);
    if (!purchase) return Response.json({ error:"Compra não encontrada." }, { status:404 });
    if (purchase.paymentStatus !== "paid") return Response.json({ error:"O acesso só pode ser liberado depois do pagamento confirmado." }, { status:409 });

    if (action === "reset-password") {
      if (!purchase.userId) return Response.json({ error:"O acesso ainda não foi liberado." }, { status:409 });
      const password = generateTemporaryPassword();
      await db.update(users).set({ passwordHash:await hashPassword(password), mustChangePassword:1, failedLoginAttempts:0, lockedUntil:null, updatedAt:new Date().toISOString() }).where(eq(users.id,purchase.userId));
      return Response.json({ email:purchase.email, password, reset:true });
    }

    if (purchase.userId || purchase.accessReleasedAt) return Response.json({ error:"O acesso desta compra já foi liberado." }, { status:409 });
    const [existing] = await db.select({ id:users.id }).from(users).where(eq(users.email,purchase.email)).limit(1);
    if (existing) return Response.json({ error:"Já existe um usuário com este e-mail. Use outro e-mail ou o reset de senha." }, { status:409 });

    const password = generateTemporaryPassword();
    const hash = await hashPassword(password);
    const now = new Date().toISOString();
    const userId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(users).values({ id:userId, email:purchase.email, name:purchase.name, phone:purchase.phone, role:"reseller", status:"active", passwordHash:hash, mustChangePassword:1, failedLoginAttempts:0, createdAt:now, updatedAt:now });
      await tx.insert(resellerProfiles).values({ id:crypto.randomUUID(), userId, purchaseId:purchase.id, cpfCnpj:purchase.cpfCnpj, companyTradeName:purchase.companyTradeName, stateRegistration:purchase.stateRegistration, municipalRegistration:purchase.municipalRegistration, postalCode:purchase.postalCode, street:purchase.street, number:purchase.number, complement:purchase.complement, district:purchase.district, city:purchase.city, state:purchase.state, initialKit:purchase.kit, initialBoxes:purchase.boxes, createdAt:now });
      await tx.insert(stockMovements).values({ id:crypto.randomUUID(), userId, type:"entry", boxes:purchase.boxes, referenceType:"initial_purchase", referenceId:purchase.id, notes:`Estoque inicial ${purchase.kit.toUpperCase()}`, occurredAt:now, createdAt:now });
      await tx.update(purchases).set({ userId, accessReleasedAt:now, updatedAt:now }).where(eq(purchases.id,purchase.id));
    });
    return Response.json({ released:true, email:purchase.email, password, userId });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error:"Faça login novamente." }, { status:401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return Response.json({ error:"Acesso restrito ao BKO." }, { status:403 });
    console.error("admin_access_failed",error);
    return Response.json({ error:"Não foi possível liberar o acesso." }, { status:500 });
  }
}
