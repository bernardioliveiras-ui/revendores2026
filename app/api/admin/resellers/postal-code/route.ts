import { requireAdmin } from "@/lib/auth";
import { lookupPostalCode, PostalLookupError } from "@/lib/postal-code";
import { privateResponseHeaders } from "@/lib/indicated-security";

export const runtime="nodejs";
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const postalCode = new URL(request.url).searchParams.get("cep")?.replace(/\D/g, "") || "";
    if (!/^\d{8}$/.test(postalCode)) return Response.json({error:"Informe CEP com oito dígitos."},{status:400,headers:privateResponseHeaders});
    const address = await lookupPostalCode(postalCode);
    if (!address) return Response.json({error:"CEP não encontrado. Você pode preencher o endereço manualmente."},{status:404,headers:privateResponseHeaders});
    return Response.json(address,{headers:privateResponseHeaders});
  } catch (error) {
    if (error instanceof Error && error.message==="UNAUTHORIZED") return Response.json({error:"Faça login novamente."},{status:401});
    if (error instanceof Error && error.message==="FORBIDDEN") return Response.json({error:"Acesso exclusivo do BKO."},{status:403});
    if (error instanceof PostalLookupError) return Response.json({error:"Consulta de CEP temporariamente indisponível. Preencha o endereço manualmente."},{status:503});
    console.error("reseller_postal_lookup_failed",error);
    return Response.json({error:"Não foi possível consultar o CEP."},{status:500});
  }
}
