import { getOptionalEnv } from "@/lib/env";

type AsaasEnvironment = "sandbox" | "production";
type AsaasErrorBody = { errors?: Array<{ code?: string; description?: string }> };

export type AsaasCustomer = { id: string };
export type AsaasPayment = { id: string; status?: string; customer?: string; value?: number; deleted?: boolean; invoiceUrl?: string; externalReference?: string; installment?: string };

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

export type AsaasConfig = ReturnType<typeof getAsaasConfig>;

async function asaasRequest<T>(path: string, init: RequestInit = {}, config: AsaasConfig = getAsaasConfig()) {
  if (!config.apiKey) throw new AsaasRequestError("A conta Asaas ainda não foi conectada.", 503);
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      signal: init.signal || AbortSignal.timeout(20000),
      headers: {
        "content-type": "application/json",
        "user-agent": `Mix10Pro/2.0 (${config.environment})`,
        access_token: config.apiKey,
        ...init.headers,
      },
    });
  } catch {
    // Falhas de rede e timeout não devem revelar URL, chave ou erro interno.
    throw new AsaasRequestError("Não foi possível consultar o Asaas.", 502);
  }
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
  description?: string;
}) {
  const body: Record<string, unknown> = {
    customer: input.customerId,
    billingType: input.billingType,
    dueDate: input.dueDate,
    description: `${input.orderNumber} - ${input.description || "Programa de Revendedores MIX10 PRO"}`,
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

export async function getPayment(id: string, config?: AsaasConfig) {
  return asaasRequest<AsaasPayment>(`/payments/${encodeURIComponent(id)}`, {}, config);
}

type WebhookInfo = { url?: string; enabled?: boolean; interrupted?: boolean; events?: string[] };
export async function inspectAsaasConnection(portalUrl: string) {
  const config = getAsaasConfig();
  const tokenSet = Boolean(getOptionalEnv("ASAAS_WEBHOOK_TOKEN"));
  const result = { environment:config.environment, payments:"", revendedores:"", influenciadores:"", tokenSet };
  if (!config.configured) {
    result.payments = "Chave da API ausente";
    return result;
  }
  try {
    const probe = await asaasRequest<{ data?: unknown[] }>("/payments?limit=1", {}, config);
    result.payments = Array.isArray(probe.data) ? "Consulta de cobranças autorizada" : "Resposta da API inesperada";
  } catch (error) {
    result.payments = error instanceof AsaasRequestError ? "Falha na consulta (HTTP " + error.status + ")" : "Consulta indisponível";
    return result;
  }
  try {
    const origin = new URL(portalUrl).origin;
    const webhooks: WebhookInfo[] = [];
    for (let offset = 0; ; offset += 100) {
      const page = await asaasRequest<{ data: WebhookInfo[]; hasMore: boolean }>("/webhooks?limit=100&offset=" + offset, {}, config);
      if (!Array.isArray(page.data) || (page.hasMore && !page.data.length)) throw new Error();
      webhooks.push(...page.data);
      if (!page.hasMore) break;
      if (offset >= 900) throw new Error();
    }
    for (const channel of ["revendedores","influenciadores"] as const) {
      const base = origin + "/api/billing/";
      const matching = webhooks.filter(h => h.url === base + channel + "/webhook" || h.url === base + "webhook");
      const active = matching.filter(h => h.enabled === true && h.interrupted === false);
      const events = new Set(active.flatMap(h => h.events || []));
      const required = ["PAYMENT_CONFIRMED","PAYMENT_RECEIVED","PAYMENT_REFUNDED","PAYMENT_PARTIALLY_REFUNDED","PAYMENT_DELETED","PAYMENT_RECEIVED_IN_CASH_UNDONE","PAYMENT_CHARGEBACK_REQUESTED"];
      const missing = required.filter(event => !events.has(event));
      result[channel] = !matching.length ? "URL do portal não encontrada" : !active.length ? "Fila inativa ou interrompida" :
        missing.length ? "Eventos a configurar: " + missing.join(", ") : "Fila ativa com os eventos configurados";
    }
  } catch {
    result.revendedores = result.influenciadores = "Não foi possível verificar os webhooks. Confira o domínio e a permissão de leitura da chave.";
  }
  return result;
}
