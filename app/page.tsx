/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { WelcomeVideo } from "@/components/welcome-video";
import { CheckoutForm } from "@/components/checkout-form";
import { GoogleReviews } from "@/components/google-reviews";
import { ProfitSimulator } from "@/components/profit-simulator";

const mix10Constituents = [
  "Cálcio",
  "Magnésio",
  "Vitamina C",
  "Curcumina",
  "Vitamina D3",
  "Vitamina K2 MK-7",
  "Manganês",
  "MSM",
  "Colágeno tipo II",
  "Sulfato de condroitina",
];

export const metadata = { alternates: { canonical: "https://revendedores.mix10pro.com.br/" } };

export default function Home() {
  return (
    <main className="reseller-lp lp-final-v2">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "LORD NUTRI",
            legalName: "LORD GROUP NETWORK EPP",
            url: "https://revendedores.mix10pro.com.br/",
            logo: "https://revendedores.mix10pro.com.br/brand/lordnutri-logo.png",
            sameAs: [
              "https://mix10pro.com.br/lp-v2",
              "https://www.google.com/maps/search/?api=1&query=LORD%20NUTRI&query_place_id=ChIJCZtZ98MDz5QRWv8YdIPkPic",
            ],
            makesOffer: { "@type": "Offer", itemOffered: { "@type": "Product", name: "MIX10 PRO" } },
          }),
        }}
      />

      <header className="topbar lp2-topbar">
        <a href="#inicio" className="brand" aria-label="LORD NUTRI">
          <BrandLogo compact />
        </a>
        <nav>
          <a href="#lord-nutri">LORD NUTRI</a>
          <a href="#modelo">Modelo</a>
          <a href="#simulador">Simulador</a>
          <a href="#kits">Kits</a>
          <a href="#mix10pro">MIX10 PRO</a>
          <Link href="/entrar" className="login-link">Entrar no portal</Link>
        </nav>
      </header>

      <section id="inicio" className="lp2-hero">
        <div className="section-shell lp2-hero-grid">
          <div className="lp2-hero-copy">
            <span className="lp2-kicker">PROGRAMA DE REVENDEDORES LORD NUTRI</span>
            <h1>Transforme sua rede de contatos em uma nova fonte de renda.</h1>
            <p className="lp2-lead">Revenda produtos LORD NUTRI com estoque próprio, suporte e uma estrutura criada para acompanhar sua operação.</p>

            <div className="lp2-earnings-card" aria-label="Cenário de referência de ganho bruto">
              <span>Construa um cenário de até</span>
              <strong>R$ 10 mil</strong>
              <b>de ganho bruto por mês</b>
              <small>Veja no simulador como esse cenário é calculado. Resultados dependem das vendas realizadas.</small>
            </div>

            <div className="lp2-hero-actions">
              <a className="primary-button lp2-gold-button" href="#simulador">CALCULAR MEU CENÁRIO <span>→</span></a>
              <a className="lp2-text-link" href="#modelo">CONHECER O MODELO <span>↓</span></a>
            </div>
          </div>

          <div className="lp2-brand-stage" aria-label="LORD NUTRI">
            <div className="lp2-brand-glow" />
            <div className="lp2-brand-mark"><BrandLogo mark /></div>
            <div className="lp2-brand-wordmark"><BrandLogo /></div>
            <div className="lp2-stage-copy">
              <span>MARCA • PRODUTO • OPERAÇÃO</span>
              <strong>Uma estrutura para começar e acompanhar sua revenda.</strong>
            </div>
            <div className="lp2-stage-chips"><span>Produto físico</span><span>Portal do revendedor</span><span>Suporte à operação</span></div>
          </div>
        </div>
      </section>

      <section className="lp2-trust-strip" aria-label="Estrutura LORD NUTRI">
        <div className="section-shell lp2-trust-grid">
          <div><b>01</b><span>Marca própria</span></div>
          <div><b>02</b><span>Produto físico</span></div>
          <div><b>03</b><span>Portal do revendedor</span></div>
          <div><b>04</b><span>Suporte à operação</span></div>
        </div>
      </section>

      <section id="lord-nutri" className="lp2-brand-story">
        <div className="section-shell lp2-brand-story-grid">
          <div className="lp2-story-visual">
            <BrandLogo />
            <div className="lp2-story-line" />
            <span>Uma marca. Novas possibilidades.</span>
          </div>
          <div className="lp2-story-copy">
            <span className="lp2-kicker">QUEM SOMOS</span>
            <h2>A oportunidade começa pela LORD NUTRI.</h2>
            <p>A LORD NUTRI conecta produto físico, relacionamento e uma operação simples para quem quer construir suas próprias vendas.</p>
            <div className="lp2-pillar-grid">
              <article><b>Produto</b><span>Mercadoria física para apresentar ao cliente.</span></article>
              <article><b>Estrutura</b><span>Estoque, vendas e pedidos no portal.</span></article>
              <article><b>Relacionamento</b><span>Venda para sua rede e desenvolva recompra.</span></article>
            </div>
          </div>
        </div>
        <GoogleReviews />
      </section>

      <section className="lp2-video-section">
        <div className="section-shell lp2-video-grid">
          <div>
            <span className="lp2-kicker">BOAS-VINDAS</span>
            <h2>Conheça a proposta LORD NUTRI em poucos minutos.</h2>
            <p>Entenda a oportunidade, o modelo de revenda e como sua operação é acompanhada depois da compra.</p>
          </div>
          <WelcomeVideo embedUrl={process.env.VSL_EMBED_URL} videoUrl={process.env.VSL_VIDEO_URL} />
        </div>
      </section>

      <section id="modelo" className="lp2-model-section">
        <div className="section-shell">
          <div className="lp2-section-head">
            <span className="lp2-kicker">MODELO DE NEGÓCIO</span>
            <h2>Começar é simples.</h2>
          </div>
          <div className="lp2-steps">
            <article><b>01</b><h3>Escolha seu kit</h3><p>Defina seu estoque inicial.</p></article>
            <article><b>02</b><h3>Receba da LORD NUTRI</h3><p>Acompanhe pedido e entrega.</p></article>
            <article><b>03</b><h3>Venda e acompanhe</h3><p>Registre vendas e controle seu estoque.</p></article>
          </div>
          <p className="lp2-disclaimer">A revenda exige dedicação comercial. Não há promessa de vendas, renda ou prazo para venda do estoque.</p>
        </div>
      </section>

      <section id="simulador" className="lp2-simulator-section">
        <div className="section-shell">
          <div className="lp2-simulator-spotlight">
            <div>
              <span className="lp2-kicker">CENÁRIO DE REFERÊNCIA</span>
              <h2>E se sua operação chegar a <strong>R$ 10 mil</strong> de ganho bruto no mês?</h2>
              <p>Monte seu cenário e veja quantas caixas seriam necessárias.</p>
            </div>
            <a href="#simulador-calculo" className="lp2-spotlight-arrow" aria-label="Ir para o simulador">↘</a>
          </div>
          <div id="simulador-calculo" className="lp2-simulator-wrap"><ProfitSimulator /></div>
        </div>
      </section>

      <section id="kits" className="lp2-kits-section">
        <div className="section-shell">
          <div className="lp2-section-head compact">
            <span className="lp2-kicker">SEU PONTO DE PARTIDA</span>
            <h2>Escolha o tamanho da sua operação.</h2>
          </div>
          <div className="kit-cards lp2-kit-cards">
            <article className="kit-card">
              <span className="kit-badge">Menor investimento inicial</span>
              <h3>KIT20</h3>
              <strong className="kit-price">R$ 1.498,00</strong>
              <p>20 caixas · R$ 74,90 por caixa</p>
              <ul><li>Venda de referência: R$ 109,90</li><li>Diferença bruta por caixa: R$ 35,00</li><li>Diferença bruta do kit: R$ 700,00</li></ul>
              <Link href="/?kit=kit20#checkout" className="secondary-button">COMEÇAR COM KIT20</Link>
            </article>
            <article className="kit-card featured">
              <span className="kit-badge">Melhor custo por unidade</span>
              <h3>KIT50</h3>
              <strong className="kit-price">R$ 3.495,00</strong>
              <p>50 caixas · R$ 69,90 por caixa</p>
              <ul><li>Venda de referência: R$ 109,90</li><li>Diferença bruta por caixa: R$ 40,00</li><li>Diferença bruta do kit: R$ 2.000,00</li></ul>
              <Link href="/?kit=kit50#checkout" className="primary-button lp2-gold-button">COMEÇAR COM KIT50</Link>
            </article>
          </div>
          <p className="fine-print centered lp2-kit-note">Frete calculado pelo CEP. PIX ou cartão em até 6x; parcelamento, taxa e total final aparecem no checkout antes do redirecionamento ao Asaas.</p>
        </div>
      </section>

      <section id="mix10pro" className="lp2-product-section">
        <div className="section-shell lp2-product-grid">
          <div className="lp2-product-visual">
            <div className="lp2-product-halo" />
            <img src="/brand/mix10-box.png" alt="Embalagem MIX10 PRO da LORD NUTRI" />
          </div>
          <div className="lp2-product-copy">
            <span className="lp2-kicker">UM PRODUTO LORD NUTRI</span>
            <h2>Conheça o MIX10 PRO.</h2>
            <p>Suplemento alimentar em cápsulas com 10 constituintes declarados em uma fórmula de uso prático.</p>
            <div className="mix10-quick-facts lp2-product-facts"><span><strong>30</strong> cápsulas</span><span><strong>10</strong> constituintes</span><span><strong>500 mg</strong> por cápsula</span></div>
            <div className="mix10-constituents lp2-constituents">{mix10Constituents.map((item) => <span key={item}>{item}</span>)}</div>
            <p className="fine-print">MIX10 PRO é suplemento alimentar, não medicamento. Não há promessa de cura, tratamento ou resultado terapêutico.</p>
          </div>
        </div>
      </section>

      <section className="lp2-selling-section">
        <div className="section-shell">
          <div className="lp2-section-head compact">
            <span className="lp2-kicker">COMO VENDER</span>
            <h2>Venda com relacionamento.</h2>
          </div>
          <div className="lp2-selling-grid">
            <article><b>01</b><h3>Ouça</h3><p>Entenda a rotina do cliente.</p></article>
            <article><b>02</b><h3>Apresente</h3><p>Explique o produto de maneira simples.</p></article>
            <article><b>03</b><h3>Acompanhe</h3><p>Faça pós-venda e mantenha relacionamento.</p></article>
          </div>
          <p className="lp2-disclaimer">Evite promessas de cura, tratamento ou resultado garantido.</p>
        </div>
      </section>

      <section className="lp2-portal-section">
        <div className="section-shell lp2-portal-grid">
          <div>
            <span className="lp2-kicker">PORTAL LORD NUTRI</span>
            <h2>Sua operação continua depois da compra.</h2>
            <p>Acompanhe estoque, vendas, pedidos, materiais e reposição em um único ambiente.</p>
            <Link href="/entrar" className="primary-button lp2-gold-button">ACESSAR MEU PORTAL</Link>
          </div>
          <div className="lp2-portal-mock" aria-label="Recursos do portal">
            <div className="lp2-portal-top"><BrandLogo mark /><span>PORTAL DO REVENDEDOR</span></div>
            <div className="lp2-portal-cards"><span>Visão Geral</span><span>Manual</span><span>Estoque</span><span>Vendas</span><span>Pedidos</span><span>Reposição</span></div>
          </div>
        </div>
      </section>

      <section id="checkout" className="checkout-section lp2-checkout-section">
        <div className="section-shell checkout-layout lp2-checkout-layout">
          <div>
            <span className="lp2-kicker">SEU PRÓXIMO PASSO</span>
            <h2>Preencha seus dados e siga para o pagamento.</h2>
            <p>Frete, forma de pagamento, parcelamento, taxa e total final aparecem antes do redirecionamento ao Asaas.</p>
            <div className="checkout-benefits"><span>✓ Dados enviados com segurança</span><span>✓ Pagamento processado pelo Asaas</span><span>✓ Acesso após confirmação do pagamento</span><span>✓ Manual e acompanhamento no portal</span></div>
          </div>
          <CheckoutForm />
        </div>
      </section>

      <section className="lp2-faq-section">
        <div className="section-shell">
          <div className="lp2-section-head compact"><span className="lp2-kicker">DÚVIDAS RÁPIDAS</span><h2>Antes de começar.</h2></div>
          <div className="faq-grid">
            <details><summary>Isso é multinível?</summary><p>Não. O resultado vem da compra e da revenda dos produtos aos clientes. Não há remuneração por recrutamento.</p></details>
            <details><summary>Quem entrega o produto?</summary><p>A LORD NUTRI envia o kit para o revendedor. Depois, o revendedor organiza a entrega das caixas aos próprios clientes.</p></details>
            <details><summary>Posso parcelar?</summary><p>O checkout calcula o frete pelo CEP e mostra PIX ou cartão de 1x a 6x, incluindo a taxa de parcelamento e o total final antes de abrir o Asaas.</p></details>
            <details><summary>Quando recebo acesso ao portal?</summary><p>Após a confirmação do pagamento, você recebe as orientações de acesso pelos canais informados no cadastro.</p></details>
          </div>
        </div>
      </section>

      <section className="lp2-final-cta">
        <div className="section-shell lp2-final-cta-inner">
          <div className="lp2-final-mark"><BrandLogo mark /></div>
          <span className="lp2-kicker">LORD NUTRI</span>
          <h2>Pronto para começar sua operação?</h2>
          <p>Escolha seu kit, receba seu estoque e comece a construir sua base de clientes.</p>
          <div className="lp2-final-actions"><a href="#kits" className="primary-button lp2-gold-button">QUERO SER REVENDEDOR</a><a href="#simulador" className="lp2-text-link light">Calcular meu cenário</a></div>
        </div>
      </section>

      <footer>
        <div className="section-shell footer-grid"><div><strong>LORD NUTRI · MIX10 PRO</strong><p>Programa de Revendedores</p></div><div><Link href="/termos-de-uso">Termos de Uso</Link><Link href="/politica-de-privacidade">Política de Privacidade</Link><Link href="/reembolso-e-devolucao">Reembolso e Devolução</Link><Link href="/entrar">Portal do Revendedor</Link></div></div>
      </footer>
    </main>
  );
}
