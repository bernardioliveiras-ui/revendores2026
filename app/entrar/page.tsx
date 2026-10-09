import { privatePageMetadata } from "@/lib/seo";
export const metadata = { ...privatePageMetadata, title: 'Acesso ao portal' };
import { LoginForm } from "./login-form";
export default function LoginPage(){return <main className="auth-page"><LoginForm/></main>}
