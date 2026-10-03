import { purchases } from "@/db/schema";

/**
 * Purchase columns that existed before the checkout 0.2.1 financial expansion.
 * Operational BKO/reseller reads use this projection so a partially migrated
 * production database can still load while the additive checkout migration is
 * being applied.
 */
export const operationalPurchaseFields = {
  id: purchases.id,
  orderNumber: purchases.orderNumber,
  name: purchases.name,
  email: purchases.email,
  phone: purchases.phone,
  cpfCnpj: purchases.cpfCnpj,
  postalCode: purchases.postalCode,
  street: purchases.street,
  number: purchases.number,
  complement: purchases.complement,
  district: purchases.district,
  city: purchases.city,
  state: purchases.state,
  kit: purchases.kit,
  boxes: purchases.boxes,
  unitPriceCents: purchases.unitPriceCents,
  totalCents: purchases.totalCents,
  paymentStatus: purchases.paymentStatus,
  shippingStatus: purchases.shippingStatus,
  carrier: purchases.carrier,
  trackingCode: purchases.trackingCode,
  shippedAt: purchases.shippedAt,
  deliveredAt: purchases.deliveredAt,
  asaasCustomerId: purchases.asaasCustomerId,
  asaasPaymentId: purchases.asaasPaymentId,
  asaasInvoiceUrl: purchases.asaasInvoiceUrl,
  userId: purchases.userId,
  accessReleasedAt: purchases.accessReleasedAt,
  welcomeStatus: purchases.welcomeStatus,
  welcomeSecret: purchases.welcomeSecret,
  welcomeIv: purchases.welcomeIv,
  welcomeSentAt: purchases.welcomeSentAt,
  utmSource: purchases.utmSource,
  utmMedium: purchases.utmMedium,
  utmCampaign: purchases.utmCampaign,
  utmContent: purchases.utmContent,
  landingPage: purchases.landingPage,
  createdAt: purchases.createdAt,
  updatedAt: purchases.updatedAt,
};
