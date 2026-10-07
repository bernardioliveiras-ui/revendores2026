/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages -- Os links de kit remontam o checkout para ler a seleção da URL. */
import Link from "next/link";
import { Activity, Building2, Heart, MessageCircle, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { BrandText } from "@/components/brand-text";
import { WelcomeVideo } from "@/components/welcome-video";
import { CheckoutForm } from "@/components/checkout-form";
import { ProfitSimulator } from "@/components/profit-simulator";
import { ContentRuntime } from "@/components/content-runtime";
import { GoogleReviews } from "@/components/google-reviews";
import "./landing.css";

const steps = [
  ["Escolha seu kit", "Comece com 20 ou 50 caixas. Confira valores, frete e parcelamento antes de pagar."],
  ["Receba da LORD NUTRI", "Conclua seu pedido. A LORD NUTRI envia o kit para seu endereço."],
  ["Comece suas vendas", "Apresente o produto, atenda e entregue. Seu resultado vem das vendas, descontados os custos."],
];
const trustReasons = [
  { title: "Uma marca identificada", text: "Conheça a empresa responsável, os canais oficiais e as informações do produto antes de decidir.", Icon: Building2 },
  { title: "Compra com clareza", text: "Confira o kit, o frete e o total do parcelamento antes de pagar. Planeje seu investimento com informação.", Icon: WalletCards },
  { title: "Relacionamento próximo", text: "Um canal oficial para dúvidas sobre o produto, seus pedidos e as condições comerciais.", Icon: MessageCircle },
];
const benefits = [
  { title: "Mobilidade", text: "A vitamina D auxilia no funcionamento muscular, que faz parte da sua rotina de movimento.", Icon: Activity },
  { title: "Conforto", text: "Um cuidado nutricional que se soma à alimentação e aos seus hábitos de bem-estar.", Icon: Heart },
  { title: "Movimento", text: "O magnésio contribui para as funções muscular e neuromuscular.", Icon: Activity },
  { title: "Qualidade de vida", text: "Vitamina C e magnésio participam do metabolismo energético do organismo.", Icon: Sparkles },
  { title: "Cuidado diário", text: "A vitamina C tem ação antioxidante e auxilia o funcionamento do sistema imune.", Icon: ShieldCheck },
];
const activeIngredients = [
  ["Curcumina", "80 mg"], ["Colágeno tipo II", "35 mg"], ["Magnésio", "77 mg"],
  ["Cálcio", "180 mg"], ["Vitamina C", "45 mg"], ["Manganês", "2,3 mg"],
  ["MSM", "60 mg"], ["Sulfato de condroitina", "38 mg"],
  ["Vitamina D3", "38 µg"], ["Vitamina K (MK-7)", "92 µg"],
];
const faqs = [
  ["Isso é multinível?", "Não. O resultado apresentado vem da compra e da revenda dos produtos aos clientes. Não há remuneração por recrutamento."],
  ["Quem entrega o produto?", "A LORD NUTRI envia o kit para o revendedor. Depois, o revendedor organiza a entrega das caixas aos seus próprios clientes."],
  ["Já existe plataforma e treinamento?", "A plataforma de apoio e os treinamentos estão em desenvolvimento. Não devem ser anunciados como acesso imediato até estarem disponíveis."],
  ["Posso parcelar?", "O pagamento pode ser feito em até 6x. O checkout deve mostrar os juros e o valor total antes da conclusão."],
  ["Nunca vendi. Posso começar?", "Sim, mas a revenda exige divulgação, atendimento, organização e dedicação comercial. Não há garantia de vendas."],
];

export const metadata = { alternates: { canonical: "https://revendedores.mix10pro.com.br/" } };

function MainCta({ href, label, hero = false }: { href: string; label: string; hero?: boolean }) {
  return <a className={`lnr-button${hero ? " lnr-hero-cta" : ""}`} href={href}><span>{label}</span></a>;
}

export default function Home() {
  const hasVideo = Boolean(process.env.VSL_EMBED_URL || process.env.VSL_VIDEO_URL);
  return (
    <main className="lnr-page">
      <ContentRuntime />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "Organization", name: "LORD NUTRI", legalName: "LORD GROUP NETWORK EPP",
        url: "https://revendedores.mix10pro.com.br/", logo: "https://revendedores.mix10pro.com.br/brand/lordnutri-logo-gold-v3.png",
        sameAs: ["https://mix10pro.com.br/lp-v2", "https://www.google.com/maps/search/?api=1&query=LORD%20NUTRI&query_place_id=ChIJCZtZ98MDz5QRWv8YdIPkPic"],
        makesOffer: { "@type": "Offer", itemOffered: { "@type": "Product", name: "MIX10 PRO" } },
      }) }} />
      <div className="lnr-announce" role="note" data-cms-structural-block="announce">
        <div className="lnr-shell"><span>LORD NUTRI</span><i aria-hidden="true" /> <span>REVENDA DIRETA</span><i aria-hidden="true" /> <span>COMECE SUA NOVA ETAPA</span></div>
      </div>
      <header className="lnr-header" data-cms-structural-block="header">
        <div className="lnr-shell lnr-header-inner">
          <a href="#inicio" className="lnr-brand" aria-label="LORD NUTRI — início"><BrandLogo compact /></a>
          <nav aria-label="Navegação principal">
            <a href="#lord-nutri">A marca</a><a href="#beneficios">Benefícios</a><a href="#avaliacoes">Avaliações</a><a href="#modelo">Como começar</a><a href="#kits">Kits</a>
          </nav>
          <Link href="/entrar" className="lnr-login">Entrar no portal </Link>
        </div>
      </header>

      <section id="inicio" className="lnr-hero">
        <div className="lnr-shell lnr-hero-inner">
          <span className="lnr-eyebrow"><BrandText text="PROGRAMA DE REVENDEDORES LORD NUTRI" /></span>
          <h1>Vem realizar seus sonhos com a gente!</h1>
          <p className="lnr-dream"><BrandText text="Construa sua revenda com a LORD NUTRI." /><br/>Relacionamento, atendimento e novas oportunidades.</p>
          <div className="lnr-hero-opportunity">
            <span className="lnr-income-kicker">SUA PRÓXIMA ETAPA PODE COMEÇAR HOJE</span>
            <p className="lnr-income">Meta de faturamento:<strong>R$ 10 mil<span>/mês</span></strong><span>Uma meta para construir com vendas reais, atendimento e dedicação.</span></p>
          </div>
          <div className="lnr-hero-actions"><MainCta hero href="#lord-nutri" label="QUERO COMEÇAR MINHA REVENDA" /><a href="#lord-nutri" className="lnr-text-cta">Conhecer a LORD NUTRI</a></div>
          <p className="lnr-micro">Faturamento é o total das vendas, antes dos custos. A meta não é garantia de resultado.</p>
        </div>
      </section>

      <section id="lord-nutri" className="lnr-section lnr-opportunity">
        <div className="lnr-shell">
          <div className="lnr-opportunity-intro">
            <div className="lnr-brand-story-copy">
              <span className="lnr-eyebrow">E QUEM ESTÁ POR TRÁS DE TUDO ISSO?</span>
              <h2><BrandText text="LORD NUTRI" /></h2>
              <p className="lnr-brand-story-lead"><BrandText text="A marca por trás do programa de revendedores MIX10 PRO." /></p>
              <p><BrandText text="A LORD NUTRI conecta produto, operação e suporte para tornar a revenda mais simples, organizada e segura." /></p>
              <p><BrandText text="O MIX10 PRO é o produto central dessa jornada: uma proposta diferenciada para um consumidor que valoriza cuidados, bem-estar, mobilidade e qualidade de vida." /></p>
            </div>
            <figure className="lnr-people-visual" aria-label="Pessoas conversando em um ambiente acolhedor">
              <img src="/brand/conversa-revenda-1280-v4.webp" srcSet="/brand/conversa-revenda-640-v4.webp 640w, /brand/conversa-revenda-1280-v4.webp 1280w" sizes="(max-width: 700px) 100vw, 58vw" alt="" width="1280" height="853" loading="lazy" decoding="async" />
            </figure>
          </div>
          <div className="lnr-trust-grid" data-cms-dropzone="trust-grid">
            {trustReasons.map(({ title, text, Icon }, index) => <article className="lnr-trust-card" data-cms-group={`trust-card-${index + 1}`} key={title}><Icon aria-hidden="true" size={28} strokeWidth={1.5} /><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <div className="lnr-company-line"><p><strong>LORD GROUP NETWORK EPP</strong><span>CNPJ 47.201.289/0001-70</span></p><a href="mailto:revendedor@lordnutri.com.br">revendedor@lordnutri.com.br</a></div>
          <div className="lnr-inline-action"><MainCta href="#mix10pro" label="CONHECER O MIX10 PRO" /></div>
        </div>
      </section>

      <section id="mix10pro" className="lnr-section lnr-product">
        <div className="lnr-shell">
          <div className="lnr-product-grid">
            <div className="lnr-product-copy">
              <span className="lnr-eyebrow"><BrandText text="UM PRODUTO LORD NUTRI" /></span>
              <h2><BrandText text="Conheça o MIX10 PRO." /></h2>
              <p className="lnr-product-lead">Cuidado diário para a rotina de quem tem 40+.</p>
              <p>Suplemento alimentar em cápsulas que reúne vitaminas, minerais e outros ativos para complementar a alimentação, conforme o rótulo.</p>
              <div className="lnr-product-facts" data-cms-dropzone="product-facts"><div data-cms-group="product-fact-10"><strong data-cms-explicit-key="text:mix10pro:product-fact-10-number">10</strong><span data-cms-explicit-key="text:mix10pro:product-fact-10-label">ativos na fórmula</span></div><div data-cms-group="product-fact-30"><strong data-cms-explicit-key="text:mix10pro:product-fact-30-number">30</strong><span data-cms-explicit-key="text:mix10pro:product-fact-30-label">cápsulas por caixa</span></div><div data-cms-group="product-fact-40"><strong data-cms-explicit-key="text:mix10pro:product-fact-40-number">40+</strong><span data-cms-explicit-key="text:mix10pro:product-fact-40-label">cuidado diário</span></div></div>
              <p className="lnr-anvisa"><span>REGISTRO ANVISA</span><strong>ANVISA nº 2535115572620267</strong></p>
            </div>
            <div className="lnr-product-visual"><img src="/brand/mix10-box-transparent-v3-web.webp" alt="Caixa atualizada MIX10 PRO da LORD NUTRI, sem fundo branco" loading="lazy" decoding="async" width="800" height="1067" /><span>SUPLEMENTO ALIMENTAR</span></div>
          </div>
          <div id="beneficios" className="lnr-benefits">
            <div className="lnr-section-head"><span className="lnr-eyebrow">BENEFÍCIOS</span><h2>Benefícios pensados para o seu corpo</h2><p>Uma abordagem completa para apoiar a sua rotina com leveza e movimento.</p></div>
            <div className="lnr-benefit-grid" data-cms-dropzone="benefit-grid">{benefits.map(({ title, text, Icon }, index) => <article className="lnr-benefit-card" data-cms-group={`benefit-card-${index + 1}`} key={title}><Icon aria-hidden="true" size={28} strokeWidth={1.5} /><h3>{title}</h3><p>{text}</p></article>)}</div>
            <p className="lnr-note">As funções descritas se referem aos nutrientes da fórmula. Suplementação complementa a alimentação e acompanha hábitos saudáveis.</p>
          </div>
          <div className="lnr-product-detail-grid">
            <div><span className="lnr-eyebrow">INFORMAÇÃO PARA APRESENTAR BEM</span><h3><BrandText text="Por que escolher MIX10 PRO para começar sua revenda?" /></h3><p>Uma caixa com composição acessível, orientação de uso e 30 cápsulas. Apresente com clareza, respeite o rótulo e ajude cada cliente a fazer uma escolha informada.</p><p className="lnr-note"><BrandText text="MIX10 PRO é suplemento alimentar, não medicamento." /> Em caso de dúvidas de saúde ou uso de medicamentos, procure orientação profissional.</p></div>
            <div className="lnr-product-pillars" data-cms-dropzone="product-pillars">
              <details className="lnr-disclosure" data-cms-group="product-pillar-actives"><summary><h3>Conheça os 10 ativos</h3><span className="lnr-plus" aria-hidden="true" /></summary><div className="lnr-active-composition"><p>Quantidades por porção diária de 1 cápsula, conforme a embalagem atual.</p><dl>{activeIngredients.map(([name, amount]) => <div key={name}><dt>{name}</dt><dd>{amount}</dd></div>)}</dl></div></details>
              <details className="lnr-disclosure" data-cms-group="product-pillar-guidance"><summary><h3>Uso, conservação e cuidados</h3><span className="lnr-plus" aria-hidden="true" /></summary><div className="lnr-product-guidance"><p><strong>Uso indicado:</strong> 1 cápsula ao dia, para adultos a partir de 19 anos, conforme o rótulo vigente.</p><p><strong>Conservação:</strong> proteger de luz, calor e umidade. Após abrir, consumir em até 45 dias.</p><p><strong>Cuidados:</strong> não indicado para gestantes, lactantes e crianças. Não exceder a recomendação diária. Manter fora do alcance de crianças.</p></div></details>
            </div>
          </div>
          <div className="lnr-inline-action"><MainCta href="#modelo" label="ENTENDER COMO COMEÇAR" /></div>
        </div>
      </section>

      <div className="lnr-proof-section">
        <GoogleReviews />
      </div>

      <section id="modelo" className="lnr-section lnr-model">
        <div className="lnr-shell">
          <div className="lnr-section-head"><span className="lnr-eyebrow">MODELO DE NEGÓCIO</span><h2><BrandText text="Sua revenda LORD NUTRI em 3 passos" /></h2><p>Comece pela sua rede de contatos e construa uma revenda com atendimento próximo.</p></div>
          <div className="lnr-model-facts" data-cms-dropzone="model-facts" aria-label="Condições para começar"><div data-cms-group="model-fact-kits"><strong>20 ou 50</strong><span>caixas no kit</span></div><div data-cms-group="model-fact-payment"><strong>até 6x</strong><span>no pagamento</span></div><div data-cms-group="model-fact-direct"><strong>Revenda direta</strong><span>venda aos seus clientes</span></div></div><div className="lnr-steps" data-cms-dropzone="steps">{steps.map(([title, text], i) => <article className="lnr-step lnr-disclosure" data-cms-group={`step-${i + 1}`} key={title}><div className="lnr-step-heading"><span className="lnr-number">0{i + 1}</span><h3><BrandText text={title} /></h3></div><p><BrandText text={text} /></p></article>)}</div>
          <div className="lnr-care-band" data-cms-group="care-band"><img src="/brand/caminhada-bem-estar-1280-v4.webp" srcSet="/brand/caminhada-bem-estar-640-v4.webp 640w, /brand/caminhada-bem-estar-1280-v4.webp 1280w" sizes="(max-width: 700px) calc(100vw - 32px), (max-width: 1199px) calc((100vw - 48px) / 2), 600px" alt="Casal em uma caminhada ao ar livre" width="1280" height="853" loading="lazy" decoding="async"/><div><span className="lnr-eyebrow">RELACIONAMENTO QUE CONTINUA</span><h3>Clareza para apresentar.<br/>Cuidado para atender.</h3><p>Comece pela sua rede e cresça com um atendimento próximo.</p></div></div><div className="lnr-inline-action"><MainCta href="#simulador" label="VER OS KITS E CALCULAR MEU CENÁRIO" /><p className="lnr-note">Frete à parte. Juros e total do parcelamento aparecem antes do pagamento. A revenda exige dedicação e não há garantia de renda.</p></div>
          {hasVideo ? <details className="lnr-video-details lnr-disclosure"><summary><BrandText text="Boas-vindas à LORD NUTRI" /><span className="lnr-plus" aria-hidden="true" /></summary><WelcomeVideo embedUrl={process.env.VSL_EMBED_URL} videoUrl={process.env.VSL_VIDEO_URL} /></details> : null}
        </div>
      </section>

      <section id="simulador" className="lnr-section lnr-simulator">
        <div className="lnr-shell">
          <div className="lnr-section-head"><span className="lnr-eyebrow">NÚMEROS E SIMULADOR</span><h2>Quanto você quer construir de ganho bruto por mês?</h2><p>Faturamento e ganho bruto são diferentes. Aqui, a conta considera o preço de venda menos o custo das caixas. Inclua suas despesas para refinar o resultado.</p></div>
          <div className="lnr-scenarios" data-cms-dropzone="scenarios">{[1, 2, 3].map((n) => <article className="lnr-scenario" data-cms-group={`scenario-${n}`} key={n}><span className="lnr-scenario-rhythm"><b>{n}</b> {n === 1 ? "caixa por dia" : "caixas por dia"}</span><p>{n * 26} caixas no mês · 26 dias</p><dl><div><dt>Ganho bruto · KIT20</dt><dd>{(n * 910).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</dd></div><div><dt>Ganho bruto · KIT50</dt><dd>{(n * 1040).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</dd></div></dl></article>)}</div>
          <p className="lnr-note">Simulações com preço de referência de R$ 109,90 por caixa. Valores brutos, antes de frete, taxas, juros, impostos, descontos e outras despesas. Vendas e resultados dependem da atuação de cada revendedor.</p>
          <div id="simulador-calculo"><ProfitSimulator /></div>
          <div className="lnr-inline-action"><a href="#kits" className="lnr-button"><span>VER QUAL KIT ATENDE MINHA META</span></a></div>
        </div>
      </section>

      <section id="kits" className="lnr-section lnr-kits">
        <div className="lnr-shell">
          <div className="lnr-section-head"><span className="lnr-eyebrow">OFERTA DOS KITS</span><h2>Escolha seu kit</h2></div>
          <div className="lnr-kit-grid" data-cms-dropzone="kit-grid">
            <article className="lnr-kit" data-cms-group="kit20-card"><span className="lnr-kit-badge">Menor investimento inicial</span><div className="lnr-kit-title"><h3>KIT20</h3><span>20 caixas</span></div><span className="lnr-price-label">Investimento em produtos</span><strong className="lnr-price">R$ 1.498,00</strong><dl><div><dt>Custo por caixa</dt><dd>R$ 74,90</dd></div><div><dt>Venda de referência</dt><dd>R$ 109,90</dd></div><div><dt>Diferença bruta por caixa</dt><dd>R$ 35,00</dd></div><div className="lnr-kit-total"><dt>Diferença bruta se vender todo o kit</dt><dd>R$ 700,00</dd></div></dl><a href="/?kit=kit20#checkout" className="lnr-button lnr-button-outline">QUERO COMEÇAR COM 20 CAIXAS </a></article>
            <article className="lnr-kit lnr-kit-featured" data-cms-group="kit50-card"><span className="lnr-kit-badge">Melhor custo por unidade</span><div className="lnr-kit-title"><h3>KIT50</h3><span>50 caixas</span></div><span className="lnr-price-label">Investimento em produtos</span><strong className="lnr-price">R$ 3.495,00</strong><dl><div><dt>Custo por caixa</dt><dd>R$ 69,90</dd></div><div><dt>Venda de referência</dt><dd>R$ 109,90</dd></div><div><dt>Diferença bruta por caixa</dt><dd>R$ 40,00</dd></div><div className="lnr-kit-total"><dt>Diferença bruta se vender todo o kit</dt><dd>R$ 2.000,00</dd></div></dl><a href="/?kit=kit50#checkout" className="lnr-button">QUERO COMEÇAR COM 50 CAIXAS </a></article>
          </div>
          <p className="lnr-kit-comparison">O KIT50 reduz R$ 5,00 do custo por caixa. Em 50 caixas, isso equivale a R$ 250,00 de economia em relação ao preço do KIT20.</p>
          <p className="lnr-note">Frete à parte nos kits de 20 e 50 caixas. Pagamento em até 6x, com juros e valor total exibidos antes do pagamento. Pedidos acima de 1.000 unidades têm frete grátis, conforme condição comercial.</p>
        </div>
      </section>

      <section id="duvidas" className="lnr-section lnr-faq">
        <div className="lnr-shell lnr-faq-layout"><div><span className="lnr-eyebrow">FAQ</span><h2>Antes de começar.</h2></div><div className="lnr-faq-list" data-cms-dropzone="faq-list">{faqs.map(([title, text], index) => <details className="lnr-disclosure" data-cms-group={`faq-${index + 1}`} key={title}><summary><h3>{title}</h3><span className="lnr-plus" aria-hidden="true" /></summary><p><BrandText text={text} /></p></details>)}</div></div>
      </section>
      <section id="checkout" className="lnr-section lnr-checkout">
        <div className="lnr-shell lnr-checkout-layout"><div><span className="lnr-eyebrow">COMECE SUA REVENDA</span><h2>Escolha seu kit</h2><p>Antes de pagar, você vê o valor dos produtos, o frete e as condições de parcelamento.</p></div><CheckoutForm /></div>
      </section>
      <footer className="lnr-footer"><div className="lnr-shell"><div><BrandLogo compact /><p><BrandText text="MIX10 PRO" /></p><p>Programa de Revendedores</p></div><nav aria-label="Informações e acesso"><Link href="/termos-de-uso">Termos de Uso</Link><Link href="/politica-de-privacidade">Política de Privacidade</Link><Link href="/reembolso-e-devolucao">Reembolso e Devolução</Link><Link href="/entrar">Portal do Revendedor</Link><a className="lnr-google-check" href="https://transparencyreport.google.com/safe-browsing/search?url=https%3A%2F%2Frevendedores.mix10pro.com.br%2F" target="_blank" rel="noopener noreferrer">Consultar segurança do site no Google </a></nav></div></footer>
    </main>
  );
}
