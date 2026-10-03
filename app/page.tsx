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
  ["Já existe plataforma e treinamento?", "A plataforma de apoio e os treinamentos estão em desenvolvimento. A disponibilidade será comunicada pela LORD NUTRI; a compra do kit não representa acesso imediato a esses recursos."],
  ["Preciso ter experiência para começar?", "Sim, mesmo sem experiência você pode começar. A revenda exige divulgação, atendimento, organização e dedicação comercial. Não há garantia de vendas, renda ou prazo para venda do estoque."],
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
        <p className="hero-invitation">Com a LORD NUTRI você pode.</p><h1>Vire a chave<br/><em>da sua renda.</em></h1><p className="hero-dream">Vem realizar seus sonhos com a gente!</p>
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

    <section id="como-funciona" className="business-section section-space dark-accent"><div className="shell"><div className="split-heading"><div><span className="eyebrow">01 / SUA REVENDA EM 3 PASSOS</span><h2>Seu primeiro passo.<br/><em>Suas próprias vendas.</em></h2></div><p>Escolha, receba e comece. A oportunidade está na compra e revenda de um produto real, para a sua própria rede de clientes.</p></div><div className="steps-grid">{[
      ["01","Escolha seu kit","Defina seu ponto de partida: KIT20, com 20 caixas, ou KIT50, com melhor custo por unidade. Antes de pagar, confira o valor dos produtos, o frete e as condições de parcelamento."],
      ["02","Receba da LORD NUTRI","Preencha os dados de entrega e conclua seu pedido. A LORD NUTRI separa e envia suas caixas para o endereço informado."],
      ["03","Comece suas vendas","Apresente MIX10PRO aos seus contatos, atenda seus clientes e entregue os produtos. Seu resultado vem da diferença entre o custo de compra e suas vendas, depois das despesas da operação."],
    ].map(([n,title,text])=><article key={n}><span className="step-number">{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div><p className="fine-print">A revenda exige dedicação comercial. Não há promessa de vendas, renda ou prazo para venda do estoque.</p><a href="#simulador" className="primary-button section-cta">Ver os kits e calcular meu cenário <ArrowUpRight size={17}/></a>{hasVideo?<div className="brand-video"><div><span className="eyebrow">CONHEÇA A LORD NUTRI</span><h3>Seu próximo capítulo começa aqui.</h3></div><WelcomeVideo embedUrl={process.env.VSL_EMBED_URL} videoUrl={process.env.VSL_VIDEO_URL}/></div>:null}</div></section>

    <section id="simulador" className="calculator-section section-space shell">
      <div className="market-intro"><span className="eyebrow">02 / MERCADO E OPORTUNIDADE</span><h2>Bem-estar faz parte da rotina.<br/><em>A oportunidade começa nas suas conexões.</em></h2><p>Para quem busca incluir bem-estar e cuidado contínuo na rotina, a LORD NUTRI apresenta o MIX10PRO. Você pode atender esse público com um produto físico e construir suas próprias vendas.</p></div>
      <div className="section-intro"><span className="eyebrow">COLOQUE SUA META NO PAPEL</span><h2>Quanto você quer construir<br/><em>de ganho bruto por mês?</em></h2><p>Informe sua meta mensal e veja quantas caixas precisaria vender. Considere as despesas para chegar a um cenário mais realista.</p></div>
      <div className="reference-table"><table><caption>Pequenos ritmos. Cenários para comparar.</caption><thead><tr><th scope="col">Ritmo em 26 dias</th><th scope="col">Caixas no mês</th><th scope="col">Ganho bruto · KIT20</th><th scope="col">Ganho bruto · KIT50</th></tr></thead><tbody>{[["1 caixa por dia","26","910,00","1.040,00"],["2 caixas por dia","52","1.820,00","2.080,00"],["3 caixas por dia","78","2.730,00","3.120,00"]].map(([pace,boxes,k20,k50])=><tr key={pace}><th scope="row">{pace}</th><td>{boxes}</td><td>R$ {k20}</td><td>R$ {k50}</td></tr>)}</tbody></table></div>
      <p className="fine-print reference-note">Simulações com preço de referência de R$ 109,90 por caixa. Ganhos brutos, antes de frete, taxas, juros, impostos, descontos e demais despesas. Vendas e resultados dependem da atuação de cada revendedor.</p>
      <ProfitSimulator/>
      <div className="scenario-note"><strong>Como se chega ao cenário de R$ 10 mil de ganho bruto?</strong><p>250 caixas vendidas no mês por R$ 109,90, com custo de R$ 69,90 por caixa (condição do KIT50): 250 × R$ 40,00 = R$ 10.000,00 de ganho bruto. Esse volume exige a compra de 250 caixas — equivalente a cinco KIT50. Fretes, impostos, taxas, juros, descontos e demais despesas reduzem o resultado. É um cenário de referência, sem garantia de vendas ou renda.</p></div>
      <a href="#kits" className="primary-button section-cta">Ver qual kit atende minha meta <ArrowUpRight size={17}/></a>
    </section>

    <section id="mix10pro" className="product-section section-space shell">
      <div className="section-intro"><span className="eyebrow">03 / POR QUE MIX10PRO</span><h2>Um produto para apresentar.<br/><em>Uma marca para construir junto.</em></h2><p>Por que escolher MIX10PRO para começar sua revenda? Um produto precisa ser fácil de apresentar, ter posicionamento claro e ajudar a construir confiança. MIX10PRO é o primeiro produto da LORD NUTRI para essa jornada.</p></div>
      <div className="product-layout">
        <div className="product-display"><span className="product-label"><Leaf size={15}/> MIX10PRO</span><img src="/brand/mix10-cutout.png" alt="Embalagem MIX10PRO, 30 cápsulas" width={1086} height={1448} loading="lazy"/><div className="product-specs"><span><b>30</b> cápsulas</span><span><b>10</b> constituintes</span><span><b>500 mg</b> por cápsula</span></div></div>
        <div className="product-information"><h3>Fórmula com 10 ativos</h3><p>Vitaminas, minerais e outros constituintes em uma fórmula de suplemento alimentar. Conheça a composição para apresentar o produto com clareza e responsabilidade.</p><div className="ingredient-list">{constituents.map((name,i)=><div key={name}><span>{String(i+1).padStart(2,"0")}</span><strong>{name}</strong><Plus size={14}/></div>)}</div><a href="/brand/mix10-details.jpg" target="_blank" rel="noopener noreferrer" className="text-link">Consultar a embalagem e o rótulo <ArrowUpRight size={16}/></a></div>
      </div>
      <div className="benefits-heading"><span className="eyebrow">ENTENDA OS NUTRIENTES</span><h3>Funções que fazem parte do cuidado diário.</h3></div>
      <div className="benefit-grid"><article><span>01</span><h3>Ossos e dentes</h3><p>O cálcio participa da formação e manutenção de ossos e dentes.</p></article><article><span>02</span><h3>Função muscular</h3><p>O magnésio participa do funcionamento muscular e do metabolismo energético.</p></article><article><span>03</span><h3>Formação de colágeno</h3><p>A vitamina C participa da formação de colágeno e da proteção antioxidante.</p></article></div>
      <p className="fine-print product-note">As funções descritas são dos nutrientes. Consulte no rótulo as quantidades por porção, o modo de uso e as advertências. MIX10PRO é suplemento alimentar, não medicamento. <a href="https://www.gov.br/anvisa/pt-br/assuntos/alimentos/suplementos-alimentares/conheca-os-beneficios-comprovados" target="_blank" rel="noopener noreferrer">Saiba mais · Anvisa</a></p>
    </section>

    <section className="reasons-section section-space"><div className="shell"><div className="section-intro"><span className="eyebrow">04 / SEU PRÓXIMO PASSO</span><h2>5 motivos para<br/><em>revender MIX10PRO.</em></h2><p>Produto em mãos, números claros e espaço para desenvolver suas próprias vendas com a LORD NUTRI.</p></div><div className="reasons-grid">{[
      ["01","Atue no mercado de bem-estar","Comece uma atividade de revenda com um suplemento alimentar voltado ao cuidado na rotina."],
      ["02","Seu resultado acompanha suas vendas","Compre com condição de revendedor e fique com a diferença entre o custo e o preço praticado, considerando suas despesas."],
      ["03","Tenha um produto físico para apresentar","Embalagem própria, marca definida e informações oficiais para apoiar uma apresentação responsável."],
      ["04","Comece pela sua rede de contatos","Amigos, familiares, vizinhos, colegas e contatos digitais podem conhecer seu atendimento e o produto."],
      ["05","Conte com a LORD NUTRI no começo","O canal oficial responde dúvidas sobre pedido, produto e condições de compra. Plataforma de apoio e treinamentos estão em desenvolvimento."],
    ].map(([n,title,copy])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</div><a href="#kits" className="text-link section-cta">Escolher meu kit <ArrowRight size={17}/></a></div></section>

    <section id="kits" className="kits-section section-space"><div className="shell"><div className="section-intro centered"><span className="eyebrow">05 / ESCOLHA SEU KIT</span><h2>Seu estoque inicial.<br/><em>Seu ponto de partida.</em></h2><p>O mesmo MIX10PRO. Duas condições para começar.</p></div><div className="kit-cards">
      <article className="kit-card"><div className="kit-heading"><span className="kit-label">MENOR INVESTIMENTO INICIAL</span><Package size={25}/></div><h3>KIT<span>20</span></h3><p className="kit-description">20 caixas para as suas primeiras vendas.</p><div className="kit-price"><small>R$</small> 1.498<span>,00</span></div><p className="unit-cost">R$ 74,90 por caixa</p><div className="kit-metrics"><div><span>Revenda de referência</span><b>R$ 109,90 / caixa</b></div><div><span>Diferença bruta por caixa</span><b>R$ 35,00</b></div><div><span>Ganho bruto ao vender todo o kit</span><b>R$ 700,00</b></div></div><KitLink kit="kit20" className="secondary-button full">Quero começar com 20 caixas <ArrowUpRight size={17}/></KitLink></article>
      <article className="kit-card featured"><div className="kit-heading"><span className="kit-label">MELHOR CUSTO POR CAIXA</span><Package size={25}/></div><h3>KIT<span>50</span></h3><p className="kit-description">50 caixas para ampliar suas possibilidades.</p><div className="kit-price"><small>R$</small> 3.495<span>,00</span></div><p className="unit-cost">R$ 69,90 por caixa <span>R$ 5 a menos por unidade</span></p><div className="kit-metrics"><div><span>Revenda de referência</span><b>R$ 109,90 / caixa</b></div><div><span>Diferença bruta por caixa</span><b>R$ 40,00</b></div><div><span>Ganho bruto ao vender todo o kit</span><b>R$ 2.000,00</b></div></div><KitLink kit="kit50" className="primary-button full">Quero começar com 50 caixas <ArrowUpRight size={17}/></KitLink></article>
    </div><p className="fine-print kit-footnote">O KIT50 reduz R$ 5,00 do custo por caixa: R$ 250,00 de economia em 50 caixas, comparado ao custo unitário do KIT20. Valores de ganho bruto consideram a venda de todo o kit por R$ 109,90 por caixa, antes das despesas. <a href="#simulador">Simule seu cenário.</a><br/>Frete à parte nos kits de 20 e 50 caixas. Pagamento em até 6x, com juros e valor total exibidos antes do pagamento. Pedidos acima de 1.000 unidades têm frete grátis, conforme condição comercial; consulte o atendimento.</p></div></section>

    <section id="checkout" className="checkout-section section-space shell"><div className="checkout-layout"><div className="checkout-intro"><span className="eyebrow">06 / COMECE COM A LORD NUTRI</span><h2>Seu kit.<br/>Seu negócio.<br/><em>Sua próxima etapa.</em></h2><p>Escolha seu estoque e preencha os dados para a entrega. Você confere todos os valores antes de seguir para o pagamento.</p><div className="checkout-assurances"><div><ShieldCheck/><span><strong>Pagamento pelo Asaas</strong><small>PIX ou cartão, com o total apresentado antes de pagar.</small></span></div><div><Truck/><span><strong>Entrega acompanhada</strong><small>A LORD NUTRI envia o kit para o endereço informado.</small></span></div><div><Layers3/><span><strong>Apoio para começar</strong><small>Canal oficial para dúvidas sobre produto, pedido e condições de compra.</small></span></div></div></div><CheckoutForm/></div></section>

    <GoogleReviews/>
    <section className="faq-section section-space shell"><div><span className="eyebrow">ANTES DE COMEÇAR</span><h2>Ficou alguma<br/><em>dúvida?</em></h2><p>Encontre as respostas mais comuns ou fale com a equipe.</p><a className="text-link" href={`https://wa.me/${process.env.NEXT_PUBLIC_BKO_WHATSAPP || "5511934924155"}`} target="_blank" rel="noopener noreferrer">Tirar dúvidas no WhatsApp <ArrowUpRight size={16}/></a></div><div className="faq-list">{faqs.map(([q,a])=><details key={q}><summary>{q}<Plus size={18}/></summary><p>{a}</p></details>)}</div></section>
    <footer className="site-footer dark-accent"><div className="shell footer-main"><div className="footer-brand"><BrandLogo/><p>Bem-estar, oportunidades<br/>e um novo capítulo.</p></div><div><span>EXPLORE</span><a href="#mix10pro">MIX10PRO</a><a href="#simulador">Calculadora de ganhos</a><a href="#kits">Kits de revenda</a><Link href="/entrar">Portal do revendedor</Link></div><div><span>INFORMAÇÕES</span><Link href="/termos-de-uso">Termos de uso</Link><Link href="/politica-de-privacidade">Privacidade</Link><Link href="/reembolso-e-devolucao">Reembolso e devolução</Link><Link href="/cookies">Cookies</Link></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} LORD NUTRI. Todos os direitos reservados.</span><span>LORD GROUP NETWORK EPP · CNPJ 47.201.289/0001-70</span></div></footer>
  </main>;
}
