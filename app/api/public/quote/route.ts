import { getInstallmentOptions } from "@/lib/installments";
import { getKit } from "@/lib/kits";
import { calculateShipping, getShippingOption } from "@/lib/shipping";

function digits(value: unknown, max = 20) { return typeof value === "string" ? value.replace(/\D/g, "").slice(0, max) : ""; }

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const kit = getKit(body.kit);
    const postalCode = digits(body.postalCode, 8);
    if (!kit || postalCode.length !== 8) return Response.json({ error: "Informe um kit e um CEP válido." }, { status: 400 });
    const shippingOptions = calculateShipping(postalCode, kit.boxes);
    if (!shippingOptions?.length) return Response.json({ error: "Não encontramos uma faixa de frete para este CEP." }, { status: 422 });
    const selectedShipping = getShippingOption(postalCode, kit.boxes, body.shippingType);
    if (!selectedShipping) return Response.json({ error: "Frete indisponível para este CEP." }, { status: 422 });
    const baseCents = kit.totalCents + selectedShipping.priceCents;
    return Response.json({
      productCents: kit.totalCents,
      shippingOptions,
      selectedShipping,
      baseCents,
      installmentOptions: getInstallmentOptions(baseCents),
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("public_quote_failed", error);
    return Response.json({ error: "Não foi possível calcular o frete agora." }, { status: 500 });
  }
}
