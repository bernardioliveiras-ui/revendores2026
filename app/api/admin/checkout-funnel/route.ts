import { requireAdmin } from "@/lib/auth";
import { readCheckoutFunnel } from "@/lib/checkout-activity";
import { indicatedError, privateResponseHeaders } from "@/lib/indicator-security";
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return Response.json({ activity: await readCheckoutFunnel() }, { headers: privateResponseHeaders });
  } catch (error) { return indicatedError(error); }
}
