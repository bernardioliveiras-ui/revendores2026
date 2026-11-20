import { requireAdmin } from "@/lib/auth";
import { POST as syncAsaasPayment } from "@/app/api/admin/orders/sync/route";

// Maintain PATCH for legacy BKO clients, with Asaas as the sole payment authority.
export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => null);
    const id = typeof body?.purchaseId === "string" ? body.purchaseId.trim() : typeof body?.orderId === "string" ? body.orderId.trim() : "";
    if (!id || body?.status !== "paid") return Response.json({error:"Informe um pedido e o status paid para confirmar manualmente."},{status:400});
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    headers.set("content-type", "application/json");
    const result = await syncAsaasPayment(new Request(request.url, { method:"POST", headers, body:JSON.stringify({purchaseId:id}) }));
    if (!result.ok) return result;
    const data = await result.json();
    if (!data.updated) return Response.json({error:data.message || "Pagamento ainda não confirmado pelo Asaas.",updated:false,asaasStatus:data.asaasStatus},{status:409});
    return Response.json(data);
  } catch(error) {
    if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});
    if(error instanceof Error&&error.message==="FORBIDDEN")return Response.json({error:"Acesso restrito ao BKO."},{status:403});
    console.error("manual_payment_failed",error);
    return Response.json({error:"Não foi possível concluir a aprovação. Verifique Acessos no BKO."},{status:500});
  }
}
