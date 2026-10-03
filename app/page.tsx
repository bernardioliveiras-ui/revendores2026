/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { WelcomeVideo } from "@/components/welcome-video";
import { CheckoutForm } from "@/components/checkout-form";
import { GoogleReviews } from "@/components/google-reviews";
import { ProfitSimulator } from "@/components/profit-simulator";

const reasons = [
  ["01", "Atividade no mercado de saúde e bem-estar", "Revenda um suplemento alimentar em uma categoria ligada à busca por mobilidade, conforto e qualidade de vida."],
  ["02", "Seu resultado acompanha as suas vendas", "Você compra com condição de revendedor e fica com a diferença entre o custo e o preço praticado na venda."],
  ["03", "Produto físico para apresentar", "MIX10 PRO tem embalagem própria, 30 cápsulas e informações oficiais para apoiar uma apresentação responsável."],
  ["04", "Comece pela sua rede", "Amigos, familiares, vizinhos, colegas e contatos digitais podem conhecer seu atendimento e o produto."],
  ["05", "Conte com a LordNutri", "O canal oficial responde dúvidas sobre pedido, produto e condições de compra."],
];

const mix10Constituents = ["Cálcio","Magnésio","Vitamina C","Curcumina","Vitamina D3","Vitamina K2 MK-7","Manganês","MSM","Colágeno tipo II","Sulfato de condroitina"];

export const metadata = { alternates: { canonical: "https://revendedores.mix10pro.com.br/" } };

