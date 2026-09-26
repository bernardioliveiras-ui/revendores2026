import { index, int, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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
  companyTradeName: varchar("company_trade_name", { length: 160 }).notNull().default(""),
  stateRegistration: varchar("state_registration", { length: 40 }).notNull().default(""),
  municipalRegistration: varchar("municipal_registration", { length: 40 }).notNull().default(""),
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
  productTotalCents: int("product_total_cents").notNull(),
  shippingCents: int("shipping_cents").notNull().default(0),
  shippingService: varchar("shipping_service", { length: 80 }).notNull().default(""),
  shippingDeliveryTime: varchar("shipping_delivery_time", { length: 80 }).notNull().default(""),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull().default("pix"),
  installments: int("installments").notNull().default(1),
  installmentValueCents: int("installment_value_cents").notNull().default(0),
  interestCents: int("interest_cents").notNull().default(0),
  totalCents: int("total_cents").notNull(),
  paymentStatus: varchar("payment_status", { length: 30 }).notNull().default("payment_pending"),
  shippingStatus: varchar("shipping_status", { length: 30 }).notNull().default("awaiting_payment"),
  carrier: varchar("carrier", { length: 120 }),
  trackingCode: varchar("tracking_code", { length: 120 }),
  shippedAt: varchar("shipped_at", { length: 40 }),
  deliveredAt: varchar("delivered_at", { length: 40 }),
  asaasCustomerId: varchar("asaas_customer_id", { length: 120 }),
  asaasPaymentId: varchar("asaas_payment_id", { length: 120 }),
  asaasInstallmentId: varchar("asaas_installment_id", { length: 120 }),
  asaasInvoiceUrl: varchar("asaas_invoice_url", { length: 1000 }),
  userId: varchar("user_id", { length: 80 }),
  accessReleasedAt: varchar("access_released_at", { length: 40 }),
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
  purchaseId: varchar("purchase_id", { length: 80 }).notNull(),
  cpfCnpj: varchar("cpf_cnpj", { length: 24 }).notNull(),
  companyTradeName: varchar("company_trade_name", { length: 160 }).notNull().default(""),
  stateRegistration: varchar("state_registration", { length: 40 }).notNull().default(""),
  municipalRegistration: varchar("municipal_registration", { length: 40 }).notNull().default(""),
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

export const sales = mysqlTable("sales", {
  id: varchar("id", { length: 80 }).primaryKey(),
  userId: varchar("user_id", { length: 80 }).notNull(),
  boxes: int("boxes").notNull(),
  unitValueCents: int("unit_value_cents").notNull(),
  totalValueCents: int("total_value_cents").notNull(),
  channel: varchar("channel", { length: 40 }).notNull().default("other"),
  customerName: varchar("customer_name", { length: 120 }).notNull().default(""),
  notes: varchar("notes", { length: 1000 }).notNull().default(""),
  soldAt: varchar("sold_at", { length: 40 }).notNull(),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
}, (table) => [index("idx_sales_user_date").on(table.userId, table.soldAt)]);

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
  paymentId: varchar("payment_id", { length: 120 }),
  receivedAt: varchar("received_at", { length: 40 }).notNull(),
}, (table) => [index("idx_asaas_event_payment").on(table.paymentId)]);
