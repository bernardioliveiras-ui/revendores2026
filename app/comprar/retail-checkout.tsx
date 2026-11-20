import Image from "next/image";
import { LegalFooter } from "@/components/legal-footer";
import { CheckoutForm } from "./checkout-form";

export function RetailCheckout({ code }: { code: string }) {
  return (
    <main className="purchase-checkout">
      <header className="purchase-topbar">
        <a href="https://mix10pro.com.br/lp-v2" className="purchase-back" aria-label="Voltar para conhecer o MIX10 PRO">‹</a>
        <span className="purchase-wordmark">MIX10<span>PRO</span></span>
        <div className="purchase-toplinks"><a href="https://mix10pro.com.br/lp-v2" target="_blank" rel="noopener noreferrer">Institucional ↗</a><span className="purchase-protected">Compra protegida</span></div>
      </header>
      <div className="purchase-container">
        <CheckoutForm salesCode={code} />
        <section className="purchase-materials" aria-label="Fotos e depoimentos">
          <h2>Conheça o MIX10 PRO</h2>
          <div className="purchase-photos">
            <a href="/checkout-mix10/produto-original.png" target="_blank" rel="noopener noreferrer"><Image src="/checkout-mix10/produto-original.png" alt="Embalagens MIX10 PRO" width={1448} height={1086} unoptimized /></a>
            <a href="/checkout-mix10/formula-original.png" target="_blank" rel="noopener noreferrer"><Image src="/checkout-mix10/formula-original.png" alt="Infográfico da fórmula MIX10 PRO" width={1024} height={1536} unoptimized /></a>
          </div>
          <h2>Vídeos e depoimentos</h2>
          <div className="purchase-videos">
            <figure><figcaption>Maria do Socorro</figcaption><video controls playsInline preload="none" src="/checkout-mix10/maria-do-socorro.mp4" aria-label="Depoimento de Maria do Socorro" /></figure>
            <figure><figcaption>Conheça mais sobre o MIX10 PRO</figcaption><video controls playsInline preload="none" src="/checkout-mix10/video-produto.mp4" aria-label="Vídeo sobre MIX10 PRO" /></figure>
          </div>
          <a className="purchase-institutional" href="https://mix10pro.com.br/lp-v2" target="_blank" rel="noopener noreferrer">Institucional · Mais informações sobre o MIX10 PRO ↗</a>
        </section>
        <div className="purchase-legal"><LegalFooter /></div>
      </div>
      <a className="purchase-help" aria-label="Falar com o suporte LORD NUTRI pelo WhatsApp"
        href={`https://wa.me/5511934924155?text=${encodeURIComponent("Olá, equipe LORD NUTRI! Preciso de ajuda para concluir minha compra do MIX10 PRO. Código do link: " + code)}`}
        target="_blank" rel="noopener noreferrer">Suporte</a>
    </main>
  );
}
