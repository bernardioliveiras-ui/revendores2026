import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { createCheckoutCustomer, createPayment, AsaasRequestError } from "@/lib/asaas";
import { calculateInstallmentPrice, INSTALLMENT_RULES } from "@/lib/installments";
import { getKit } from "@/lib/kits";
import { getShippingOption } from "@/lib/shipping";

function clean(value: unknown, max = 180) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function digits(value: unknown, max = 20) { return clean(value, 40).replace(/\D/g, "").slice(0, max); }
function email(value: unknown) { const result = clean(value, 254).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result) ? result : ""; }
function dueDate() { const d = new Date(); d.setUTCDate(d.getUTCDate() + 3); return d.toISOString().slice(0, 10); }
function orderNumber() { return `MIX${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().slice(0, 4).toUpperCase()}`; }

export async function POST(request: Request) {
  let purchaseId = "";
  try {
    const payload = await request.json() as Record<string, unknown>;
    const kit = getKit(payload.kit);
    const data = {
      name: clean(payload.name, 120), email: email(payload.email), phone: digits(payload.phone, 15), cpfCnpj: digits(payload.cpfCnpj, 14),
      companyTradeName: clean(payload.companyTradeName, 160), stateRegistration: clean(payload.stateRegistration, 40), municipalRegistration: clean(payload.municipalRegistration, 40),
      postalCode: digits(payload.postalCode, 8), street: clean(payload.street, 220), number: clean(payload.number, 32), complement: clean(payload.complement, 160),
      district: clean(payload.district, 120), city: clean(payload.city, 120), state: clean(payload.state, 2).toUpperCase(),
    };
    const paymentMethod = payload.paymentMethod === "credit" ? "credit" : payload.paymentMethod === "pix" ? "pix" : "";
    const shippingType = payload.shippingType === "express" ? "express" : payload.shippingType === "economical" ? "economical" : "";
    const requestedInstallments = Number(payload.installments || 1);
    if (!kit || !data.name || !data.email || data.phone.length < 10 || ![11,14].includes(data.cpfCnpj.length) || data.postalCode.length !== 8 || !data.street || !data.number || !data.district || !data.city || data.state.length !== 2 || payload.acceptedTerms !== "yes" || !paymentMethod || !shippingType) {
      return Response.json({ error: "Confira seus dados, frete, pagamento e aceite os termos para continuar." }, { status: 400 });
    }
    const isCompany = data.cpfCnpj.length === 14;
    if (isCompany && (!data.companyTradeName || (!data.stateRegistration && !data.municipalRegistration))) {
      return Response.json({ error: "Para CNPJ, informe o nome fantasia e pelo menos uma Inscrição Estadual ou Municipal." }, { status: 400 });
    }
    const installments = paymentMethod === "pix" ? 1 : Math.trunc(requestedInstallments);
    if (installments < 1 || installments > INSTALLMENT_RULES.maxInstallments) return Response.json({ error: "Quantidade de parcelas inválida." }, { status: 400 });

    // Valores autoritativos: nada enviado pelo navegador é aceito como preço.
    const shipping = getShippingOption(data.postalCode, kit.boxes, shippingType);
    if (!shipping) return Response.json({ error: "Não foi possível calcular o frete para este CEP." }, { status: 422 });
    const productTotalCents = kit.totalCents;
    const baseCents = productTotalCents + shipping.priceCents;
    const installment = calculateInstallmentPrice(baseCents, installments);
    const interestCents = paymentMethod === "credit" ? installment.interestValueCents : 0;
    const chargedCents = paymentMethod === "credit" ? installment.chargedValueCents : baseCents;
    const installmentValueCents = paymentMethod === "credit" ? installment.installmentValueCents : chargedCents;

    const now = new Date().toISOString();
    purchaseId = crypto.randomUUID();
    const number = orderNumber();
    const db = getDb();
    await db.insert(purchases).values({
      id: purchaseId, orderNumber: number, ...data,
      kit: kit.id, boxes: kit.boxes, unitPriceCents: kit.unitPriceCents,
      productTotalCents, shippingCents: shipping.priceCents, shippingService: shipping.type, shippingDeliveryTime: shipping.deliveryTime,
      paymentMethod, installments, installmentValueCents, interestCents, totalCents: chargedCents,
      paymentStatus: "payment_pending", shippingStatus: "awaiting_payment",
      carrier: "Correios",
      utmSource: clean(payload.utmSource, 120), utmMedium: clean(payload.utmMedium, 120), utmCampaign: clean(payload.utmCampaign, 180), utmContent: clean(payload.utmContent, 180), landingPage: request.headers.get("referer")?.slice(0, 500) || "",
      createdAt: now, updatedAt: now,
    });

    const customer = await createCheckoutCustomer({ purchaseId, name: data.name, cpfCnpj: data.cpfCnpj, email: data.email, phone: data.phone });
    const payment = await createPayment({
      customerId: customer.id,
      purchaseId,
      orderNumber: number,
      billingType: paymentMethod === "pix" ? "PIX" : "CREDIT_CARD",
      chargedValueCents: chargedCents,
      installments,
      installmentValueCents,
      dueDate: dueDate(),
    });
    if (!payment.id || !payment.invoiceUrl) throw new Error("O Asaas não retornou o link de pagamento.");
    await db.update(purchases).set({ asaasCustomerId: customer.id, asaasPaymentId: payment.id, asaasInstallmentId: payment.installment || null, asaasInvoiceUrl: payment.invoiceUrl, updatedAt: new Date().toISOString() }).where(eq(purchases.id, purchaseId));
    return Response.json({ invoiceUrl: payment.invoiceUrl, orderNumber: number });
  } catch (error) {
    if (purchaseId) {
      try { await getDb().update(purchases).set({ paymentStatus: "payment_error", updatedAt: new Date().toISOString() }).where(eq(purchases.id, purchaseId)); } catch { /* keep original error */ }
    }
    if (error instanceof AsaasRequestError) return Response.json({ error: error.message }, { status: error.status });
    console.error("public_checkout_failed", error);
    return Response.json({ error: "Não foi possível iniciar o pagamento agora." }, { status: 500 });
  }
}
