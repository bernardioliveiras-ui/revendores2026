/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages -- Os links de kit remontam o checkout para ler a seleção da URL. */
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { WelcomeVideo } from "@/components/welcome-video";
import { CheckoutForm } from "@/components/checkout-form";
import { ProfitSimulator } from "@/components/profit-simulator";
import "./landing.css";

const steps = [
  ["Escolha seu kit", "Defina seu ponto de partida: KIT20, com 20 caixas, ou KIT50, com melhor custo por unidade. Antes de pagar, você vê o valor dos produtos, o frete e as condições de parcelamento."],
  ["Receba da LORD NUTRI", "Preencha os dados de entrega e conclua seu pedido. A LORD NUTRI separa e envia suas caixas para o endereço informado."],
  ["Comece suas vendas", "Apresente MIX10 PRO aos seus contatos, atenda seus clientes e entregue os produtos. O seu resultado vem da diferença entre o custo de compra e as suas vendas, depois das despesas da sua operação."],
];
const reasons = [
  ["Construa uma atividade no mercado de saúde e bem-estar", "Revenda um suplemento alimentar em uma categoria ligada à busca por mobilidade, conforto e qualidade de vida."],
  ["Seu resultado acompanha as suas vendas", "Você compra com condição de revendedor e fica com a diferença entre o custo e o preço praticado na venda."],
  ["Tenha um produto físico para apresentar", "MIX10 PRO tem embalagem própria, 30 porções e informações oficiais para apoiar uma apresentação responsável."],
  ["Comece pela sua própria rede de contatos", "Amigos, familiares, vizinhos, colegas e contatos digitais podem conhecer seu atendimento e o produto."],
  ["Conte com a LORD NUTRI no começo da jornada", "O canal oficial responde dúvidas sobre pedido, produto e condições de compra. Materiais e plataforma só devem aparecer quando estiverem disponíveis."],
];
const pillars = [
  ["Fórmula completa", "MIX10 PRO reúne 10 ativos em uma fórmula de suplemento alimentar desenvolvida para a rotina de quem busca mais mobilidade, conforto e qualidade de vida."],
  ["Produto para a rotina", "Cada embalagem possui 30 porções. O revendedor pode explicar o produto usando as informações oficiais de composição, modo de uso e advertências."],
  ["Apresentação profissional", "Um produto com embalagem premium, marca definida e informações acessíveis para ajudar o cliente a decidir com clareza."],
];
const faqs = [
  ["Isso é multinível?", "Não. O resultado apresentado vem da compra e da revenda dos produtos aos clientes. Não há remuneração por recrutamento."],
  ["Quem entrega o produto?", "A LORD NUTRI envia o kit para o revendedor. Depois, o revendedor organiza a entrega das caixas aos seus próprios clientes."],
  ["Já existe plataforma e treinamento?", "A plataforma de apoio e os treinamentos estão em desenvolvimento. Não devem ser anunciados como acesso imediato até estarem disponíveis."],
  ["Posso parcelar?", "O pagamento pode ser feito em até 6x. O checkout deve mostrar os juros e o valor total antes da conclusão."],
  ["Nunca vendi. Posso começar?", "Sim, mas a revenda exige divulgação, atendimento, organização e dedicação comercial. Não há garantia de vendas."],
];

export const metadata = { alternates: { canonical: "https://revendedores.mix10pro.com.br/" } };

function MainCta({ hero = false }: { hero?: boolean }) {
  return <a className={`lnr-button${hero ? " lnr-hero-cta" : ""}`} href="#simulador"><span>VER OS KITS E CALCULAR MEU CENÁRIO</span><span aria-hidden="true">↗</span></a>;
}

