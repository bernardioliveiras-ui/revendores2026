import { getOptionalEnv } from "@/lib/env";

export type ShippingOrder = {
  id: string;
  orderNumber: string;
  boxes: number;
  totalCents: number;
};

export function shippingAutomationConfigured() {
  return Boolean(
    getOptionalEnv("SHIPPING_AUTOMATION_URL") &&
      getOptionalEnv("SHIPPING_AUTOMATION_TOKEN"),
  );
}

export async function requestShippingAutomation() {
  return { configured: false, queued: false, disabled: true };
}
