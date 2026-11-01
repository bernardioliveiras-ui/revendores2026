import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {requireAdmin} from "@/lib/auth";
import {privatePageMetadata} from "@/lib/seo";
import {readLandingTextDocument} from "@/lib/landing-texts-store";
import {LandingTextPreview} from "@/components/landing-text-preview";
export const dynamic="force-dynamic";
export const metadata={...privatePageMetadata,title:"Prévia dos textos da LP"};
export default async function TextPreview(){
 const h=await headers();
 try{const user=await requireAdmin(new Request("https://internal/painel/studio/previa",{headers:new Headers(h)}));if(user.mustChangePassword)redirect("/trocar-senha");}catch{redirect("/entrar");}
 const doc=await readLandingTextDocument().catch(()=>null);
 if(!doc)return <main className="portal-loading"><p>Não foi possível carregar a prévia. Recarregue o rascunho no BKO.</p></main>;
 return <LandingTextPreview initialTexts={doc.texts}/>;
}
