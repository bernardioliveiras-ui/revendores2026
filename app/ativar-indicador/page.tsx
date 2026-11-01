import { privatePageMetadata } from "@/lib/seo";
import { ActivateIndicatorForm } from "./activate-indicator-form";
export const metadata = {...privatePageMetadata,title:"Ativar influenciador · LORD NUTRI"};
export default function ActivateIndicatorPage(){return <main className="auth-page"><ActivateIndicatorForm/></main>}
