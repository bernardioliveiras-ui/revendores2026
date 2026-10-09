import { privatePageMetadata } from "@/lib/seo";
export const metadata = { ...privatePageMetadata, title: 'Trocar senha' };
import { ChangePasswordForm } from "./change-password-form";
export default function ChangePasswordPage(){return <main className="auth-page"><ChangePasswordForm/></main>}
