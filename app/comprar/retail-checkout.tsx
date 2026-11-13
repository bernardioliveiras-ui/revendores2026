import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";
import { RETAIL_UNIT_CENTS } from "@/lib/kits";
import { CheckoutForm } from "./checkout-form";

const media = "/checkout-mix10";
const price = (RETAIL_UNIT_CENTS / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function RetailCheckout({ code }: { code: string }) {
  return (
    <main className="min-h-screen bg-[#f5f8f5] text-[#102b21]">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 sm:py-8">
        <header className="mb-5 flex items-center justify-between border-b border-[#dbe4dd] pb-4">
          <BrandLogo mark />
          <span className="text-sm font-semibold text-[#33604c]">Checkout MIX10 PRO</span>
        </header>
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr] lg:gap-9">
          <section aria-labelledby="mix10-title" className="min-w-0 overflow-hidden rounded-3xl border border-[#dbe4dd] bg-white">
            <Image src={media + "/produto.webp"} alt="Embalagens MIX10 PRO da Lord Nutri" width={1448} height={1086}
              sizes="(max-width: 1023px) 100vw, 540px" className="block h-auto w-full" preload />
            <div className="p-5 sm:p-7">
              <h1 id="mix10-title" className="text-4xl font-black tracking-tight">MIX10 PRO</h1>
              <p className="mt-2 text-base text-[#456257]">Suplemento alimentar · 30 cápsulas por caixa</p>
              <p className="mt-4 text-2xl font-bold text-[#066247]">{price} <span className="text-sm font-medium">por caixa</span></p>
              <a href="#pedido" className="mt-4 inline-block font-semibold underline underline-offset-4 lg:hidden">Escolher quantidade</a>
            </div>
          </section>
          <section id="pedido" aria-label="Dados e pagamento do pedido" className="min-w-0 scroll-mt-4">
            <CheckoutForm salesCode={code} />
          </section>
        </div>
        <section className="mt-10 grid items-start gap-6 lg:grid-cols-2">
          <details className="overflow-hidden rounded-2xl border border-[#dbe4dd] bg-white p-5">
            <summary className="cursor-pointer text-lg font-bold">Conheça a fórmula</summary>
            <a className="mt-3 inline-block text-sm font-semibold underline" href={media + "/formula.webp"} target="_blank" rel="noreferrer">Abrir infográfico em tamanho maior</a>
            <Image src={media + "/formula.webp"} alt="Infográfico com os ingredientes do MIX10 PRO" width={1024} height={1536}
              sizes="(max-width: 1023px) 100vw, 540px" className="mt-4 h-auto w-full rounded-xl" />
          </details>
          <details className="rounded-2xl border border-[#dbe4dd] bg-white p-5">
            <summary className="cursor-pointer text-lg font-bold">Vídeos e depoimento</summary>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <figure className="min-w-0">
                <figcaption className="mb-2 font-semibold">Maria do Socorro</figcaption>
                <video controls playsInline preload="none" aria-label="Depoimento de Maria do Socorro"
                  className="aspect-[4/5] w-full rounded-xl bg-[#132c24] object-contain" src={media + "/maria-do-socorro.mp4"} />
              </figure>
              <figure className="min-w-0">
                <figcaption className="mb-2 font-semibold">Vídeo sobre o MIX10 PRO</figcaption>
                <video controls playsInline preload="none" aria-label="Segundo vídeo do MIX10 PRO"
                  className="aspect-[4/5] w-full rounded-xl bg-[#132c24] object-contain" src={media + "/video-produto.mp4"} />
              </figure>
            </div>
          </details>
        </section>
        <div className="mt-8"><LegalFooter /></div>
      </div>
    </main>
  );
}
