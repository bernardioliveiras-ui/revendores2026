// Boundary stub for tests that exercise legacy payment logic, not audit storage.
// Persistent started/finished writes are tested with the real audit module in
// tests/asaas-reconciliation-audit.test.mjs.
export const asaasAuditStub = {
  beginReconciliationAudit: async (input) => ({ ...input, attemptId: "synthetic-attempt", requestId: "synthetic-request" }),
  finishReconciliationAudit: async () => {},
};