export default function Home() {
  const hasVideo = Boolean(process.env.VSL_EMBED_URL || process.env.VSL_VIDEO_URL);
  return (
    <main className="lnr-page">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "Organization", name: "LORD NUTRI", legalName: "LORD GROUP NETWORK EPP",
        url: "https://revendedores.mix10pro.com.br/", logo: "https://revendedores.mix10pro.com.br/brand/lordnutri-logo.png",
        sameAs: ["https://mix10pro.com.br/lp-v2", "https://www.google.com/maps/search/?api=1&query=LORD%20NUTRI&query_place_id=ChIJCZtZ98MDz5QRWv8YdIPkPic"],
        makesOffer: { "@type": "Offer", itemOffered: { "@type": "Product", name: "MIX10 PRO" } },
      }) }} />
      <header className="lnr-header">
        <div className="lnr-shell lnr-header-inner">
          <a href="#inicio" className="lnr-brand" aria-label="LORD NUTRI — início"><BrandLogo compact /></a>
          <nav aria-label="Navegação principal">
            <a href="#modelo">Modelo de negócio</a><a href="#lord-nutri">Oportunidade</a><a href="#simulador">Simulador</a><a href="#kits">Kits</a>
          </nav>
          <Link href="/entrar" className="lnr-login">Entrar no portal <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section id="inicio" className="lnr-hero">
        <div className="lnr-shell lnr-hero-inner">
          <span className="lnr-eyebrow">PROGRAMA DE REVENDEDORES LORD NUTRI</span>
          <h1>Com a <span>LORD NUTRI</span><br />você pode!</h1>
          <p className="lnr-dream">Vem realizar seus sonhos com a gente!</p>
          <p className="lnr-market">O mercado de suplementos movimenta bilhões no Brasil. E cresce porque milhões de pessoas buscam mais mobilidade, conforto e qualidade de vida.</p>
          <div className="lnr-hero-opportunity">
            <p className="lnr-punch">Vire a chave da sua renda.</p>
            <p className="lnr-income">Construa até <strong>R$ 10 mil</strong> <span>de ganho bruto por mês com as suas vendas.</span></p>
          </div>
          <MainCta hero />
          <p className="lnr-micro">Entrada a partir de 20 caixas · Pagamento em até 6x · Frete à parte.</p>
          <a href="#simulador" className="lnr-reference">Cenário de referência · Ver no simulador <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section id="modelo" className="lnr-section lnr-model">
        <div className="lnr-shell">
          <div className="lnr-section-head"><span className="lnr-eyebrow">MODELO DE NEGÓCIO</span><h2>Sua revenda LORD NUTRI em 3 passos</h2><p>Revenda MIX10 PRO com a LORD NUTRI. Escolha seu estoque, receba suas caixas e venda diretamente para sua rede de contatos: amigos, familiares, colegas de trabalho, vizinhos e clientes digitais.</p></div>
          <div className="lnr-steps">{steps.map(([title, text], i) => <details className="lnr-step lnr-disclosure" key={title}><summary><span className="lnr-number">0{i + 1}</span><h3>{title}</h3><span className="lnr-plus" aria-hidden="true" /></summary><p>{text}</p></details>)}</div>
          <div className="lnr-inline-action"><MainCta /><p className="lnr-note">A revenda exige dedicação comercial. Não há promessa de vendas, renda ou prazo para venda do estoque.</p></div>
          {hasVideo ? <details className="lnr-video-details lnr-disclosure"><summary>Boas-vindas à LORD NUTRI<span className="lnr-plus" aria-hidden="true" /></summary><WelcomeVideo embedUrl={process.env.VSL_EMBED_URL} videoUrl={process.env.VSL_VIDEO_URL} /></details> : null}
        </div>
      </section>

      <section id="lord-nutri" className="lnr-section lnr-opportunity">
        <div className="lnr-shell">
          <div className="lnr-opportunity-intro"><div><span className="lnr-eyebrow">O MERCADO E A OPORTUNIDADE</span><h2>Uma oportunidade em um mercado que acompanha uma necessidade real.</h2></div><p>O mercado de suplementos cresce porque cada vez mais pessoas buscam incluir bem-estar e cuidado contínuo na rotina. A LORD NUTRI cria uma forma de você atender esse público com MIX10 PRO e construir suas próprias vendas.</p></div>
          <div className="lnr-reasons-head"><h3>5 motivos para revender MIX10 PRO</h3><p>Com a LORD NUTRI você pode começar uma atividade de revenda com produto em mãos, números claros e espaço para desenvolver suas próprias vendas.</p></div>
          <div className="lnr-reasons">{reasons.map(([title, text], i) => <details className="lnr-disclosure" key={title}><summary><span className="lnr-reason-number">0{i + 1}</span><h4>{title}</h4><span className="lnr-plus" aria-hidden="true" /></summary><p>{text}</p></details>)}</div>
        </div>
      </section>

      <section id="simulador" className="lnr-section lnr-simulator">
        <div className="lnr-shell">
          <div className="lnr-section-head"><span className="lnr-eyebrow">NÚMEROS E SIMULADOR</span><h2>Quanto você quer construir de ganho bruto por mês?</h2><p>Informe sua meta mensal e veja quantas caixas precisaria vender. O simulador mostra ganho bruto de referência e permite considerar despesas para chegar a um cenário mais realista.</p></div>
          <div className="lnr-scenarios">{[1, 2, 3].map((n) => <article className="lnr-scenario" key={n}><span className="lnr-scenario-rhythm"><b>{n}</b> {n === 1 ? "caixa por dia" : "caixas por dia"}</span><p>{n * 26} caixas no mês · 26 dias</p><dl><div><dt>Ganho bruto · KIT20</dt><dd>{(n * 910).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</dd></div><div><dt>Ganho bruto · KIT50</dt><dd>{(n * 1040).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</dd></div></dl></article>)}</div>
          <p className="lnr-note">Simulações com preço de referência de R$ 109,90 por caixa. Valores brutos, antes de frete, taxas, juros, impostos, descontos e outras despesas. Vendas e resultados dependem da atuação de cada revendedor.</p>
          <div id="simulador-calculo"><ProfitSimulator /></div>
          <div className="lnr-inline-action"><a href="#kits" className="lnr-button"><span>VER QUAL KIT ATENDE MINHA META</span><span aria-hidden="true">↓</span></a></div>
        </div>
      </section>

      <section id="mix10pro" className="lnr-section lnr-product">
        <div className="lnr-shell lnr-product-grid">
          <div className="lnr-product-visual"><img src="/brand/mix10-box.png" alt="Embalagem real MIX10 PRO da LORD NUTRI" loading="lazy" width="1086" height="1448" /><span>SUPLEMENTO ALIMENTAR</span></div>
          <div><span className="lnr-eyebrow">UM PRODUTO LORD NUTRI</span><h2>Por que escolher MIX10 PRO para começar sua revenda?</h2><p>Quando você escolhe um produto para revender, precisa de algo que seja fácil de apresentar, tenha posicionamento claro e ajude a construir confiança com o cliente. MIX10 PRO é o primeiro produto da LORD NUTRI para essa jornada.</p><div className="lnr-product-facts"><div><strong>10</strong><span>ativos</span></div><div><strong>30</strong><span>porções</span></div></div><div className="lnr-product-pillars">{pillars.map(([title, text]) => <details className="lnr-disclosure" key={title}><summary><h3>{title}</h3><span className="lnr-plus" aria-hidden="true" /></summary><p>{text}</p></details>)}</div><p className="lnr-anvisa"><span>Processo de Notificação</span><strong>ANVISA nº 2535115572620267</strong></p><p className="lnr-note">MIX10 PRO é suplemento alimentar, não medicamento.</p></div>
        </div>
      </section>

      <section id="kits" className="lnr-section lnr-kits">
        <div className="lnr-shell">
          <div className="lnr-section-head"><span className="lnr-eyebrow">OFERTA DOS KITS</span><h2>Escolha seu kit</h2></div>
          <div className="lnr-kit-grid">
            <article className="lnr-kit"><span className="lnr-kit-badge">Menor investimento inicial</span><div className="lnr-kit-title"><h3>KIT20</h3><span>20 caixas</span></div><span className="lnr-price-label">Investimento em produtos</span><strong className="lnr-price">R$ 1.498,00</strong><dl><div><dt>Custo por caixa</dt><dd>R$ 74,90</dd></div><div><dt>Venda de referência</dt><dd>R$ 109,90</dd></div><div><dt>Diferença bruta por caixa</dt><dd>R$ 35,00</dd></div><div className="lnr-kit-total"><dt>Diferença bruta se vender todo o kit</dt><dd>R$ 700,00</dd></div></dl><a href="/?kit=kit20#checkout" className="lnr-button lnr-button-outline">QUERO COMEÇAR COM 20 CAIXAS <span aria-hidden="true">↗</span></a></article>
            <article className="lnr-kit lnr-kit-featured"><span className="lnr-kit-badge">Melhor custo por unidade</span><div className="lnr-kit-title"><h3>KIT50</h3><span>50 caixas</span></div><span className="lnr-price-label">Investimento em produtos</span><strong className="lnr-price">R$ 3.495,00</strong><dl><div><dt>Custo por caixa</dt><dd>R$ 69,90</dd></div><div><dt>Venda de referência</dt><dd>R$ 109,90</dd></div><div><dt>Diferença bruta por caixa</dt><dd>R$ 40,00</dd></div><div className="lnr-kit-total"><dt>Diferença bruta se vender todo o kit</dt><dd>R$ 2.000,00</dd></div></dl><a href="/?kit=kit50#checkout" className="lnr-button">QUERO COMEÇAR COM 50 CAIXAS <span aria-hidden="true">↗</span></a></article>
          </div>
          <p className="lnr-kit-comparison">O KIT50 reduz R$ 5,00 do custo por caixa. Em 50 caixas, isso equivale a R$ 250,00 de economia em relação ao preço do KIT20.</p>
          <p className="lnr-note">Frete à parte nos kits de 20 e 50 caixas. Pagamento em até 6x, com juros e valor total exibidos antes do pagamento. Pedidos acima de 1.000 unidades têm frete grátis, conforme condição comercial.</p>
        </div>
      </section>

      <section id="duvidas" className="lnr-section lnr-faq">
        <div className="lnr-shell lnr-faq-layout"><div><span className="lnr-eyebrow">FAQ</span><h2>Antes de começar.</h2></div><div className="lnr-faq-list">{faqs.map(([title, text]) => <details className="lnr-disclosure" key={title}><summary><h3>{title}</h3><span className="lnr-plus" aria-hidden="true" /></summary><p>{text}</p></details>)}</div></div>
      </section>
      <section id="checkout" className="lnr-section lnr-checkout">
        <div className="lnr-shell lnr-checkout-layout"><div><span className="lnr-eyebrow">COMECE SUA REVENDA</span><h2>Escolha seu kit</h2><p>Antes de pagar, você vê o valor dos produtos, o frete e as condições de parcelamento.</p></div><CheckoutForm /></div>
      </section>
      <footer className="lnr-footer"><div className="lnr-shell"><div><strong>LORD NUTRI · MIX10 PRO</strong><p>Programa de Revendedores</p></div><nav aria-label="Informações e acesso"><Link href="/termos-de-uso">Termos de Uso</Link><Link href="/politica-de-privacidade">Política de Privacidade</Link><Link href="/reembolso-e-devolucao">Reembolso e Devolução</Link><Link href="/entrar">Portal do Revendedor</Link><a className="lnr-google-check" href="https://transparencyreport.google.com/safe-browsing/search?url=https%3A%2F%2Frevendedores.mix10pro.com.br%2F" target="_blank" rel="noopener noreferrer">Consultar segurança do site no Google <span aria-hidden="true">↗</span></a></nav></div></footer>
    </main>
  );
}
