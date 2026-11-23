import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { getStudioDoc } from "@/lib/content-studio";
import { buildManualPdf } from "@/lib/simple-pdf";
import { getManualPdfOverride, hasManualResellerProfile } from "@/lib/reseller-materials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = {"Cache-Control":"private, no-store, max-age=0","X-Robots-Tag":"noindex, nofollow, noarchive","X-Content-Type-Options":"nosniff"};

async function authorize(request:Request){
  const user=await requireSession(request);
  if(user.mustChangePassword) throw new Error("PASSWORD_REQUIRED");
  if(user.role!=="admin"){
    if(user.role!=="reseller") throw new Error("FORBIDDEN_MANUAL");
    const [purchase]=await getDb().select({id:purchases.id}).from(purchases).where(and(eq(purchases.userId,user.id),eq(purchases.paymentStatus,"paid"),isNotNull(purchases.asaasVerifiedAt),or(eq(purchases.kit,"kit20"),eq(purchases.kit,"kit50"),eq(purchases.kit,"kit100")),isNotNull(purchases.accessReleasedAt))).limit(1);
    if(!purchase && !await hasManualResellerProfile(user.id)) throw new Error("FORBIDDEN_MANUAL");
  }
}

export async function GET(request:Request){
  try{
    await authorize(request);
    const url=new URL(request.url);
    // Upload feito pelo BKO prevalece no endereço de sempre do manual publicado.
    // As edições técnicas base/studio permanecem disponíveis separadamente.
    if(url.searchParams.get("base")!=="1" && url.searchParams.get("studio")!=="1"){
      const replacement=await getManualPdfOverride();
      if(replacement){
        const name=replacement.file_name.replace(/[\r\n"\\]/g,"_");
        const content=new Uint8Array(replacement.file_bytes);
        return new Response(content,{headers:{...privateHeaders,"Content-Type":"application/pdf","Content-Length":String(content.byteLength),"Content-Disposition":`inline; filename="${name}"; filename*=UTF-8''${encodeURIComponent(replacement.file_name)}`}});
      }
    }
    // PDF enviado para a biblioteca de materiais, protegido pela mesma autorização do manual.
    if(url.searchParams.get("edition")==="material"){
      const pdf=await readFile(join(process.cwd(),"private","manual","Manual_do_Revendedor_Enviado_2026.pdf"));
      return new Response(new Uint8Array(pdf),{headers:{...privateHeaders,"Content-Type":"application/pdf","Content-Length":String(pdf.byteLength),"Content-Disposition":'inline; filename="Manual_do_Revendedor_LORD_NUTRI_2026.pdf"'}});
    }
    if(url.searchParams.get("base")==="1"){
      const pdf=await readFile(join(process.cwd(),"private","manual","Manual_do_Revendedor_LORD_NUTRI.pdf"));
      return new Response(new Uint8Array(pdf),{headers:{...privateHeaders,"Content-Type":"application/pdf","Content-Length":String(pdf.byteLength),"Content-Disposition":'inline; filename="Manual_do_Revendedor_LORD_NUTRI_BASE.pdf"'}});
    }
    // Mantem o Studio disponível sob demanda, mas o portal usa o PDF-base vetorial.
    // Isso evita a recomposição sobre JPG (1440x810), que causava perda de nitidez
    // e pequenos deslocamentos de texto no manual publicado.
    const studio=await getStudioDoc("manual");
    if(url.searchParams.get("studio")==="1"){
      const pages=(studio.published as {pages?:Parameters<typeof buildManualPdf>[0]}).pages||[];
      const pageImages=await Promise.all(pages.map((_:unknown,index:number)=>readFile(join(process.cwd(),"private","manual","pages",`page-${String(index+1).padStart(2,"0")}.jpg`))));
      const pdf=buildManualPdf(pages,pageImages);
      return new Response(new Uint8Array(pdf),{headers:{...privateHeaders,"Content-Type":"application/pdf","Content-Length":String(pdf.byteLength),"Content-Disposition":'inline; filename="Manual_do_Revendedor_LORD_NUTRI_Studio.pdf"'}});
    }
    const pdf=await readFile(join(process.cwd(),"private","manual","Manual_do_Revendedor_LORD_NUTRI.pdf"));
    return new Response(new Uint8Array(pdf),{headers:{...privateHeaders,"Content-Type":"application/pdf","Content-Length":String(pdf.byteLength),"Content-Disposition":'inline; filename="Manual_do_Revendedor_LORD_NUTRI_Publicado.pdf"'}});
  }catch(error){
    const m=error instanceof Error?error.message:"";
    const status=m==="UNAUTHORIZED"?401:["PASSWORD_REQUIRED","FORBIDDEN_MANUAL"].includes(m)?403:503;
    return Response.json({error:m==="UNAUTHORIZED"?"Entre no portal para acessar o material.":m==="PASSWORD_REQUIRED"?"Atualize sua senha para acessar o material.":m==="FORBIDDEN_MANUAL"?"Material disponível somente para revendedores cadastrados manualmente ou compradores de kit com pagamento confirmado e acesso liberado.":"Não foi possível abrir o manual."},{status,headers:privateHeaders});
  }
}
