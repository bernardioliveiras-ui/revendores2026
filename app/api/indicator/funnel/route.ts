import { requireIndicator } from "@/lib/auth";
import { requireIndicatorTerms } from "@/lib/indicator-terms-store";
import { indicatedError, privateResponseHeaders } from "@/lib/indicator-security";
import { readCheckoutFunnel } from "@/lib/checkout-activity";

export async function GET(request: Request) {
  try {
    const user = await requireIndicator(request);
    await requireIndicatorTerms(user.id);
    return Response.json({ activity: await readCheckoutFunnel(user.id) }, { headers: privateResponseHeaders });
  } catch (error) { return indicatedError(error); }
}
