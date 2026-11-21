import { getDb } from "@/db";
import { asaasReconciliationAudit } from "@/db/schema";

export type AuditEnvironment = "sandbox" | "production";
export type ReconciliationAction = "admin.orders.sync" | "admin.orders.patch.legacy";
export type AuditOutcome = "approved" | "rejected" | "provider_error" | "internal_error";
export type AuditCode =
  | "PURCHASE_NOT_FOUND" | "PAYMENT_ID_MISSING" | "AUDIT_CONFIGURATION_MISSING"
  | "PAYMENT_PENDING" | "PAYMENT_CANCELLED" | "PAYMENT_REFUNDED"
  | "PAYMENT_MISMATCH" | "INSTALLMENT_MISMATCH" | "ENVIRONMENT_MISMATCH"
  | "ORDER_CANCELLED" | "RECONCILIATION_REJECTED" | "ASAAS_UNAVAILABLE"
  | "INTERNAL_ERROR";

const summaries: Record<AuditCode, string> = {
  PURCHASE_NOT_FOUND: "Pedido não localizado",
  PAYMENT_ID_MISSING: "Pedido sem identificador Asaas",
  AUDIT_CONFIGURATION_MISSING: "Configuração de conciliação indisponível",
  PAYMENT_PENDING: "Pagamento ainda não confirmado",
  PAYMENT_CANCELLED: "Cobrança cancelada ou excluída",
  PAYMENT_REFUNDED: "Pagamento estornado ou contestado",
  PAYMENT_MISMATCH: "Dados da cobrança divergentes",
  INSTALLMENT_MISMATCH: "Parcelamento divergente",
  ENVIRONMENT_MISMATCH: "Ambiente Asaas incompatível",
  ORDER_CANCELLED: "Pedido local cancelado",
  RECONCILIATION_REJECTED: "Conciliação não aplicada",
  ASAAS_UNAVAILABLE: "Consulta Asaas indisponível",
  INTERNAL_ERROR: "Falha interna de conciliação",
};

export type AuditAttempt = {
  attemptId: string;
  requestId: string;
  actorId: string | null;
  purchaseId: string | null;
  paymentId: string | null;
  configuredEnvironment: AuditEnvironment | null;
  endpointAction: ReconciliationAction;
};

export async function beginReconciliationAudit(input: Omit<AuditAttempt, "attemptId" | "requestId">): Promise<AuditAttempt> {
  const attempt: AuditAttempt = {
    ...input,
    attemptId: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
  };
  await getDb().insert(asaasReconciliationAudit).values({
    recordId: crypto.randomUUID(),
    ...attempt,
    phase: "started",
    consultedEnvironment: null,
    safeErrorCode: null,
    httpStatus: null,
    reasonSummary: null,
    outcome: "started",
    providerConsulted: 0,
    attemptedAt: new Date(),
  });
  return attempt;
}

export async function finishReconciliationAudit(
  attempt: AuditAttempt,
  result: {
    outcome: AuditOutcome;
    httpStatus: number;
    safeErrorCode: AuditCode | null;
    consultedEnvironment: AuditEnvironment | null;
    providerConsulted: boolean;
  },
): Promise<void> {
  await getDb().insert(asaasReconciliationAudit).values({
    recordId: crypto.randomUUID(),
    ...attempt,
    phase: "finished",
    consultedEnvironment: result.consultedEnvironment,
    safeErrorCode: result.safeErrorCode,
    httpStatus: result.httpStatus,
    reasonSummary: result.safeErrorCode ? summaries[result.safeErrorCode] : null,
    outcome: result.outcome,
    providerConsulted: result.providerConsulted ? 1 : 0,
    attemptedAt: new Date(),
  });
}
