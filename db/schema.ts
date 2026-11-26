import { char, datetime, index, int, mysqlEnum, mysqlTable, smallint, tinyint, uniqueIndex, varchar, text } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 80 }).primaryKey(),
  email: varchar("email", { length: 254 }).notNull(),
  name: varchar("name", { length: 120 }).notNull().default(""),
  phone: varchar("phone", { length: 32 }).notNull().default(""),
  role: varchar("role", { length: 20 }).notNull().default("reseller"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  passwordHash: varchar("password_hash", { length: 255 }),
  mustChangePassword: int("must_change_password").notNull().default(1),
  failedLoginAttempts: int("failed_login_attempts").notNull().default(0),
  lockedUntil: varchar("locked_until", { length: 40 }),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
  updatedAt: varchar("updated_at", { length: 40 }).notNull(),
}, (table) => [
  uniqueIndex("idx_users_email").on(table.email),
  index("idx_users_role_status").on(table.role, table.status),
]);

export const authSessions = mysqlTable("auth_sessions", {
  tokenHash: varchar("token_hash", { length: 128 }).primaryKey(),
  userId: varchar("user_id", { length: 80 }).notNull(),
  expiresAt: varchar("expires_at", { length: 40 }).notNull(),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
  lastSeenAt: varchar("last_seen_at", { length: 40 }).notNull(),
}, (table) => [index("idx_auth_sessions_user").on(table.userId), index("idx_auth_sessions_expires").on(table.expiresAt)]);

