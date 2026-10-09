import { privatePageMetadata } from "@/lib/seo";
export const metadata = { ...privatePageMetadata, title: 'Escolha seu kit' };
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";
import { CheckoutForm } from "./checkout-form";

export default function ComprarPage() {
  return <main className="min-h-screen bg-[#0c2235] px-5 py-10 text-white"><div className="mx-auto max-w-[980px]"><Link href="/"><BrandLogo mark /></Link><div className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><section><span className="eyebrow-dark">Comece sua revenda</span><h1 className="mt-5 text-5xl font-black leading-[.95] tracking-[-.05em]">Escolha o kit e já deixe seus dados de envio.</h1><p className="mt-5 text-base leading-7 text-white/60">Depois que o Asaas confirmar o pagamento, seu acesso ao portal é criado e o kit entra em separação.</p></section><CheckoutForm /></div><div className="mt-10"><LegalFooter dark /></div></div></main>;
}
