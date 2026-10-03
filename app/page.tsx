/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Package, Truck, ChartNoAxesCombined, ShieldCheck, Check, Plus, Leaf, Layers3 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { WelcomeVideo } from "@/components/welcome-video";
import { CheckoutForm } from "@/components/checkout-form";
import { GoogleReviews } from "@/components/google-reviews";
import { ProfitSimulator } from "@/components/profit-simulator";
import { KitLink } from "@/components/kit-link";

const constituents = ["Cálcio", "Magnésio", "Vitamina C", "Curcumina", "Vitamina D3", "Vitamina K2 MK-7", "Manganês", "MSM", "Colágeno tipo II", "Sulfato de condroitina"];
const faqs = [
  ["Como funciona a revenda?", "Você compra um kit da LORD NUTRI, recebe as caixas de MIX10PRO e revende diretamente aos seus clientes. Seu resultado vem da diferença entre o preço de venda e seus custos."],
  ["Isso é multinível?", "Não. O modelo é de compra e revenda de produto físico. Não há remuneração por recrutamento."],
  ["Quem entrega o produto?", "A LORD NUTRI envia o kit ao endereço informado no checkout. Depois, você organiza a entrega das caixas aos seus clientes."],
  ["Quais são as formas de pagamento?", "PIX ou cartão em até 6x pelo Asaas. O frete, as condições de parcelamento, as taxas e o total final aparecem antes da confirmação."],
  ["Quando recebo acesso ao portal?", "Após a confirmação do pagamento, você recebe as orientações de acesso. No portal, pode acompanhar o pedido, consultar materiais e organizar suas vendas."],
  ["Preciso ter experiência para começar?", "Não é obrigatório. Você recebe um manual de apoio, mas a revenda exige divulgação, organização e atendimento. Não há garantia de vendas ou de renda."],
];
export const metadata = { alternates: { canonical: "https://revendedores.mix10pro.com.br/" } };