export default function Home() {
  return <main className="reseller-lp final-editorial-lp">
    <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context":"https://schema.org","@type":"Organization",name:"LORDNUTRI",legalName:"LORD GROUP NETWORK EPP",url:"https://revendedores.mix10pro.com.br/",logo:"https://revendedores.mix10pro.com.br/brand/lordnutri-group.png",sameAs:["https://mix10pro.com.br/lp-v2","https://www.google.com/maps/search/?api=1&query=LORD%20NUTRI&query_place_id=ChIJCZtZ98MDz5QRWv8YdIPkPic"],makesOffer:{"@type":"Offer",itemOffered:{"@type":"Product",name:"MIX10 PRO"}}
    }) }} />

    <header className="topbar"><a href="#inicio" className="brand"><BrandLogo compact /></a><nav><a href="#como-funciona">Como funciona</a><a href="#simulador">Simulador</a><a href="#kits">Kits</a><Link href="/entrar" className="login-link">Entrar no portal</Link></nav></header>

    <section id="inicio" className="section-shell editorial-hero">
      <div className="editorial-hero-copy">
        <div className="eyebrow">PROGRAMA DE REVENDEDORES LORDNUTRI</div>
        <h1>Com a LordNutri você pode!</h1>
        <h2>Vem realizar seus sonhos com a gente.</h2>
        <p className="hero-market">O mercado de suplementos acompanha a busca de cada vez mais pessoas por mobilidade, conforto e qualidade de vida.</p>
        <div className="hero-punch">Vire a chave da sua renda.</div>
        <p className="hero-big">Construa até <strong>R$ 10 mil de ganho bruto</strong> por mês com as suas vendas.</p>
        <p>Revenda MIX10 PRO. Escolha seu estoque, receba suas caixas e venda diretamente para sua rede de contatos.</p>
        <a className="primary-button" href="#kits">VER OS KITS E CALCULAR MEU CENÁRIO</a>
        <div className="microcopy">Entrada a partir de 20 caixas · Frete à parte · PIX ou cartão em até 6x.</div>
      </div>
      <div className="editorial-product-frame" aria-label="MIX10 PRO LORDNUTRI">
        <div className="editorial-frame-brand"><BrandLogo /></div>
        <img src="/brand/mix10-trio.png" alt="MIX10 PRO LORDNUTRI" />
        <div className="editorial-frame-caption"><span className="section-kicker">Seu próximo capítulo</span><h3>Uma marca.<br/>Novas possibilidades.</h3><p>Produto físico, apoio para começar e um portal para acompanhar sua revenda.</p><div className="brand-chips"><span>Seu estoque</span><span>Seu atendimento</span><span>Suas vendas</span></div></div>
      </div>
    </section>

    <section id="lordnutri" className="lordnutri-proof-band">
      <div className="section-shell lordnutri-editorial-grid">
        <div className="lordnutri-brand-panel"><BrandLogo /><span className="section-kicker">Mercado e oportunidade</span></div>
        <div className="lordnutri-editorial-copy"><h2>LORDNUTRI: uma oportunidade para construir suas próprias vendas.</h2><p>Mais pessoas buscam incluir bem-estar e cuidado contínuo na rotina. A LordNutri cria uma forma de você atender esse público com MIX10 PRO e construir suas próprias vendas.</p><div className="lordnutri-business-strip"><span>Seu negócio</span><strong>Estoque em mãos</strong><p>Modelo de negócio: compra e revenda. Escolha seu estoque MIX10 PRO e venda diretamente aos seus clientes.</p></div></div>
      </div>
      <GoogleReviews />
    </section>

    <section className="vsl-section section-shell welcome-first welcome-inline editorial-vsl"><div className="welcome-inline-copy"><div className="section-heading"><span className="section-kicker">Uma nova jornada começa aqui</span><h2>Bem-vindo à LORDNUTRI</h2><p>Conheça nossa proposta de revenda e dê o primeiro passo com a gente.</p></div></div><WelcomeVideo embedUrl={process.env.VSL_EMBED_URL} videoUrl={process.env.VSL_VIDEO_URL} /></section>

    <section id="como-funciona" className="light-section compact-process"><div className="section-shell"><div className="section-heading narrow"><span className="section-kicker">Simples de entender</span><h2>Seu plano de negócio LORDNUTRI em 3 passos</h2></div><div className="steps editorial-steps"><article><b>1</b><h3>Escolha seu kit</h3><p>Comece com KIT20 ou KIT50. Antes de pagar, você vê produtos, frete, parcelamento, taxa e total final.</p></article><article><b>2</b><h3>Receba da LordNutri</h3><p>Preencha os dados de entrega e conclua o pedido. Acompanhe a separação, o percurso e a entrega no portal.</p></article><article><b>3</b><h3>Comece suas vendas</h3><p>Apresente MIX10 PRO aos seus contatos, atenda seus clientes e registre suas vendas no portal.</p></article></div><p className="warning-note">A revenda exige dedicação comercial. Não há promessa de vendas, renda ou prazo para venda do estoque.</p></div></section>

    <section className="product-section editorial-product-section" id="mix10pro"><div className="section-shell product-grid"><div className="product-visual framed-product"><img src="/brand/mix10-box.png" alt="Embalagem MIX10 PRO, suplemento alimentar da LORDNUTRI" /></div><div className="product-copy"><span className="section-kicker">Um produto da LORDNUTRI</span><h2>MIX10 PRO: o produto LORDNUTRI para começar sua revenda</h2><p>Quando você escolhe um produto para revender, precisa de posicionamento claro e informações que ajudem a construir confiança.</p><div className="mix10-quick-facts"><span><strong>30</strong> cápsulas</span><span><strong>10</strong> constituintes declarados</span><span><strong>500 mg</strong> por cápsula</span></div><div className="product-points"><div><strong>Fórmula completa</strong><span>10 ativos em uma fórmula de suplemento alimentar.</span></div><div><strong>Produto para a rotina</strong><span>Cada embalagem possui 30 cápsulas, com modo de uso e advertências oficiais.</span></div><div><strong>Apresentação profissional</strong><span>Embalagem premium, marca definida e comunicação responsável.</span></div></div><div className="mix10-constituents">{mix10Constituents.map((item)=><span key={item}>{item}</span>)}</div><p className="fine-print">MIX10 PRO é suplemento alimentar, não medicamento. Não há promessa de cura, tratamento ou resultado terapêutico.</p></div></div></section>

    <section className="mix10-definition"><div className="section-shell mix10-definition-grid"><div><span className="section-kicker">O que é o MIX10 PRO</span><h2>Uma fórmula completa, apresentada com responsabilidade.</h2><p>Suplemento alimentar em cápsulas com vitaminas, minerais e outros constituintes. Não contém glúten, não contém lactose e possui 30 porções por embalagem. Nº ANVISA 20260000000803227.</p></div><div className="definition-visual"><img src="/brand/mix10-trio.png" alt="MIX10 PRO" /></div></div></section>

    <section className="section-shell reasons-section"><div className="section-heading"><span className="section-kicker">Por que começar</span><h2>5 motivos para começar com a LORDNUTRI</h2></div><div className="reasons">{reasons.map(([n,t,d])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div></section>

    <section id="simulador" className="dark-section"><div className="section-shell"><div className="section-heading light"><span className="section-kicker">Números transparentes</span><h2>Quanto você quer construir de ganho bruto por mês?</h2><p>Informe um cenário e compare o custo dos dois kits. O resultado abaixo é uma referência, não promessa.</p></div><ProfitSimulator /></div></section>

    <section id="kits" className="section-shell"><div className="section-heading"><span className="section-kicker">Escolha seu ponto de partida</span><h2>Escolha seu estoque inicial MIX10 PRO.</h2><p>O KIT50 reduz R$ 5,00 no custo por caixa e dá mais espaço de margem bruta por unidade.</p></div><div className="kit-cards"><article className="kit-card"><span className="kit-badge">Menor investimento inicial</span><h3>KIT20</h3><strong className="kit-price">R$ 1.498,00</strong><p>20 caixas · R$ 74,90 por caixa</p><ul><li>Venda de referência: R$ 109,90</li><li>Diferença bruta por caixa: R$ 35,00</li><li>Diferença bruta do kit: R$ 700,00</li></ul><Link href="/?kit=kit20#checkout" className="secondary-button">QUERO COMEÇAR COM 20 CAIXAS</Link></article><article className="kit-card featured"><span className="kit-badge">Melhor custo por unidade</span><h3>KIT50</h3><strong className="kit-price">R$ 3.495,00</strong><p>50 caixas · R$ 69,90 por caixa</p><ul><li>Venda de referência: R$ 109,90</li><li>Diferença bruta por caixa: R$ 40,00</li><li>Diferença bruta do kit: R$ 2.000,00</li></ul><Link href="/?kit=kit50#checkout" className="primary-button">QUERO COMEÇAR COM 50 CAIXAS</Link></article></div><p className="fine-print centered">Frete calculado pelo CEP. PIX ou cartão em até 6x; parcelamento, taxa e total final aparecem no checkout antes do redirecionamento ao Asaas.</p></section>

    <section id="checkout" className="checkout-section"><div className="section-shell checkout-layout"><div><span className="section-kicker">Seu próximo passo</span><h2>Preencha agora e siga para o pagamento</h2><p>Preencha seus dados e endereço de entrega. Após a confirmação do pagamento, acompanhe seu pedido e encontre os materiais de apoio no portal.</p><div className="checkout-benefits"><span>✓ Dados enviados com segurança</span><span>✓ Pagamento processado pelo Asaas</span><span>✓ Acesso após confirmação do pagamento</span><span>✓ Manual e acompanhamento no portal</span></div></div><CheckoutForm /></div></section>

    <section className="light-section faq"><div className="section-shell"><div className="section-heading"><span className="section-kicker">Dúvidas frequentes</span><h2>FAQ</h2></div><div className="faq-grid"><details><summary>Isso é multinível?</summary><p>Não. O resultado vem da compra e da revenda dos produtos aos clientes. Não há remuneração por recrutamento.</p></details><details><summary>Quem entrega o produto?</summary><p>A LordNutri envia o kit para o revendedor. Depois, o revendedor organiza a entrega das caixas aos próprios clientes.</p></details><details><summary>Posso parcelar?</summary><p>O checkout calcula o frete pelo CEP e mostra PIX ou cartão de 1x a 6x, incluindo a taxa de parcelamento e o total final antes de abrir o Asaas.</p></details><details><summary>Quando recebo acesso ao portal?</summary><p>Após a confirmação do pagamento, você recebe as orientações de acesso pelos canais informados no cadastro. O BKO também pode ajudar com a liberação e a recuperação do acesso.</p></details><details><summary>Nunca vendi. Posso começar?</summary><p>Sim, mas a revenda exige divulgação, atendimento, organização e dedicação comercial. Não há garantia de vendas.</p></details></div><div className="faq-cta"><a className="secondary-button" href={`https://wa.me/${process.env.NEXT_PUBLIC_BKO_WHATSAPP || "5511934924155"}`} target="_blank">TIRAR DÚVIDAS NO WHATSAPP</a></div></div></section>

    <footer><div className="section-shell footer-grid"><div><strong>LORDNUTRI · MIX10 PRO</strong><p>Programa de Revendedores</p></div><div><Link href="/termos-de-uso">Termos de Uso</Link><Link href="/politica-de-privacidade">Política de Privacidade</Link><Link href="/reembolso-e-devolucao">Reembolso e Devolução</Link><Link href="/entrar">Portal do Revendedor</Link></div></div></footer>
  </main>;
}
