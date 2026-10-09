import { capturePurchaseMeasurement } from "@/lib/purchase-measurement";
import { lookupPostalCode, PostalLookupError } from "@/lib/postal-code";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { createCheckoutCustomer, createPayment, AsaasRequestError } from "@/lib/asaas";
import { getKit } from "@/lib/kits";
import { calculateInstallment, calculateShipping, MAX_CARD_INSTALLMENTS, type PaymentMethod, type ShippingType } from "@/lib/checkout/pricing";

function clean(value: unknown, max = 180) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function digits(value: unknown, max = 20) { return clean(value, 40).replace(/\D/g, "").slice(0, max); }
function email(value: unknown) { const result = clean(value, 254).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result) ? result : ""; }
function landingPage(request: Request) {
  try {
    const url = new URL(request.headers.get("referer") || "");
    return ["http:", "https:"].includes(url.protocol) ? `${url.origin}${url.pathname}`.slice(0, 500) : "";
  } catch { return ""; }
}
function dueDate() { const d = new Date(); d.setUTCDate(d.getUTCDate() + 3); return d.toISOString().slice(0, 10); }
function orderNumber() { return `MIX${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().slice(0, 4).toUpperCase()}`; }

export async function POST(request: Request) {
  let purchaseId = "";
  try {
    const payload = await request.json().catch(()=>null) as Record<string, unknown> | null;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return Response.json({error:"Dados inválidos."},{status:400});
    const kit = getKit(payload.kit);
    const data = {
      name: clean(payload.name, 120), email: email(payload.email), phone: digits(payload.phone, 15), cpfCnpj: digits(payload.cpfCnpj, 14),
      postalCode: digits(payload.postalCode, 8), street: clean(payload.street, 220), number: clean(payload.number, 32), complement: clean(payload.complement, 160),
      district: clean(payload.district, 120), city: clean(payload.city, 120), state: clean(payload.state, 2).toUpperCase(),
    };
    if (!kit || !data.name || !data.email || data.phone.length < 10 || ![11,14].includes(data.cpfCnpj.length) || data.postalCode.length !== 8 || !data.street || !data.number || !data.district || !data.city || data.state.length !== 2 || payload.acceptedTerms !== "yes") {
      return Response.json({ error: "Confira seus dados e aceite os termos para continuar." }, { status: 400 });
    }

    const shippingType = clean(payload.shippingType, 20) as ShippingType;
    const paymentMethod = clean(payload.paymentMethod, 20) as PaymentMethod;
    if (!(["economical", "express"] as string[]).includes(shippingType)) {
      return Response.json({ error: "Escolha uma modalidade de frete válida." }, { status: 400 });
    }
    if (!(["pix", "credit"] as string[]).includes(paymentMethod)) {
      return Response.json({ error: "Escolha uma forma de pagamento válida." }, { status: 400 });
    }

    const address = await lookupPostalCode(data.postalCode);
    if (!address) return Response.json({error:"CEP não encontrado."},{status:422});
    if (address.state !== data.state) return Response.json({error:"A UF deve corresponder ao CEP informado."},{status:400});
    const shippingOptions = calculateShipping(data.postalCode, kit.boxes);
    const shipping = shippingOptions?.find((item) => item.id === shippingType);
    if (!shipping) return Response.json({ error: "Não foi possível calcular o frete para esse CEP." }, { status: 422 });

    let installments = paymentMethod === "pix" ? 1 : Number(payload.installments);
    if (!Number.isInteger(installments) || installments < 1 || installments > MAX_CARD_INSTALLMENTS) {
      return Response.json({ error: `Escolha entre 1 e ${MAX_CARD_INSTALLMENTS} parcelas.` }, { status: 400 });
    }
    if (paymentMethod === "pix") installments = 1;

    const baseCents = kit.totalCents + shipping.priceCents;
    const payment = calculateInstallment(baseCents, installments);
    const chargedTotalCents = payment.chargedValueCents;

    const now = new Date().toISOString();
    purchaseId = crypto.randomUUID();
    const number = orderNumber();
    const db = getDb();
    await db.insert(purchases).values({
      id: purchaseId, orderNumber: number, ...data,
      kit: kit.id, boxes: kit.boxes, unitPriceCents: kit.unitPriceCents,
      productTotalCents: kit.totalCents,
      shippingType,
      shippingCents: shipping.priceCents,
      paymentMethod,
      installments,
      installmentValueCents: payment.installmentValueCents,
      interestCents: payment.interestCents,
      totalCents: chargedTotalCents,
      paymentStatus: "payment_pending", shippingStatus: "awaiting_payment",
      utmSource: clean(payload.utmSource, 120), utmMedium: clean(payload.utmMedium, 120), utmCampaign: clean(payload.utmCampaign, 180), utmContent: clean(payload.utmContent, 180), landingPage: landingPage(request),
      createdAt: now, updatedAt: now,
    });

    const measurement = await capturePurchaseMeasurement(purchaseId, payload.measurement, request).catch(() => null);
    const customer = await createCheckoutCustomer({ purchaseId, name: data.name, cpfCnpj: data.cpfCnpj, email: data.email, phone: data.phone });
    const asaasPayment = await createPayment({
      customerId: customer.id,
      purchaseId,
      orderNumber: number,
      valueCents: chargedTotalCents,
      billingType: paymentMethod === "pix" ? "PIX" : "CREDIT_CARD",
      installments,
      dueDate: dueDate(),
    });
    if (!asaasPayment.id || !asaasPayment.invoiceUrl) throw new Error("O Asaas não retornou o link de pagamento.");
    await db.update(purchases).set({ asaasCustomerId: customer.id, asaasPaymentId: asaasPayment.id, asaasInstallmentId: asaasPayment.installment || null, asaasInvoiceUrl: asaasPayment.invoiceUrl, updatedAt: new Date().toISOString() }).where(eq(purchases.id, purchaseId));
    return Response.json({ invoiceUrl: asaasPayment.invoiceUrl, orderNumber: number, ...(measurement ? { measurement } : {}) });
  } catch (error) {
    if (purchaseId) {
      try { await getDb().update(purchases).set({ paymentStatus: "payment_error", updatedAt: new Date().toISOString() }).where(and(eq(purchases.id, purchaseId), eq(purchases.paymentStatus, "payment_pending"))); } catch { /* keep original error */ }
    }
    if (error instanceof PostalLookupError) return Response.json({error:error.message},{status:503});
    if (error instanceof AsaasRequestError) return Response.json({ error: error.message }, { status: error.status });
    console.error("public_checkout_failed", error);
    return Response.json({ error: "Não foi possível iniciar o pagamento agora." }, { status: 500 });
  }
}