export default function Home() {
  const hasVideo = Boolean(process.env.VSL_EMBED_URL || process.env.VSL_VIDEO_URL);
  return <main className="lord-site">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "LORD NUTRI", legalName: "LORD GROUP NETWORK EPP", url: "https://revendedores.mix10pro.com.br/", logo: "https://revendedores.mix10pro.com.br/brand/lordnutri-group.png", makesOffer: { "@type": "Offer", itemOffered: { "@type": "Product", name: "MIX10PRO" } } }) }} />
    <a className="skip-link" href="#inicio">Ir para o conteúdo</a>
    <header className="site-header">
      <div className="site-header-inner shell">
        <a href="#inicio" className="site-brand" aria-label="LORD NUTRI — início"><BrandLogo compact /></a>
        <nav aria-label="Navegação principal"><a href="#mix10pro">O produto</a><a href="#como-funciona">Como funciona</a><a href="#simulador">Calculadora</a><a href="#kits">Kits de revenda</a></nav>
        <Link href="/entrar" className="portal-link">Meu portal <ArrowUpRight size={16}/></Link>
      </div>
    </header>

    <section id="inicio" className="hero-section shell">
      <div className="hero-editorial">
        <span className="eyebrow"><span/> PROGRAMA DE REVENDEDORES</span>
        <h1>Uma marca forte.<br/>Um novo capítulo<br/><em>para você.</em></h1>
        <p className="hero-description">Faça parte da LORD NUTRI. Conheça o MIX10PRO e transforme sua rede de contatos em oportunidades de revenda.</p>
        <div className="hero-actions"><a href="#kits" className="primary-button">Quero ser revendedor <ArrowUpRight size={18}/></a><a href="#mix10pro" className="text-link">Conhecer o produto <ArrowRight size={16}/></a></div>
        <div className="hero-details"><span><Check size={15}/> Kits a partir de 20 caixas</span><span><Check size={15}/> PIX ou cartão em até 6x</span></div>
      </div>
      <div className="hero-showcase">
        <span className="showcase-overline">LORD NUTRI APRESENTA</span>
        <div className="product-stage"><div className="product-orbit"/><img src="/brand/mix10-cutout.png" alt="Caixa completa MIX10PRO da LORD NUTRI" width={1086} height={1448} fetchPriority="high" className="hero-pack"/></div>
        <div className="showcase-caption"><span>MIX10<span className="gold">PRO</span></span><small>SUPLEMENTO ALIMENTAR<br/>30 CÁPSULAS · 500 MG</small></div>
      </div>
      <div className="hero-bottom"><span>SEU NEGÓCIO, PASSO A PASSO</span><a href="#como-funciona">Descubra as possibilidades <ArrowRight size={15}/></a></div>
    </section>

    <section className="trust-strip"><div className="shell"><span><Package/> Produto físico</span><span><Truck/> Entrega do seu kit</span><span><Layers3/> Material de apoio</span><span><ChartNoAxesCombined/> Portal de gestão</span></div></section>

    <section id="mix10pro" className="product-section section-space shell">
      <div className="section-intro"><span className="eyebrow">01 / O PRODUTO</span><h2>Bem-estar na fórmula.<br/><em>Possibilidades na revenda.</em></h2><p>O MIX10PRO é o suplemento alimentar da LORD NUTRI que reúne vitaminas, minerais e outros constituintes em uma única fórmula.</p></div>
      <div className="product-layout">
        <div className="product-display"><span className="product-label"><Leaf size={15}/> MIX10PRO</span><img src="/brand/mix10-cutout.png" alt="Embalagem MIX10PRO, 30 cápsulas" width={1086} height={1448} loading="lazy"/><div className="product-specs"><span><b>30</b> cápsulas</span><span><b>10</b> constituintes</span><span><b>500 mg</b> por cápsula</span></div></div>
        <div className="product-information"><h3>Conheça a composição</h3><p>Dez constituintes declarados no material do produto, organizados para você conhecer e apresentar a fórmula.</p><div className="ingredient-list">{constituents.map((name,i)=><div key={name}><span>{String(i+1).padStart(2,"0")}</span><strong>{name}</strong><Plus size={14}/></div>)}</div><a href="/brand/mix10-details.jpg" target="_blank" rel="noopener noreferrer" className="text-link">Consultar a embalagem e o rótulo <ArrowUpRight size={16}/></a></div>
      </div>
      <div className="benefits-heading"><span className="eyebrow">ENTENDA OS NUTRIENTES</span><h3>Funções que fazem parte do cuidado diário.</h3></div>
      <div className="benefit-grid"><article><span>01</span><h3>Ossos e dentes</h3><p>O cálcio participa da formação e manutenção de ossos e dentes.</p></article><article><span>02</span><h3>Função muscular</h3><p>O magnésio participa do funcionamento muscular e do metabolismo energético.</p></article><article><span>03</span><h3>Formação de colágeno</h3><p>A vitamina C participa da formação de colágeno e da proteção antioxidante.</p></article></div>
      <p className="fine-print product-note">As funções descritas são dos nutrientes. Consulte no rótulo as quantidades por porção, o modo de uso e as advertências. MIX10PRO é suplemento alimentar, não medicamento. <a href="https://www.gov.br/anvisa/pt-br/assuntos/alimentos/suplementos-alimentares/conheca-os-beneficios-comprovados" target="_blank" rel="noopener noreferrer">Saiba mais · Anvisa</a></p>
    </section>

    <section id="como-funciona" className="business-section section-space"><div className="shell"><div className="split-heading"><div><span className="eyebrow">02 / SUA REVENDA</span><h2>Começar pode ser simples.<br/><em>Construir é com você.</em></h2></div><p>Produto em mãos, informação para apresentar e um portal para acompanhar sua operação.</p></div><div className="steps-grid">{[
      ["01","Escolha seu kit","Compare o investimento e o custo por caixa. Escolha entre 20 ou 50 unidades de MIX10PRO."],
      ["02","Receba e conheça","Receba o estoque, consulte o manual e prepare sua apresentação para os primeiros clientes."],
      ["03","Venda e acompanhe","Revenda para sua rede, registre as vendas e acompanhe estoque e pedidos pelo portal."],
    ].map(([n,title,text])=><article key={n}><span className="step-number">{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div><p className="fine-print">Modelo de compra e revenda. O resultado depende das vendas, dos custos e da dedicação de cada revendedor.</p>{hasVideo?<div className="brand-video"><div><span className="eyebrow">CONHEÇA A LORD NUTRI</span><h3>Seu próximo capítulo começa aqui.</h3></div><WelcomeVideo embedUrl={process.env.VSL_EMBED_URL} videoUrl={process.env.VSL_VIDEO_URL}/></div>:null}</div></section>

    <section id="simulador" className="calculator-section section-space shell"><div className="section-intro"><span className="eyebrow">03 / PLANEJE SEU RESULTADO</span><h2>O próximo passo<br/><em>começa nos números.</em></h2><p>Defina sua meta e compare os dois kits. A calculadora considera o preço de revenda, os dias trabalhados e as despesas que você informar.</p></div><ProfitSimulator/></section>

    <section id="kits" className="kits-section section-space"><div className="shell"><div className="section-intro centered"><span className="eyebrow">04 / ESCOLHA SEU KIT</span><h2>Seu estoque inicial.<br/><em>Seu ponto de partida.</em></h2><p>O mesmo MIX10PRO. Duas condições para começar.</p></div><div className="kit-cards">
      <article className="kit-card"><div className="kit-heading"><span className="kit-label">PARA COMEÇAR</span><Package size={25}/></div><h3>KIT<span>20</span></h3><p className="kit-description">20 caixas para as suas primeiras vendas.</p><div className="kit-price"><small>R$</small> 1.498<span>,00</span></div><p className="unit-cost">R$ 74,90 por caixa</p><div className="kit-metrics"><div><span>Revenda de referência</span><b>R$ 109,90 / caixa</b></div><div><span>Diferença bruta por caixa</span><b>R$ 35,00</b></div><div><span>Diferença bruta do kit</span><b>R$ 700,00</b></div></div><KitLink kit="kit20" className="secondary-button full">Escolher KIT20 <ArrowUpRight size={17}/></KitLink></article>
      <article className="kit-card featured"><div className="kit-heading"><span className="kit-label">MELHOR CUSTO POR CAIXA</span><Package size={25}/></div><h3>KIT<span>50</span></h3><p className="kit-description">50 caixas para ampliar suas possibilidades.</p><div className="kit-price"><small>R$</small> 3.495<span>,00</span></div><p className="unit-cost">R$ 69,90 por caixa <span>R$ 5 a menos por unidade</span></p><div className="kit-metrics"><div><span>Revenda de referência</span><b>R$ 109,90 / caixa</b></div><div><span>Diferença bruta por caixa</span><b>R$ 40,00</b></div><div><span>Diferença bruta do kit</span><b>R$ 2.000,00</b></div></div><KitLink kit="kit50" className="primary-button full">Escolher KIT50 <ArrowUpRight size={17}/></KitLink></article>
    </div><p className="fine-print kit-footnote">Diferenças brutas antes de frete, taxas, impostos, descontos e outras despesas. Frete calculado pelo CEP. PIX ou cartão em até 6x, com condições exibidas no checkout.</p></div></section>

    <section id="checkout" className="checkout-section section-space shell"><div className="checkout-layout"><div className="checkout-intro"><span className="eyebrow">05 / COMECE COM A LORD NUTRI</span><h2>Seu kit.<br/>Seu negócio.<br/><em>Sua próxima etapa.</em></h2><p>Escolha seu estoque e preencha os dados para a entrega. Você confere todos os valores antes de seguir para o pagamento.</p><div className="checkout-assurances"><div><ShieldCheck/><span><strong>Pagamento pelo Asaas</strong><small>PIX ou cartão, com o total apresentado antes de pagar.</small></span></div><div><Truck/><span><strong>Entrega acompanhada</strong><small>Consulte o andamento do pedido pelo portal.</small></span></div><div><Layers3/><span><strong>Apoio para começar</strong><small>Manual do revendedor e acesso à sua área de gestão.</small></span></div></div></div><CheckoutForm/></div></section>

    <GoogleReviews/>
    <section className="faq-section section-space shell"><div><span className="eyebrow">ANTES DE COMEÇAR</span><h2>Ficou alguma<br/><em>dúvida?</em></h2><p>Encontre as respostas mais comuns ou fale com a equipe.</p><a className="text-link" href={`https://wa.me/${process.env.NEXT_PUBLIC_BKO_WHATSAPP || "5511934924155"}`} target="_blank" rel="noopener noreferrer">Falar com a LORD NUTRI <ArrowUpRight size={16}/></a></div><div className="faq-list">{faqs.map(([q,a])=><details key={q}><summary>{q}<Plus size={18}/></summary><p>{a}</p></details>)}</div></section>
    <footer className="site-footer"><div className="shell footer-main"><div className="footer-brand"><BrandLogo/><p>Bem-estar, oportunidades<br/>e um novo capítulo.</p></div><div><span>EXPLORE</span><a href="#mix10pro">MIX10PRO</a><a href="#simulador">Calculadora de ganhos</a><a href="#kits">Kits de revenda</a><Link href="/entrar">Portal do revendedor</Link></div><div><span>INFORMAÇÕES</span><Link href="/termos-de-uso">Termos de uso</Link><Link href="/politica-de-privacidade">Privacidade</Link><Link href="/reembolso-e-devolucao">Reembolso e devolução</Link><Link href="/cookies">Cookies</Link></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} LORD NUTRI. Todos os direitos reservados.</span><span>LORD GROUP NETWORK EPP · CNPJ 47.201.289/0001-70</span></div></footer>
  </main>;
}
