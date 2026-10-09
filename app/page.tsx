import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LandingSections } from "@/components/landing-sections";
import { getSiteUrl } from "@/lib/seo";
import "./landing.css";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  const base = getSiteUrl();
  const organization = {
    "@context": "https://schema.org", "@type": "Organization",
    name: "LORD NUTRI", legalName: "LORD GROUP NETWORK EPP",
    url: base, logo: `${base}/brand/lordnutri-logo-gold-v3.png`,
    sameAs: ["https://mix10pro.com.br/lp-v2"],
  };
  return (
    <main className="lnr-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} />
      <a className="lnr-skip" href="#inicio">Ir para o conteúdo</a>
      <header className="lnr-header">
        <div className="lnr-shell lnr-header-inner">
          <a href="#inicio" className="lnr-brand" aria-label="LORD NUTRI — início"><BrandLogo compact /></a>
          <nav aria-label="Navegação principal">
            <a href="#lord-nutri">A marca</a><a href="#beneficios">Benefícios</a><a href="#modelo">Como começar</a><a href="#kits">Kits</a>
          </nav>
          <Link href="/entrar" className="lnr-login">Entrar no portal</Link>
        </div>
      </header>
      <section id="inicio" className="lnr-hero">
        <div className="lnr-shell lnr-hero-inner">
          <div className="lnr-hero-copy">
            <span className="lnr-eyebrow">PROGRAMA DE REVENDEDORES <span className="lnr-lord-name">LORD NUTRI</span></span>
            <h1>Vem realizar seus sonhos <em>com a gente!</em></h1>
            <p className="lnr-dream">Construa sua revenda com a <span className="lnr-lord-name">LORD NUTRI</span>.<br />Relacionamento, atendimento e novas oportunidades.</p>
            <p className="lnr-hero-description">Descubra como um produto com uma proposta diferente pode despertar o interesse de consumidores e abrir espaço para uma nova fonte de renda</p>
          </div>
          <div className="lnr-hero-opportunity">
            <span className="lnr-income-kicker"><span aria-hidden="true" />SUA PRÓXIMA ETAPA PODE COMEÇAR HOJE</span>
            <div className="lnr-income-amount"><strong><span className="lnr-currency">R$</span><span className="lnr-income-digits">10.000</span></strong>{" "}<span className="lnr-income-period">MÊS</span></div>
            <p className="lnr-income-caption">Uma meta para construir com vendas reais, atendimento e dedicação.</p>
            <a className="lnr-button lnr-hero-cta" href="#lord-nutri"><span>QUERO CONHECER ESSA OPORTUNIDADE</span><ArrowRight size={22} aria-hidden="true" /></a>
          </div>
          <a className="lnr-hero-scroll" href="#lord-nutri" aria-label="Conhecer a LORD NUTRI"><ArrowDownRight size={24} aria-hidden="true" /></a>
        </div>
      </section>
      <LandingSections />
    </main>
  );
}
