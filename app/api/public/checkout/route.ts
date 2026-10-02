import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { createCheckoutCustomer, createPayment, AsaasRequestError } from "@/lib/asaas";
import { getKit } from "@/lib/kits";

function clean(value: unknown, max = 180) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function digits(value: unknown, max = 20) { return clean(value, 40).replace(/\D/g, "").slice(0, max); }
function email(value: unknown) { const result = clean(value, 254).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result) ? result : ""; }
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

    const now = new Date().toISOString();
    purchaseId = crypto.randomUUID();
    const number = orderNumber();
    const db = getDb();
    await db.insert(purchases).values({
      id: purchaseId, orderNumber: number, ...data,
      kit: kit.id, boxes: kit.boxes, unitPriceCents: kit.unitPriceCents, totalCents: kit.totalCents,
      paymentStatus: "payment_pending", shippingStatus: "awaiting_payment",
      utmSource: clean(payload.utmSource, 120), utmMedium: clean(payload.utmMedium, 120), utmCampaign: clean(payload.utmCampaign, 180), utmContent: clean(payload.utmContent, 180), landingPage: request.headers.get("referer")?.slice(0, 500) || "",
      createdAt: now, updatedAt: now,
    });

    const customer = await createCheckoutCustomer({ purchaseId, name: data.name, cpfCnpj: data.cpfCnpj, email: data.email, phone: data.phone });
    const payment = await createPayment({ customerId: customer.id, purchaseId, orderNumber: number, valueCents: kit.totalCents, dueDate: dueDate() });
    if (!payment.id || !payment.invoiceUrl) throw new Error("O Asaas não retornou o link de pagamento.");
    await db.update(purchases).set({ asaasCustomerId: customer.id, asaasPaymentId: payment.id, asaasInvoiceUrl: payment.invoiceUrl, updatedAt: new Date().toISOString() }).where(eq(purchases.id, purchaseId));
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
