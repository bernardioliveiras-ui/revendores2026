import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases, resellerProfiles } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { createCheckoutCustomer, createPayment, AsaasRequestError } from "@/lib/asaas";
import { KITS, getKit } from "@/lib/kits";
import { calculateInstallment, calculateShipping, getInstallmentOptions, MAX_CARD_INSTALLMENTS, type PaymentMethod, type ShippingType } from "@/lib/checkout/pricing";
import { ensureOperationalSchema } from "@/lib/runtime-schema";

function clean(value: unknown, max = 180) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function dueDate() { const d = new Date(); d.setUTCDate(d.getUTCDate() + 3); return d.toISOString().slice(0, 10); }
function orderNumber() { return `MIXR${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().slice(0, 4).toUpperCase()}`; }

export async function GET(request: Request) {
  try {
    await ensureOperationalSchema();
    const user = await requireSession(request);
    if (user.role !== "reseller") return Response.json({ error: "Área do revendedor." }, { status: 403 });
    const [profile] = await getDb().select().from(resellerProfiles).where(eq(resellerProfiles.userId, user.id)).limit(1);
    if (!profile) return Response.json({ error: "Endereço do revendedor não encontrado. Fale com o BKO." }, { status: 409 });
    const kits = Object.values(KITS).map((kit) => {
      const shipping = calculateShipping(profile.postalCode, kit.boxes) || [];
      return {
        id: kit.id, label: kit.label, boxes: kit.boxes, productTotalCents: kit.totalCents,
        shipping: shipping.map((option) => ({
          ...option,
          baseCents: kit.totalCents + option.priceCents,
          installments: getInstallmentOptions(kit.totalCents + option.priceCents, MAX_CARD_INSTALLMENTS),
        })),
      };
    });
    return Response.json({ postalCode: profile.postalCode, kits }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
    console.error("replenishment_quote_failed", error);
    return Response.json({ error: "Não foi possível preparar a reposição." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let purchaseId = "";
  try {
    await ensureOperationalSchema();
    const user = await requireSession(request);
    if (user.role !== "reseller") return Response.json({ error: "Área do revendedor." }, { status: 403 });
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return Response.json({ error: "Dados inválidos." }, { status: 400 });
    const kit = getKit(body.kit);
    if (!kit) return Response.json({ error: "Escolha um kit válido." }, { status: 400 });
    const shippingType = clean(body.shippingType, 20) as ShippingType;
    const paymentMethod = clean(body.paymentMethod, 20) as PaymentMethod;
    if (!(shippingType === "economical" || shippingType === "express")) return Response.json({ error: "Escolha o frete." }, { status: 400 });
    if (!(paymentMethod === "pix" || paymentMethod === "credit")) return Response.json({ error: "Escolha a forma de pagamento." }, { status: 400 });
    let installments = paymentMethod === "pix" ? 1 : Number(body.installments);
    if (!Number.isInteger(installments) || installments < 1 || installments > MAX_CARD_INSTALLMENTS) return Response.json({ error: `Escolha entre 1 e ${MAX_CARD_INSTALLMENTS} parcelas.` }, { status: 400 });
    if (paymentMethod === "pix") installments = 1;

    const db = getDb();
    const [profile] = await db.select().from(resellerProfiles).where(eq(resellerProfiles.userId, user.id)).limit(1);
    if (!profile) return Response.json({ error: "Endereço do revendedor não encontrado. Fale com o BKO." }, { status: 409 });
    const shippingOptions = calculateShipping(profile.postalCode, kit.boxes);
    const shipping = shippingOptions?.find((item) => item.id === shippingType);
    if (!shipping) return Response.json({ error: "Não foi possível calcular o frete para o seu CEP." }, { status: 422 });
    const baseCents = kit.totalCents + shipping.priceCents;
    const payment = calculateInstallment(baseCents, installments);
    const now = new Date().toISOString();
    purchaseId = crypto.randomUUID();
    const number = orderNumber();

    await db.insert(purchases).values({
      id: purchaseId, orderNumber: number,
      name: user.name, email: user.email, phone: user.phone || "",
      cpfCnpj: profile.cpfCnpj, postalCode: profile.postalCode, street: profile.street, number: profile.number,
      complement: profile.complement, district: profile.district, city: profile.city, state: profile.state,
      kit: kit.id, boxes: kit.boxes, unitPriceCents: kit.unitPriceCents, productTotalCents: kit.totalCents,
      shippingType, shippingCents: shipping.priceCents, paymentMethod, installments,
      installmentValueCents: payment.installmentValueCents, interestCents: payment.interestCents, totalCents: payment.chargedValueCents,
      paymentStatus: "payment_pending", shippingStatus: "awaiting_payment",
      userId: user.id, accessReleasedAt: now, welcomeStatus: "not_required",
      landingPage: "/painel#reposicao", createdAt: now, updatedAt: now,
    });

    const customer = await createCheckoutCustomer({ purchaseId, name: user.name, cpfCnpj: profile.cpfCnpj, email: user.email, phone: user.phone || "" });
    const asaasPayment = await createPayment({ customerId: customer.id, purchaseId, orderNumber: number, valueCents: payment.chargedValueCents, billingType: paymentMethod === "pix" ? "PIX" : "CREDIT_CARD", installments, dueDate: dueDate() });
    if (!asaasPayment.id || !asaasPayment.invoiceUrl) throw new Error("O Asaas não retornou o link de pagamento.");
    await db.update(purchases).set({ asaasCustomerId: customer.id, asaasPaymentId: asaasPayment.id, asaasInvoiceUrl: asaasPayment.invoiceUrl, updatedAt: new Date().toISOString() }).where(eq(purchases.id, purchaseId));
    return Response.json({ invoiceUrl: asaasPayment.invoiceUrl, orderNumber: number });
  } catch (error) {
    if (purchaseId) {
      try { await getDb().update(purchases).set({ paymentStatus: "payment_error", updatedAt: new Date().toISOString() }).where(eq(purchases.id, purchaseId)); } catch { /* preserve original */ }
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Faça login novamente." }, { status: 401 });
    if (error instanceof AsaasRequestError) return Response.json({ error: error.message }, { status: error.status });
    console.error("replenishment_checkout_failed", error);
    return Response.json({ error: "Não foi possível gerar a reposição agora." }, { status: 500 });
  }
}
