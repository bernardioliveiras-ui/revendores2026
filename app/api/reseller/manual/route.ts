import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { getStudioDoc } from "@/lib/content-studio";
import { buildManualPdf } from "@/lib/simple-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = {"Cache-Control":"private, no-store, max-age=0","X-Robots-Tag":"noindex, nofollow, noarchive","X-Content-Type-Options":"nosniff"};

async function authorize(request:Request){
  const user=await requireSession(request);
  if(user.mustChangePassword) throw new Error("PASSWORD_REQUIRED");
  if(user.role!=="admin"){
    const [purchase]=await getDb().select({id:purchases.id}).from(purchases).where(and(eq(purchases.userId,user.id),eq(purchases.paymentStatus,"paid"),or(eq(purchases.kit,"kit20"),eq(purchases.kit,"kit50")),isNotNull(purchases.accessReleasedAt))).limit(1);
    if(!purchase) throw new Error("FORBIDDEN_MANUAL");
  }
}

export async function GET(request:Request){
  try{
    await authorize(request);
    const url=new URL(request.url);
    if(url.searchParams.get("base")==="1"){
      const pdf=await readFile(join(process.cwd(),"private","manual","Manual_do_Revendedor_LORD_NUTRI.pdf"));
      return new Response(new Uint8Array(pdf),{headers:{...privateHeaders,"Content-Type":"application/pdf","Content-Length":String(pdf.byteLength),"Content-Disposition":'inline; filename="Manual_do_Revendedor_LORD_NUTRI_BASE.pdf"'}});
    }
    const studio=await getStudioDoc("manual");
    const pages=(studio.published as {pages?:Parameters<typeof buildManualPdf>[0]}).pages||[];
    const pageImages=await Promise.all(pages.map((_:unknown,index:number)=>readFile(join(process.cwd(),"private","manual","pages",`page-${String(index+1).padStart(2,"0")}.jpg`))));
    const pdf=buildManualPdf(pages,pageImages);
    return new Response(new Uint8Array(pdf),{headers:{...privateHeaders,"Content-Type":"application/pdf","Content-Length":String(pdf.byteLength),"Content-Disposition":'inline; filename="Manual_do_Revendedor_LORD_NUTRI_Publicado.pdf"'}});
  }catch(error){
    const m=error instanceof Error?error.message:"";
    const status=m==="UNAUTHORIZED"?401:["PASSWORD_REQUIRED","FORBIDDEN_MANUAL"].includes(m)?403:503;
    return Response.json({error:m==="UNAUTHORIZED"?"Entre no portal para acessar o material.":m==="PASSWORD_REQUIRED"?"Atualize sua senha para acessar o material.":m==="FORBIDDEN_MANUAL"?"Material exclusivo para compradores de kit com pagamento confirmado e acesso liberado.":"Não foi possível abrir o manual."},{status,headers:privateHeaders});
  }
}