export const purchases = mysqlTable("purchases", {
  id: varchar("id", { length: 80 }).primaryKey(),
  orderNumber: varchar("order_number", { length: 60 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  cpfCnpj: varchar("cpf_cnpj", { length: 24 }).notNull(),
  postalCode: varchar("postal_code", { length: 16 }).notNull(),
  street: varchar("street", { length: 220 }).notNull(),
  number: varchar("number", { length: 32 }).notNull(),
  complement: varchar("complement", { length: 160 }).notNull().default(""),
  district: varchar("district", { length: 120 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  kit: varchar("kit", { length: 20 }).notNull(),
  boxes: int("boxes").notNull(),
  unitPriceCents: int("unit_price_cents").notNull(),
  productTotalCents: int("product_total_cents").notNull().default(0),
  shippingType: varchar("shipping_type", { length: 20 }).notNull().default(""),
  shippingCents: int("shipping_cents").notNull().default(0),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull().default(""),
  installments: int("installments").notNull().default(1),
  installmentValueCents: int("installment_value_cents").notNull().default(0),
  interestCents: int("interest_cents").notNull().default(0),
  totalCents: int("total_cents").notNull(),
  paymentStatus: varchar("payment_status", { length: 30 }).notNull().default("payment_pending"),
  campaignId: varchar("campaign_id", { length: 80 }),
  indicatorCashbackCents: int("indicator_cashback_cents"),
  asaasVerifiedAt: varchar("asaas_verified_at", { length: 40 }),
  shippingStatus: varchar("shipping_status", { length: 30 }).notNull().default("awaiting_payment"),
  carrier: varchar("carrier", { length: 120 }),
  postalEvent: varchar("postal_event", { length: 240 }),
  postalEventAt: varchar("postal_event_at", { length: 40 }),
  postalCheckedAt: varchar("postal_checked_at", { length: 40 }),
  postalAttemptAt: varchar("postal_attempt_at", { length: 40 }),
  postalIssue: varchar("postal_issue", { length: 120 }),
  trackingCode: varchar("tracking_code", { length: 120 }),
  shippedAt: varchar("shipped_at", { length: 40 }),
  deliveredAt: varchar("delivered_at", { length: 40 }),
  asaasCustomerId: varchar("asaas_customer_id", { length: 120 }),
  asaasPaymentId: varchar("asaas_payment_id", { length: 120 }),
  asaasInstallmentId: varchar("asaas_installment_id", { length: 120 }),
  asaasInvoiceUrl: varchar("asaas_invoice_url", { length: 1000 }),
  userId: varchar("user_id", { length: 80 }),
  accessReleasedAt: varchar("access_released_at", { length: 40 }),
  welcomeStatus: varchar("welcome_status", { length: 30 }).notNull().default("pending"),
  welcomeSecret: varchar("welcome_secret", { length: 1000 }),
  welcomeIv: varchar("welcome_iv", { length: 40 }),
  welcomeSentAt: varchar("welcome_sent_at", { length: 40 }),
  utmSource: varchar("utm_source", { length: 120 }).notNull().default(""),
  utmMedium: varchar("utm_medium", { length: 120 }).notNull().default(""),
  utmCampaign: varchar("utm_campaign", { length: 180 }).notNull().default(""),
  utmContent: varchar("utm_content", { length: 180 }).notNull().default(""),
  landingPage: varchar("landing_page", { length: 500 }).notNull().default(""),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
  updatedAt: varchar("updated_at", { length: 40 }).notNull(),
}, (table) => [
  uniqueIndex("idx_purchases_order_number").on(table.orderNumber),
  uniqueIndex("idx_purchases_asaas_payment").on(table.asaasPaymentId),
  index("idx_purchases_payment_created").on(table.paymentStatus, table.createdAt),
  index("idx_purchases_email").on(table.email),
]);

export const resellerProfiles = mysqlTable("reseller_profiles", {
  id: varchar("id", { length: 80 }).primaryKey(),
  userId: varchar("user_id", { length: 80 }).notNull(),
  purchaseId: varchar("purchase_id", { length: 80 }),
  cpfCnpj: varchar("cpf_cnpj", { length: 24 }).notNull(),
  postalCode: varchar("postal_code", { length: 16 }).notNull(),
  street: varchar("street", { length: 220 }).notNull(),
  number: varchar("number", { length: 32 }).notNull(),
  complement: varchar("complement", { length: 160 }).notNull().default(""),
  district: varchar("district", { length: 120 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  initialKit: varchar("initial_kit", { length: 20 }).notNull(),
  initialBoxes: int("initial_boxes").notNull(),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
}, (table) => [uniqueIndex("idx_reseller_profiles_user").on(table.userId), uniqueIndex("idx_reseller_profiles_purchase").on(table.purchaseId)]);

/** Convites de ativação de revendedores manuais, isolados dos influenciadores. */
export const resellerInvitations = mysqlTable("reseller_invitations", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 80 }).notNull(),
  expiresAt: varchar("expires_at", { length: 40 }).notNull(),
  usedAt: varchar("used_at", { length: 40 }),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
}, (table) => [index("idx_reseller_invitation_user").on(table.userId)]);

export const stockMovements = mysqlTable("stock_movements", {
  id: varchar("id", { length: 80 }).primaryKey(),
  userId: varchar("user_id", { length: 80 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  boxes: int("boxes").notNull(),
  referenceType: varchar("reference_type", { length: 30 }).notNull().default("manual"),
  referenceId: varchar("reference_id", { length: 80 }).notNull().default(""),
  notes: varchar("notes", { length: 1000 }).notNull().default(""),
  occurredAt: varchar("occurred_at", { length: 40 }).notNull(),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
}, (table) => [index("idx_stock_user_date").on(table.userId, table.occurredAt)]);

/** Expedição de caixas destinadas a revendedores, sem compra ou cobrança Asaas. */
export const manualShipments = mysqlTable("manual_shipments", {
  id: varchar("id", { length: 80 }).primaryKey(),
  userId: varchar("user_id", { length: 80 }).notNull(),
  sourceMovementId: varchar("source_movement_id", { length: 80 }),
  orderNumber: varchar("order_number", { length: 80 }).notNull(),
  boxes: int("boxes").notNull(),
  stockCreditMode: varchar("stock_credit_mode", { length: 30 }).notNull().default("on_delivery"),
  stockCreditedAt: varchar("stock_credited_at", { length: 40 }),
  shippingStatus: varchar("shipping_status", { length: 30 }).notNull().default("separating"),
  carrier: varchar("carrier", { length: 120 }),
  trackingCode: varchar("tracking_code", { length: 120 }),
  postalEvent: varchar("postal_event", { length: 240 }),
  postalEventAt: varchar("postal_event_at", { length: 40 }),
  postalCheckedAt: varchar("postal_checked_at", { length: 40 }),
  postalAttemptAt: varchar("postal_attempt_at", { length: 40 }),
  postalIssue: varchar("postal_issue", { length: 120 }),
  shippedAt: varchar("shipped_at", { length: 40 }),
  deliveredAt: varchar("delivered_at", { length: 40 }),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
  updatedAt: varchar("updated_at", { length: 40 }).notNull(),
}, table => [uniqueIndex("idx_manual_shipments_source").on(table.sourceMovementId), uniqueIndex("idx_manual_shipments_order").on(table.orderNumber), index("idx_manual_shipments_user").on(table.userId)]);

export const sales = mysqlTable("sales", {
  id: varchar("id", { length: 80 }).primaryKey(),
  userId: varchar("user_id", { length: 80 }).notNull(),
  clientRequestId: varchar("client_request_id", { length: 80 }),
  boxes: int("boxes").notNull(),
  unitValueCents: int("unit_value_cents").notNull(),
  totalValueCents: int("total_value_cents").notNull(),
  channel: varchar("channel", { length: 40 }).notNull().default("other"),
  customerName: varchar("customer_name", { length: 120 }).notNull().default(""),
  notes: varchar("notes", { length: 1000 }).notNull().default(""),
  soldAt: varchar("sold_at", { length: 40 }).notNull(),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
}, (table) => [index("idx_sales_user_date").on(table.userId, table.soldAt),uniqueIndex("uq_sales_user_request").on(table.userId,table.clientRequestId)]);

/** Configuração BKO singleton: preço utilizado exclusivamente por vendas registradas pelo revendedor. */
export const resellerSalePriceSettings = mysqlTable("reseller_sale_price_settings", {
  id: int("id").primaryKey(),
  priceCents: int("price_cents").notNull().default(10990),
  updatedBy: varchar("updated_by",{length:80}),
  updatedAt: varchar("updated_at",{length:40}).notNull().default(""),
});

export const resellerSalePriceHistory = mysqlTable("reseller_sale_price_history", {
  id: varchar("id",{length:80}).primaryKey(),
  oldPriceCents: int("old_price_cents").notNull(),
  newPriceCents: int("new_price_cents").notNull(),
  reason: varchar("reason",{length:240}).notNull(),
  changedBy: varchar("changed_by",{length:80}).notNull(),
  changedAt: varchar("changed_at",{length:40}).notNull(),
}, t=>[index("idx_sale_price_history_date").on(t.changedAt)]);

export const affiliateReferrals = mysqlTable("affiliate_referrals", {
  id: varchar("id", { length: 80 }).primaryKey(),
  userId: varchar("user_id", { length: 80 }).notNull(),
  publicCode: varchar("public_code", { length: 64 }).notNull(),
  customerName: varchar("customer_name", { length: 120 }).notNull().default(""),
  whatsapp: varchar("whatsapp", { length: 24 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("created"),
  clickCount: int("click_count").notNull().default(0),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
  updatedAt: varchar("updated_at", { length: 40 }).notNull(),
}, (table) => [uniqueIndex("idx_referrals_code").on(table.publicCode), index("idx_referrals_user_created").on(table.userId, table.createdAt)]);

/** Indicações criadas pelo BKO: independentes da aprovação de revendedores via Asaas. */
export const indicatedClients = mysqlTable("indicated_clients", {
  id: varchar("id", { length: 80 }).primaryKey(),
  clientUserId: varchar("client_user_id", { length: 80 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  channel: varchar("channel", { length: 120 }).notNull(),
  responsible: varchar("responsible", { length: 120 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("ENTROU NO LINK"),
  receiptId: varchar("receipt_id", { length: 80 }),
  receiptSentAt: varchar("receipt_sent_at", { length: 40 }),
  receiptReview: varchar("receipt_review", { length: 16 }).notNull().default("PENDENTE"),
  receiptGuidance: varchar("receipt_guidance", { length: 500 }).notNull().default(""),
  reviewedAt: varchar("reviewed_at", { length: 40 }),
  reviewedBy: varchar("reviewed_by", { length: 80 }),
  cashbackCents: int("cashback_cents"),
  cashbackStatus: varchar("cashback_status", { length: 16 }).notNull().default("PENDENTE"),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
  updatedAt: varchar("updated_at", { length: 40 }).notNull(),
}, table => [uniqueIndex("idx_indicated_client_user").on(table.clientUserId), index("idx_indicated_status").on(table.status)]);

/** Pessoas que indicam compradores, sem permissões nem estoque de revendedor. */
export const indicatorProfiles = mysqlTable("indicator_profiles", {
  userId: varchar("user_id", { length: 80 }).primaryKey(),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
});

/** Uma campanha, um link público e várias vendas por influenciador. */
export const indicatorCampaigns = mysqlTable("indicator_campaigns", {
  id: varchar("id", { length: 80 }).primaryKey(),
  indicatorUserId: varchar("indicator_user_id", { length: 80 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  publicCode: varchar("public_code", { length: 64 }).notNull(),
  publicSlug: varchar("public_slug", { length: 100 }),
  cashbackMode: varchar("cashback_mode", { length: 12 }).notNull().default("fixed"),
  cashbackValue: int("cashback_value").notNull().default(1500),
  active: int("active").notNull().default(1),
  clickCount: int("click_count").notNull().default(0),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
  updatedAt: varchar("updated_at", { length: 40 }).notNull(),
}, t => [uniqueIndex("idx_indicator_campaign_code").on(t.publicCode), uniqueIndex("idx_indicator_campaign_slug").on(t.publicSlug), uniqueIndex("idx_indicator_campaign_owner").on(t.indicatorUserId)]);

/** Pedidos feitos na loja externa, atribuídos por callback servidor-servidor. */
export const indicatorExternalOrders = mysqlTable("indicator_external_orders", {
  id: varchar("id", { length: 80 }).primaryKey(),
  externalOrderId: varchar("external_order_id", { length: 120 }).notNull(),
  campaignId: varchar("campaign_id", { length: 80 }).notNull(),
  asaasPaymentId: varchar("asaas_payment_id", { length: 120 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 30 }).notNull().default("payment_pending"),
  productTotalCents: int("product_total_cents").notNull(),
  indicatorCashbackCents: int("indicator_cashback_cents"),
  asaasVerifiedAt: varchar("asaas_verified_at", { length: 40 }),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
  updatedAt: varchar("updated_at", { length: 40 }).notNull(),
}, t => [
  uniqueIndex("idx_external_order_id").on(t.externalOrderId),
  uniqueIndex("idx_external_asaas_payment").on(t.asaasPaymentId),
  index("idx_external_campaign_id").on(t.campaignId),
]);

export const indicatorLeads = mysqlTable("indicator_leads", {
  id: varchar("id", { length: 80 }).primaryKey(),
  indicatorUserId: varchar("indicator_user_id", { length: 80 }).notNull(),
  publicCode: varchar("public_code", { length: 64 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  channel: varchar("channel", { length: 120 }).notNull().default("WhatsApp"),
  status: varchar("status", { length: 32 }).notNull().default("LINK GERADO"),
  clickCount: int("click_count").notNull().default(0),
  shareAttempts: int("share_attempts").notNull().default(0),
  lastSharedAt: varchar("last_shared_at", { length: 40 }),
  lastClickedAt: varchar("last_clicked_at", { length: 40 }),
  verificationNotes: varchar("verification_notes", { length: 500 }).notNull().default(""),
  receiptId: varchar("receipt_id", { length: 80 }),
  receiptSentAt: varchar("receipt_sent_at", { length: 40 }),
  receiptReview: varchar("receipt_review", { length: 16 }).notNull().default("PENDENTE"),
  reviewedAt: varchar("reviewed_at", { length: 40 }),
  reviewedBy: varchar("reviewed_by", { length: 80 }),
  cashbackCents: int("cashback_cents"),
  cashbackStatus: varchar("cashback_status", { length: 16 }).notNull().default("PENDENTE"),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
  updatedAt: varchar("updated_at", { length: 40 }).notNull(),
}, (table) => [uniqueIndex("idx_indicator_leads_code").on(table.publicCode),index("idx_indicator_leads_owner").on(table.indicatorUserId,table.createdAt)]);

export const indicatorReceipts = mysqlTable("indicator_receipts", {
  id: varchar("id", { length: 80 }).primaryKey(),
  leadId: varchar("lead_id", { length: 80 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 80 }).notNull(),
  sizeBytes: int("size_bytes").notNull(),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
}, (table) => [index("idx_indicator_receipts_lead").on(table.leadId)]);

export const indicatedInvitations = mysqlTable("indicated_invitations", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  clientUserId: varchar("client_user_id", { length: 80 }).notNull(),
  expiresAt: varchar("expires_at", { length: 40 }).notNull(),
  usedAt: varchar("used_at", { length: 40 }),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
}, table => [index("idx_indicated_invitation_user").on(table.clientUserId)]);

export const indicatedReceipts = mysqlTable("indicated_receipts", {
  id: varchar("id", { length: 80 }).primaryKey(),
  indicationId: varchar("indication_id", { length: 80 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 80 }).notNull(),
  sizeBytes: int("size_bytes").notNull(),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
}, table => [index("idx_indicated_receipt_indication").on(table.indicationId)]);

/** Cashback de indicação: separado de faturamento, vendas e pagamentos do pedido. */
export const affiliateCashbacks = mysqlTable("affiliate_cashbacks", {
  id: varchar("id", { length: 80 }).primaryKey(),
  referralId: varchar("referral_id", { length: 80 }).notNull(),
  resellerUserId: varchar("reseller_user_id", { length: 80 }).notNull(),
  purchaseId: varchar("purchase_id", { length: 80 }).notNull(),
  amountCents: int("amount_cents").notNull().default(1500),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  qualifyingBoxes: int("qualifying_boxes").notNull().default(1),
  buyerEmail: varchar("buyer_email", { length: 254 }).notNull().default(""),
  paidBy: varchar("paid_by", { length: 80 }),
  payoutReference: varchar("payout_reference", { length: 180 }).notNull().default(""),
  cancelledAt: varchar("cancelled_at", { length: 40 }),
  cancelledBy: varchar("cancelled_by", { length: 80 }),
  paymentReversedAt: varchar("payment_reversed_at", { length: 40 }),
  approvedAt: varchar("approved_at", { length: 40 }),
  approvedBy: varchar("approved_by", { length: 80 }),
  paidAt: varchar("paid_at", { length: 40 }),
  notes: varchar("notes", { length: 500 }).notNull().default(""),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
  updatedAt: varchar("updated_at", { length: 40 }).notNull(),
}, (table) => [
  uniqueIndex("idx_cashback_purchase").on(table.purchaseId),
  index("idx_cashback_reseller_status").on(table.resellerUserId, table.status),
  index("idx_cashback_referral").on(table.referralId),
]);

export const affiliateClicks = mysqlTable("affiliate_clicks", {
  id: int("id").autoincrement().primaryKey(),
  referralId: varchar("referral_id", { length: 80 }).notNull(),
  referrer: varchar("referrer", { length: 500 }).notNull().default(""),
  userAgent: varchar("user_agent", { length: 500 }).notNull().default(""),
  clickedAt: varchar("clicked_at", { length: 40 }).notNull(),
}, (table) => [index("idx_affiliate_click_referral").on(table.referralId, table.clickedAt)]);

export const asaasEvents = mysqlTable("asaas_events", {
  eventId: varchar("event_id", { length: 180 }).primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  purchaseId: varchar("purchase_id", { length: 80 }),
  paymentId: varchar("payment_id", { length: 120 }),
  receivedAt: varchar("received_at", { length: 40 }).notNull(),
}, (table) => [index("idx_asaas_event_payment").on(table.paymentId)]);

/** Log append-only das tentativas administrativas de conciliação (não financeiro). */
export const asaasReconciliationAudit = mysqlTable("asaas_reconciliation_audit", {
  recordId: char("record_id", { length: 36 }).primaryKey(),
  attemptId: char("attempt_id", { length: 36 }).notNull(),
  phase: mysqlEnum("phase", ["started", "finished"]).notNull(),
  requestId: varchar("request_id", { length: 96 }).notNull(),
  actorId: varchar("actor_id", { length: 80 }),
  purchaseId: varchar("purchase_id", { length: 80 }),
  paymentId: varchar("payment_id", { length: 120 }),
  configuredEnvironment: mysqlEnum("configured_environment", ["sandbox", "production"]),
  consultedEnvironment: mysqlEnum("consulted_environment", ["sandbox", "production"]),
  endpointAction: varchar("endpoint_action", { length: 96 }).notNull(),
  safeErrorCode: varchar("safe_error_code", { length: 64 }),
  httpStatus: smallint("http_status", { unsigned: true }),
  reasonSummary: varchar("reason_summary", { length: 180 }),
  outcome: mysqlEnum("outcome", ["started", "approved", "rejected", "provider_error", "internal_error"]).notNull(),
  providerConsulted: tinyint("provider_consulted").notNull().default(0),
  attemptedAt: datetime("attempted_at", { mode: "date", fsp: 3 }).notNull(),
}, (table) => [
  uniqueIndex("uq_ara_attempt_phase").on(table.attemptId, table.phase),
  index("idx_ara_purchase_time").on(table.purchaseId, table.attemptedAt),
  index("idx_ara_payment_time").on(table.paymentId, table.attemptedAt),
  index("idx_ara_request").on(table.requestId),
  index("idx_ara_outcome_time").on(table.outcome, table.attemptedAt),
]);

export const purchaseMeasurement = mysqlTable("purchase_measurement", {
  purchaseId: varchar("purchase_id", { length: 80 }).primaryKey(),
  snapshot: text("snapshot").notNull(),
  withdrawalTokenHash: varchar("withdrawal_token_hash", { length: 64 }),
  activatedAt: varchar("activated_at", { length: 40 }),
  confirmedAt: varchar("confirmed_at", { length: 40 }),
  expiresAt: varchar("expires_at", { length: 40 }).notNull(),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
}, table => [index("idx_measurement_expiry").on(table.expiresAt)]);
export const measurementOutbox = mysqlTable("measurement_outbox", {
  id: varchar("id", { length: 120 }).primaryKey(),
  purchaseId: varchar("purchase_id", { length: 80 }).notNull(),
  provider: varchar("provider", { length: 8 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  attempts: int("attempts").notNull().default(0),
  nextAttemptAt: varchar("next_attempt_at", { length: 40 }).notNull(),
  sentAt: varchar("sent_at", { length: 40 }),
  lastError: varchar("last_error", { length: 80 }),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
}, table => [uniqueIndex("idx_measurement_purchase_provider").on(table.purchaseId, table.provider), index("idx_measurement_due").on(table.status, table.nextAttemptAt)]);
