import { getOptionalEnv } from "@/lib/env";

type AsaasEnvironment = "sandbox" | "production";
type AsaasErrorBody = { errors?: Array<{ code?: string; description?: string }> };

export type AsaasCustomer = { id: string };
export type AsaasPayment = { id: string; status?: string; invoiceUrl?: string; externalReference?: string; installment?: string };

export class AsaasRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "AsaasRequestError";
  }
}

export function getAsaasConfig() {
  const apiKey = getOptionalEnv("ASAAS_API_KEY");
  const environment: AsaasEnvironment = getOptionalEnv("ASAAS_ENVIRONMENT") === "production" ? "production" : "sandbox";
  return {
    apiKey,
    environment,
    configured: Boolean(apiKey),
    baseUrl: environment === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3",
  };
}

async function asaasRequest<T>(path: string, init: RequestInit = {}) {
  const config = getAsaasConfig();
  if (!config.apiKey) throw new AsaasRequestError("A conta Asaas ainda não foi conectada.", 503);
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    signal: init.signal || AbortSignal.timeout(20000),
    headers: {
      "content-type": "application/json",
      "user-agent": `Mix10Pro/2.0 (${config.environment})`,
      access_token: config.apiKey,
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as AsaasErrorBody & T;
  if (!response.ok) {
    throw new AsaasRequestError(body.errors?.[0]?.description || "O Asaas não conseguiu concluir a solicitação.", response.status);
  }
  return body;
}

export async function createCheckoutCustomer(input: {
  purchaseId: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
}) {
  const externalReference = `mix10-purchase:${input.purchaseId}`;
  const existing = await asaasRequest<{ data?: AsaasCustomer[] }>(
    `/customers?externalReference=${encodeURIComponent(externalReference)}&limit=1`,
  );
  if (existing.data?.[0]?.id) return existing.data[0];
  return asaasRequest<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      cpfCnpj: input.cpfCnpj,
      email: input.email,
      mobilePhone: input.phone,
      externalReference,
      notificationDisabled: false,
    }),
  });
}

export async function createPayment(input: {
  customerId: string;
  purchaseId: string;
  orderNumber: string;
  valueCents: number;
  billingType: "PIX" | "CREDIT_CARD";
  installments: number;
  dueDate: string;
}) {
  const body: Record<string, unknown> = {
    customer: input.customerId,
    billingType: input.billingType,
    dueDate: input.dueDate,
    description: `${input.orderNumber} - Programa de Revendedores MIX10 PRO`,
    externalReference: input.purchaseId,
  };

  if (input.billingType === "CREDIT_CARD" && input.installments > 1) {
    body.installmentCount = input.installments;
    body.totalValue = input.valueCents / 100;
  } else {
    body.value = input.valueCents / 100;
  }

  return asaasRequest<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getPayment(id: string) {
  return asaasRequest<AsaasPayment>(`/payments/${encodeURIComponent(id)}`);
}
