/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Package, Truck, ChartNoAxesCombined, ShieldCheck, Check, Plus, Leaf, Layers3 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { WelcomeVideo } from "@/components/welcome-video";
import { CheckoutForm } from "@/components/checkout-form";
import { ProfitSimulator } from "@/components/profit-simulator";
import { KitLink } from "@/components/kit-link";

const constituents = ["Cálcio", "Magnésio", "Vitamina C", "Curcumina", "Vitamina D3", "Vitamina K2 MK-7", "Manganês", "MSM", "Colágeno tipo II", "Sulfato de condroitina"];
const faqs = [
  ["Isso é multinível?", "Não. O resultado apresentado vem da compra e da revenda dos produtos aos clientes. Não há remuneração por recrutamento."],
  ["Quem entrega o produto?", "A LORD NUTRI envia o kit para o revendedor. Depois, o revendedor organiza a entrega das caixas aos seus próprios clientes."],
  ["Já existe plataforma e treinamento?", "A plataforma de apoio e os treinamentos estão em desenvolvimento. Não devem ser anunciados como acesso imediato até estarem disponíveis."],
  ["Posso parcelar?", "O pagamento pode ser feito em até 6x. O checkout mostra os juros e o valor total antes da conclusão."],
  ["Nunca vendi. Posso começar?", "Sim, mas a revenda exige divulgação, atendimento, organização e dedicação comercial. Não há garantia de vendas."],
];
export const metadata = { alternates: { canonical: "https://revendedores.mix10pro.com.br/" } };

