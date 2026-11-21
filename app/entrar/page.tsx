import { privatePageMetadata } from "@/lib/seo";
export const metadata = { ...privatePageMetadata, title: 'Acesso ao portal' };
import { LoginForm } from "./login-form";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
  const { perfil } = await searchParams;
  const labels: Record<string,string> = { bko: "BKO", revendedor: "Revendedor", influenciador: "Influenciador" };
  return <main className="auth-page"><LoginForm label={perfil && Object.hasOwn(labels, perfil) ? labels[perfil] : undefined}/></main>;
}
