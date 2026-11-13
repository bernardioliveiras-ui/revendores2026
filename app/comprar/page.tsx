import type { Metadata } from "next";
import { privatePageMetadata, getSiteUrl } from "@/lib/seo";
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ venda?: string | string[] }> }): Promise<Metadata> {
  const { venda } = await searchParams;
  if (typeof venda !== "string" || !/^[a-f0-9]{32}$/.test(venda)) return { ...privatePageMetadata, title: "Comprar MIX10 PRO" };
  const title = "MIX10 PRO | LORD NUTRI";
  const description = "MIX10 PRO com 30 cápsulas por caixa. Escolha a quantidade, calcule o frete e compre com PIX ou cartão.";
  const image = new URL("/checkout-mix10/mix10-compartilhar.png", getSiteUrl()).href;
  return {
    ...privatePageMetadata,
    title: { absolute: title }, description, keywords: ["MIX10 PRO", "LORD NUTRI"],
    openGraph: {
      title, description, siteName: "LORD NUTRI", type: "website", locale: "pt_BR",
      url: new URL("/v/" + venda, getSiteUrl()).href,
      images: [{ url: image, width: 1448, height: 1086, alt: "MIX10 PRO da LORD NUTRI" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";
import { CheckoutForm } from "./checkout-form";
import { RetailCheckout } from "./retail-checkout";

import { notFound } from "next/navigation";
import { resolveCampaign } from "@/lib/campaigns";

export default async function ComprarPage({ searchParams }: { searchParams: Promise<{ venda?: string | string[] }> }) {
  const { venda } = await searchParams;
  const campaign = typeof venda === "string" ? await resolveCampaign(venda) : null;
  if (venda !== undefined && !campaign) notFound();
  if (campaign) return <RetailCheckout code={campaign.code} />;
  return <main className="min-h-screen bg-[#0c2235] px-5 py-10 text-white"><div className="mx-auto max-w-[980px]"><Link href="/"><BrandLogo mark /></Link><div className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><section><span className="eyebrow-dark">Comece sua revenda</span><h1 className="mt-5 text-5xl font-black leading-[.95] tracking-[-.05em]">Escolha o kit e já deixe seus dados de envio.</h1><p className="mt-5 text-base leading-7 text-white/60">Depois que o Asaas confirmar o pagamento, seu acesso ao portal é criado e o kit entra em separação.</p></section><CheckoutForm /></div><div className="mt-10"><LegalFooter dark /></div></div></main>;
}
