import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";
import Link from "next/link";

export function LegalShell({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#edf4f1] text-[#0b2821]">
      <header className="border-b border-[#d6e3df] bg-[#061510] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link href="/"><BrandLogo compact /></Link>
          <Link href="/entrar" className="text-sm font-semibold text-white/70 hover:text-white">Acessar portal</Link>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <span className="text-xs font-black uppercase tracking-[.18em] text-[#08705c]">MIX10 PRO · Informações legais</span>
        <h1 className="mt-4 text-4xl font-black tracking-[-.045em] sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#60766f]">{intro}</p>
        <article className="legal-document mt-10 rounded-[1.75rem] border border-[#d5e2de] bg-white p-6 shadow-sm sm:p-10">
          {children}
        </article>
        <div className="mt-8"><LegalFooter /></div>
      </section>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mb-8"><h2 className="mb-3 text-xl font-black">{title}</h2><div className="space-y-3 text-sm leading-7 text-[#536a63]">{children}</div></section>;
}
