import { lookupPostalCode } from "@/lib/postal-code";
import { getKit } from "@/lib/kits";
import { calculateShipping, getInstallmentOptions, normalizePostalCode } from "@/lib/checkout/pricing";

function clean(value: unknown, max = 40) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const kit = getKit(payload.kit);
  const postalCode = normalizePostalCode(clean(payload.postalCode));
  if (!kit || postalCode.length !== 8) {
    return Response.json({ error: "Informe um CEP válido para calcular o frete." }, { status: 400 });
  }

  let address;
  try { address = await lookupPostalCode(postalCode); }
  catch { return Response.json({error:"A consulta de CEP está indisponível. Tente novamente."},{status:503}); }
  if (!address) return Response.json({error:"CEP não encontrado. Confira os números informados."},{status:422});

  const shipping = calculateShipping(postalCode, kit.boxes);
  if (!shipping?.length) {
    return Response.json({ error: "Não encontramos uma tabela de frete para esse CEP." }, { status: 422 });
  }

  return Response.json({
    postalCode, address,
    kit: {
      id: kit.id,
      label: kit.label,
      boxes: kit.boxes,
      productTotalCents: kit.totalCents,
    },
    shippingOptions: shipping.map((option) => {
      const baseCents = kit.totalCents + option.priceCents;
      return {
        ...option,
        baseCents,
        pix: {
          chargedValueCents: baseCents,
          interestCents: 0,
        },
        credit: getInstallmentOptions(baseCents),
      };
    }),
  });
}
