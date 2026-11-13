import { handleBillingWebhook } from "@/lib/billing-webhook";
export async function POST(request: Request) { return handleBillingWebhook(request, "influenciadores"); }
