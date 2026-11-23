import { privatePageMetadata } from "@/lib/seo";
import { ActivateResellerForm } from "./activate-reseller-form";

export const metadata = {...privatePageMetadata,title:"Ativar revendedor · LORD NUTRI"};
export default function Page(){return <main className="auth-page"><ActivateResellerForm/></main>}
