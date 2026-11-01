import { landingText, type LandingTexts } from "@/lib/landing-texts";
import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LandingSections } from "@/components/landing-sections";
import { getSiteUrl } from "@/lib/seo";
import "@/app/landing.css";
import "@/app/landing-text-wrap.css";



export function LandingPage({texts={}}:{texts?:LandingTexts}) {
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
      <a className="lnr-skip" href="#inicio">{landingText(texts, "pagina.001")}</a>
      <header className="lnr-header">
        <div className="lnr-shell lnr-header-inner">
          <a href="#inicio" className="lnr-brand" aria-label={landingText(texts, "pagina.002")}><BrandLogo compact /></a>
          <nav aria-label={landingText(texts, "pagina.003")}>
            <a href="#lord-nutri">{landingText(texts, "pagina.004")}</a><a href="#beneficios">{landingText(texts, "pagina.005")}</a><a href="#modelo">{landingText(texts, "pagina.006")}</a><a href="#kits">{landingText(texts, "pagina.007")}</a>
          </nav>
          <Link href="/entrar" className="lnr-login">{landingText(texts, "pagina.008")}</Link>
        </div>
      </header>
      <section id="inicio" className="lnr-hero">
        <div className="lnr-shell lnr-hero-inner">
          <div className="lnr-hero-copy">
            <span className="lnr-eyebrow">{landingText(texts, "inicio.001")}<span className="lnr-lord-name">LORD NUTRI</span></span>
            <h1>{landingText(texts, "inicio.title")}<em>{landingText(texts, "inicio.002")}</em></h1>
            <p className="lnr-dream">{landingText(texts, "inicio.003")}<span className="lnr-lord-name">LORD NUTRI</span>.<br />{landingText(texts, "inicio.004")}</p>
            <p className="lnr-hero-description">{landingText(texts, "inicio.005")}</p>
          </div>
          <div className="lnr-hero-opportunity">
            <span className="lnr-income-kicker"><span aria-hidden="true" />{landingText(texts, "inicio.006")}</span>
            <div className="lnr-income-amount"><strong><span className="lnr-currency">R$</span><span className="lnr-income-digits">10.000</span></strong>{" "}<span className="lnr-income-period">{landingText(texts, "inicio.007")}</span></div>
            <p className="lnr-income-caption">{landingText(texts, "inicio.008")}</p>
            <a className="lnr-button lnr-hero-cta" href="#lord-nutri"><span>{landingText(texts, "inicio.009")}</span><ArrowRight size={22} aria-hidden="true" /></a>
          </div>
          <a className="lnr-hero-scroll" href="#lord-nutri" aria-label={landingText(texts, "inicio.010")}><ArrowDownRight size={24} aria-hidden="true" /></a>
        </div>
      </section>
      <LandingSections texts={texts} />
    </main>
  );
}