export default function Home() {
  const hasVideo = Boolean(process.env.VSL_EMBED_URL || process.env.VSL_VIDEO_URL);
  return <main className="lord-site lord-light">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "LORD NUTRI", legalName: "LORD GROUP NETWORK EPP", url: "https://revendedores.mix10pro.com.br/", logo: "https://revendedores.mix10pro.com.br/brand/lord-nutri-transparent-v022.png", makesOffer: { "@type": "Offer", itemOffered: { "@type": "Product", name: "MIX10PRO" } } }) }} />
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
        <p className="hero-invitation">Com a LORD NUTRI você pode!</p><h1>Vire a chave<br/><em>da sua renda.</em></h1><p className="hero-dream">Vem realizar seus sonhos com a gente!</p><p className="hero-market">O mercado de suplementos movimenta bilhões no Brasil. E cresce porque milhões de pessoas buscam mais mobilidade, conforto e qualidade de vida. <a href="#fontes-mercado" aria-label="Consultar fontes de mercado">[1]</a></p>
        <p className="hero-description">Revenda MIX10PRO com a LORD NUTRI. Escolha seu estoque, receba suas caixas e venda diretamente para amigos, familiares, colegas, vizinhos e clientes digitais.</p>
        <p className="hero-opportunity">Construa até <strong>R$ 10 mil de ganho bruto por mês</strong> com as suas vendas.<a href="#simulador">Veja o cenário de referência no simulador <ArrowRight size={14}/></a></p><div className="hero-actions"><a href="#simulador" className="primary-button">Ver os kits e calcular meu cenário <ArrowUpRight size={18}/></a></div>
        <div className="hero-details"><span><Check size={15}/> Entrada a partir de 20 caixas</span><span><Check size={15}/> Pagamento em até 6x</span><span>Frete à parte</span></div>
      </div>
      <div className="hero-showcase">
        <span className="showcase-overline">LORD NUTRI APRESENTA</span>
        <div className="product-stage"><div className="product-orbit"/><img src="/brand/mix10-cutout.png" alt="Caixa completa MIX10PRO da LORD NUTRI" width={1086} height={1448} fetchPriority="high" className="hero-pack"/></div>
        <div className="showcase-caption"><span>MIX10<span className="gold">PRO</span></span><small>SUPLEMENTO ALIMENTAR<br/>30 CÁPSULAS · 500 MG</small></div>
      </div>
      <div className="hero-bottom"><span>SEU NEGÓCIO, PASSO A PASSO</span><a href="#como-funciona">Descubra as possibilidades <ArrowRight size={15}/></a></div>
    </section>

    <section className="trust-strip"><div className="shell"><span><Package/> Produto físico</span><span><Truck/> Entrega do seu kit</span><span><Layers3/> Estoque em mãos</span><span><ChartNoAxesCombined/> Números transparentes</span></div></section>

    <section id="como-funciona" className="business-section section-space dark-accent"><div className="shell"><div className="split-heading"><div><span className="eyebrow">01 / SUA REVENDA EM 3 PASSOS</span><h2>Sua revenda LORD NUTRI<br/><em>em 3 passos.</em></h2></div><p>Escolha, receba e comece. A oportunidade está na compra e revenda de um produto real, para a sua própria rede de clientes.</p></div><div className="steps-grid">{[
      ["01","Escolha seu kit","Defina seu ponto de partida: KIT20, com 20 caixas, ou KIT50, com melhor custo por unidade. Antes de pagar, você vê o valor dos produtos, o frete e as condições de parcelamento."],
      ["02","Receba da LORD NUTRI","Preencha os dados de entrega e conclua seu pedido. A LORD NUTRI separa e envia suas caixas para o endereço informado."],
      ["03","Comece suas vendas","Apresente MIX10PRO aos seus contatos, atenda seus clientes e entregue os produtos. Seu resultado vem da diferença entre o custo de compra e suas vendas, depois das despesas da operação."],
    ].map(([n,title,text])=><article key={n}><span className="step-number">{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div><p className="fine-print">A revenda exige dedicação comercial. Não há promessa de vendas, renda ou prazo para venda do estoque.</p><a href="#simulador" className="primary-button section-cta">Ver os kits e calcular meu cenário <ArrowUpRight size={17}/></a>{hasVideo?<div className="brand-video"><div><span className="eyebrow">CONHEÇA A LORD NUTRI</span><h3>Seu próximo capítulo começa aqui.</h3></div><WelcomeVideo embedUrl={process.env.VSL_EMBED_URL} videoUrl={process.env.VSL_VIDEO_URL}/></div>:null}</div></section>

    <section id="simulador" className="calculator-section section-space shell">
      <div className="market-intro"><span className="eyebrow">02 / MERCADO E OPORTUNIDADE</span><h2>Uma oportunidade em um mercado<br/><em>que acompanha uma necessidade real.</em></h2><p>O mercado de suplementos cresce porque cada vez mais pessoas buscam incluir bem-estar e cuidado contínuo na rotina. A LORD NUTRI cria uma forma de você atender esse público com MIX10PRO e construir suas próprias vendas.</p></div>
      <div className="section-intro"><span className="eyebrow">COLOQUE SUA META NO PAPEL</span><h2>Quanto você quer construir<br/><em>de ganho bruto por mês?</em></h2><p>Informe sua meta mensal e veja quantas caixas precisaria vender. O simulador mostra ganho bruto de referência e permite considerar despesas para chegar a um cenário mais realista.</p></div>
      <div className="daily-scenarios" aria-label="Cenários de vendas em 26 dias">{[["1","26","910,00","1.040,00"],["2","52","1.820,00","2.080,00"],["3","78","2.730,00","3.120,00"]].map(([perDay,boxes,k20,k50])=><article className="daily-scenario" key={perDay}><header><strong>{perDay}</strong><span>{perDay==="1"?"caixa por dia":"caixas por dia"}<small>em 26 dias de venda</small></span></header><p className="scenario-month"><b>{boxes} caixas</b> vendidas no mês</p><dl><div><dt>Ganho bruto · KIT20</dt><dd>R$ {k20}</dd></div><div><dt>Ganho bruto · KIT50</dt><dd>R$ {k50}</dd></div></dl><a href="#calculadora" className="text-link">Calcular meu cenário <ArrowRight size={16}/></a></article>)}</div>
      <p className="fine-print reference-note">Simulações com preço de referência de R$ 109,90 por caixa. Ganhos brutos, antes de frete, taxas, juros, impostos, descontos e demais despesas. Vendas e resultados dependem da atuação de cada revendedor.</p>
      <div id="calculadora"><ProfitSimulator/></div>
      <div className="scenario-note"><strong>Como se chega ao cenário de R$ 10 mil de ganho bruto?</strong><p>250 caixas vendidas no mês por R$ 109,90, com custo de R$ 69,90 por caixa (condição do KIT50): 250 × R$ 40,00 = R$ 10.000,00 de ganho bruto. Esse volume exige a compra de 250 caixas — equivalente a cinco KIT50. Fretes, impostos, taxas, juros, descontos e demais despesas reduzem o resultado. É um cenário de referência, sem garantia de vendas ou renda.</p></div>
      <a href="#kits" className="primary-button section-cta">Ver qual kit atende minha meta <ArrowUpRight size={17}/></a>
    </section>

    <section id="mix10pro" className="product-section section-space shell">
      <div className="section-intro"><span className="eyebrow">03 / POR QUE MIX10PRO</span><h2>Por que escolher MIX10PRO<br/><em>para começar sua revenda?</em></h2><p>Quando você escolhe um produto para revender, precisa de algo que seja fácil de apresentar, tenha posicionamento claro e ajude a construir confiança com o cliente. MIX10PRO é o primeiro produto da LORD NUTRI para essa jornada.</p></div>
      <div className="product-layout">
        <div className="product-display"><span className="product-label"><Leaf size={15}/> MIX10PRO</span><img src="/brand/mix10-cutout.png" alt="Embalagem MIX10PRO, 30 cápsulas" width={1086} height={1448} loading="lazy"/><div className="product-specs"><span><b>30</b> cápsulas</span><span><b>10</b> constituintes</span><span><b>500 mg</b> por cápsula</span></div></div>
        <div className="product-information"><h3>Fórmula com 10 ativos</h3><p>Vitaminas, minerais e outros constituintes em uma fórmula de suplemento alimentar. Conheça a composição para apresentar o produto com clareza e responsabilidade.</p><div className="ingredient-list">{constituents.map((name,i)=><div key={name}><span>{String(i+1).padStart(2,"0")}</span><strong>{name}</strong><Plus size={14}/></div>)}</div><a href="/brand/mix10-details.jpg" target="_blank" rel="noopener noreferrer" className="text-link">Consultar a embalagem e o rótulo <ArrowUpRight size={16}/></a></div>
      </div>
      <div className="benefit-grid product-pillars"><article><span>01</span><h3>Fórmula completa</h3><p>MIX10PRO reúne 10 ativos em uma fórmula de suplemento alimentar desenvolvida para a rotina de quem busca mais mobilidade, conforto e qualidade de vida.</p></article><article><span>02</span><h3>Produto para a rotina</h3><p>O revendedor pode explicar o produto usando as informações oficiais de composição, modo de uso e advertências.</p></article><article><span>03</span><h3>Apresentação profissional</h3><p>Um produto com embalagem premium, marca definida e informações acessíveis para ajudar o cliente a decidir com clareza.</p></article></div><p className="fine-print product-note">MIX10PRO é suplemento alimentar, não medicamento. Consulte no rótulo a composição, o modo de uso e as advertências.</p>
    </section>

    <section className="reasons-section section-space"><div className="shell"><div className="section-intro"><span className="eyebrow">04 / SEU PRÓXIMO PASSO</span><h2>5 motivos para<br/><em>revender MIX10PRO.</em></h2><p>Com a LORD NUTRI você pode começar uma atividade de revenda com produto em mãos, números claros e espaço para desenvolver suas próprias vendas.</p></div><div className="reasons-grid">{[
      ["01","Construa uma atividade no mercado de saúde e bem-estar","Revenda um suplemento alimentar em uma categoria ligada à busca por mobilidade, conforto e qualidade de vida."],
      ["02","Seu resultado acompanha as suas vendas","Você compra com condição de revendedor e fica com a diferença entre o custo e o preço praticado na venda."],
      ["03","Tenha um produto físico para apresentar","MIX10PRO tem embalagem própria e informações oficiais para apoiar uma apresentação responsável."],
      ["04","Comece pela sua própria rede de contatos","Amigos, familiares, vizinhos, colegas e contatos digitais podem conhecer seu atendimento e o produto."],
      ["05","Conte com a LORD NUTRI no começo da jornada","O canal oficial responde dúvidas sobre pedido, produto e condições de compra."],
    ].map(([n,title,copy])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</div><a href="#kits" className="text-link section-cta">Escolher meu kit <ArrowRight size={17}/></a></div></section>

    <section id="kits" className="kits-section section-space"><div className="shell"><div className="section-intro centered"><span className="eyebrow">05 / ESCOLHA SEU KIT</span><h2>Escolha seu kit<br/><em>para começar sua revenda.</em></h2><p>O mesmo MIX10PRO. Duas condições para começar.</p></div><div className="kit-cards">
      <article className="kit-card"><div className="kit-heading"><span className="kit-label">MENOR INVESTIMENTO INICIAL</span><Package size={25}/></div><h3>KIT<span>20</span></h3><p className="kit-description">20 caixas para as suas primeiras vendas.</p><div className="kit-price"><small>R$</small> 1.498<span>,00</span></div><p className="unit-cost">R$ 74,90 por caixa</p><div className="kit-metrics"><div><span>Revenda de referência</span><b>R$ 109,90 / caixa</b></div><div><span>Diferença bruta por caixa</span><b>R$ 35,00</b></div><div><span>Ganho bruto ao vender todo o kit</span><b>R$ 700,00</b></div></div><KitLink kit="kit20" className="secondary-button full">Quero começar com 20 caixas <ArrowUpRight size={17}/></KitLink></article>
      <article className="kit-card featured"><div className="kit-heading"><span className="kit-label">MELHOR CUSTO POR CAIXA</span><Package size={25}/></div><h3>KIT<span>50</span></h3><p className="kit-description">50 caixas para ampliar suas possibilidades.</p><div className="kit-price"><small>R$</small> 3.495<span>,00</span></div><p className="unit-cost">R$ 69,90 por caixa <span>R$ 5 a menos por unidade</span></p><div className="kit-metrics"><div><span>Revenda de referência</span><b>R$ 109,90 / caixa</b></div><div><span>Diferença bruta por caixa</span><b>R$ 40,00</b></div><div><span>Ganho bruto ao vender todo o kit</span><b>R$ 2.000,00</b></div></div><KitLink kit="kit50" className="primary-button full">Quero começar com 50 caixas <ArrowUpRight size={17}/></KitLink></article>
    </div><p className="fine-print kit-footnote">O KIT50 reduz R$ 5,00 do custo por caixa: R$ 250,00 de economia em 50 caixas, comparado ao custo unitário do KIT20. Valores de ganho bruto consideram a venda de todo o kit por R$ 109,90 por caixa, antes das despesas. <a href="#simulador">Simule seu cenário.</a><br/>Frete à parte nos kits de 20 e 50 caixas. Pagamento em até 6x, com juros e valor total exibidos antes do pagamento. Pedidos acima de 1.000 unidades têm frete grátis, conforme condição comercial; consulte o atendimento.</p></div></section>

    <section id="checkout" className="checkout-section section-space shell"><div className="checkout-layout"><div className="checkout-intro"><span className="eyebrow">06 / COMECE COM A LORD NUTRI</span><h2>Escolha seu kit.<br/><em>Conclua seu pedido.</em></h2><p>Escolha seu estoque e preencha os dados para a entrega. Você confere todos os valores antes de seguir para o pagamento.</p><div className="checkout-assurances"><div><ShieldCheck/><span><strong>Pagamento pelo Asaas</strong><small>PIX ou cartão, com o total apresentado antes de pagar.</small></span></div><div><Truck/><span><strong>Entrega acompanhada</strong><small>A LORD NUTRI envia o kit para o endereço informado.</small></span></div><div><Layers3/><span><strong>Apoio para começar</strong><small>Canal oficial para dúvidas sobre produto, pedido e condições de compra.</small></span></div></div></div><CheckoutForm/></div></section>

    
    <section className="faq-section section-space shell"><div><span className="eyebrow">ANTES DE COMEÇAR</span><h2>Ficou alguma<br/><em>dúvida?</em></h2><p>Encontre as respostas mais comuns ou fale com a equipe.</p><a className="text-link" href={`https://wa.me/${process.env.NEXT_PUBLIC_BKO_WHATSAPP || "5511934924155"}`} target="_blank" rel="noopener noreferrer">Tirar dúvidas no WhatsApp <ArrowUpRight size={16}/></a></div><div className="faq-list">{faqs.map(([q,a])=><details key={q}><summary>{q}<Plus size={18}/></summary><p>{a}</p></details>)}</div></section>
    <div className="shell market-sources" id="fontes-mercado"><p>[1] Fontes de mercado: <a href="https://www.imarcgroup.com/report/pt-br/brazil-dietary-supplements-market" target="_blank" rel="noopener noreferrer">IMARC — mercado brasileiro de suplementos</a> e <a href="https://abiad.org.br/pesquisa-de-mercado-suplementos-alimentares/" target="_blank" rel="noopener noreferrer">ABIAD — hábitos de consumo</a>. Dados setoriais não representam garantia de vendas individuais.</p></div><footer className="site-footer dark-accent"><div className="shell footer-main"><div className="footer-brand"><BrandLogo/><p>Bem-estar, oportunidades<br/>e um novo capítulo.</p></div><div><span>EXPLORE</span><a href="#mix10pro">MIX10PRO</a><a href="#simulador">Calculadora de ganhos</a><a href="#kits">Kits de revenda</a><Link href="/entrar">Portal do revendedor</Link></div><div><span>INFORMAÇÕES</span><Link href="/termos-de-uso">Termos de uso</Link><Link href="/politica-de-privacidade">Privacidade</Link><Link href="/reembolso-e-devolucao">Reembolso e devolução</Link><Link href="/cookies">Cookies</Link></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} LORD NUTRI. Todos os direitos reservados.</span><span>LORD GROUP NETWORK EPP · CNPJ 47.201.289/0001-70</span></div></footer>
  </main>;
}
