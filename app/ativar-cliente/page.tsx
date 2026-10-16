import { privatePageMetadata } from "@/lib/seo";
import { ActivateClientForm } from "./activate-client-form";
export const metadata = {...privatePageMetadata,title:"Ativar cliente indicado · LORD NUTRI"};
export default function ActivatePage(){return <main className="auth-page"><ActivateClientForm/></main>}
