import Image from "next/image";

import { LegalFooter } from "@/components/legal-footer";
import { RETAIL_UNIT_CENTS } from "@/lib/kits";
import { CheckoutForm } from "./checkout-form";

const media = "/checkout-mix10";
const price = (RETAIL_UNIT_CENTS / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function RetailCheckout({ code }: { code: string }) {
  return (
    <main className="retail-checkout">
      <div className="retail-container">
        <header className="retail-header">
          <div className="retail-brand">
            <Image src="/brand/lordnutri-mark.png" alt="" width={56} height={56} unoptimized />
            <div><strong>LORD NUTRI</strong><span>GROUP</span></div>
          </div>
          <span className="retail-header-label">MIX10 PRO</span>
        </header>
        <div className="retail-grid">
          <section aria-labelledby="mix10-title" className="retail-product">
            <Image src={media + "/produto-original.png"} alt="Embalagens MIX10 PRO da Lord Nutri" width={1448} height={1086}
              unoptimized className="retail-product-image" preload />
            <div className="retail-product-copy">
              <h1 id="mix10-title" className="text-4xl font-black tracking-tight">MIX10 PRO</h1>
              <p className="mt-2 text-base text-[#456257]">Suplemento alimentar · 30 cápsulas por caixa</p>
              <p className="mt-4 text-2xl font-bold text-[#066247]">{price} <span className="text-sm font-medium">por caixa</span></p>
              <a href="#pedido" className="mt-4 inline-block font-semibold underline underline-offset-4 lg:hidden">Escolher quantidade</a>
            </div>
          </section>
          <section id="pedido" aria-label="Dados e pagamento do pedido" className="retail-order">
            <CheckoutForm salesCode={code} />
          </section>
          <section aria-label="Conheça a fórmula MIX10 PRO" className="retail-flyer">
            <a href={media + "/formula-original.png"} target="_blank" rel="noopener noreferrer" aria-label="Abrir flyer da fórmula em tamanho maior">
              <Image src={media + "/formula-original.png"} alt="Flyer MIX10 PRO com os ingredientes da fórmula" width={1024} height={1536}
                unoptimized className="retail-flyer-image" />
            </a>
          </section>
        </div>
        <section className="mt-8">
          <details className="rounded-2xl border border-[#dbe4dd] bg-[#e7f3e9] text-[#102b21] p-5">
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
        <div className="mt-8"><LegalFooter dark /></div>
      </div>
    </main>
  );
}
