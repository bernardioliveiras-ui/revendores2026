import React from "react";
import { useScroll } from "./hooks/useScroll";
import { Link } from "react-router-dom";
import { ArrowRight, MoveRight } from "lucide-react";
import Footer from "./components/Footer";

export default function SobreNos() {
  React.useEffect(() => {
    document.title = "Sobre Nós";
  }, []);

  const isScrolled = useScroll(20);
  return (
    <div className="min-h-screen font-sans text-gray-900 bg-[#F8F6F4] antialiased selection:bg-emerald-200">
      
      {/* HEADER SIMPLES */}
      <div className="sticky top-0 z-50 w-full">
        <header className={`transition-all duration-300  ${isScrolled ? 'h-[52px] backdrop-blur-md' : 'h-[72px]'}`} style={{ background: isScrolled ? 'linear-gradient(135deg, rgba(11,38,44,0.85), rgba(13,39,44,0.85), rgba(0,0,0,0.85))' : 'linear-gradient(135deg, rgba(11,38,44,1), rgba(13,39,44,1), rgba(0,0,0,1))' }}>
          <div className={`mx-auto flex  transition-all duration-300  h-full  max-w-5xl items-center justify-between px-6 sm:px-8 lg:px-8 border-none relative`}>
            <Link to="/" className="flex items-center absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 z-10">
              <img 
                src="/logo-light.png" 
                alt="MIX10 PRO" 
                className={`object-contain w-auto transform origin-center translate-x-[3px] sm:translate-x-0 transition-all duration-300 ${isScrolled ? 'h-8 sm:h-9' : 'h-10 sm:h-12'}`} 
              />
            </Link>
            <div className="hidden md:block"></div> {/* Spacer for flexbox on desktop */}
            <Link to="/" className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-gray-600 transition-colors hover:text-emerald-800 ml-auto md:ml-0 relative z-20 hidden sm:block">
              Voltar
            </Link>
            {/* Mobile Back button */}
            <Link to="/" className="text-[10px] uppercase font-bold tracking-wider text-gray-600 transition-colors hover:text-emerald-800 sm:hidden">
              Voltar
            </Link>
          </div>
        </header>
      </div>

      {/* HERO */}
      <section className="bg-white py-20 lg:py-32 px-6 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-light tracking-tight text-gray-900 sm:text-3xl lg:text-4xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15] mb-10">
            Durante muito tempo, as pessoas aprenderam a aceitar a dor como parte natural da rotina.
          </h1>
          
          <div className="space-y-6 text-gray-600 font-normal leading-relaxed text-[13px] md:text-sm">
            <p>
              Rigidez ao acordar. Dores constantes. Limitações nos movimentos. Corpo cansado. Problemas respiratórios. Desgaste físico acumulado.
            </p>
            <p className="text-sm font-medium text-emerald-900 tracking-tight !mt-10 border-l-2 border-emerald-500 pl-4">
              Com o tempo, tudo isso passou a ser tratado como algo &ldquo;normal&rdquo;.
            </p>
          </div>
        </div>
      </section>

      {/* BLOCO 2: Manifesto */}
      <section className="bg-[#0d2e1f] py-24 px-6 sm:px-8 text-emerald-50">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-8">
            A ILUSÃO DA SOLUÇÃO RÁPIDA
          </p>
          
          <div className="max-w-none space-y-6 text-[13px] text-emerald-100/90 font-normal leading-relaxed">
            <p className="text-xl font-light tracking-tight text-white sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15] mb-8">
              Existe uma ideia silenciosa sendo reforçada há anos:
            </p>
            <p className="text-sm md:text-base italic border-l-2 border-emerald-500 pl-6 text-emerald-50/90">
              De que sentir dor, perder mobilidade, conviver com o corpo travando ou depender de remédios constantemente faz parte da idade.
            </p>
            
            <p>E então as pessoas aprendem apenas a remediar.</p>
            <p>Mais remédios.<br />
            Mais soluções temporárias.<br />
            <span className="text-emerald-400/80 text-[11px]">(Muitas delas acompanhadas de diversos efeitos colaterais.)</span></p>
            
            <p className="mt-8">Mais tentativas de aliviar sintomas sem realmente olhar para o corpo de forma completa.</p>
            
            <p className="text-lg md:text-xl font-medium text-white pt-10">
              Mas o corpo não funciona em partes.
            </p>
          </div>
        </div>
      </section>

      {/* FOTO E BLOCO 3 */}
      <section className="bg-white py-24 px-6 sm:px-8">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1000&auto=format&fit=crop" 
                  alt="Laboratório de desenvolvimento" 
                  className="w-full h-full object-cover aspect-[4/5] object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          
          <div className="order-1 lg:order-2">
            <h2 className="text-xl font-light tracking-tight text-gray-900 sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15] mb-8">
              Foi dessa visão que nasceu o MIX10 PRO.
            </h2>
            <div className="space-y-6 text-gray-600 font-normal leading-relaxed text-[13px]">
              <p>
                Não para ser apenas mais um suplemento.
              </p>
              <p>
                Mas para representar uma forma mais inteligente e natural de cuidar do corpo ao longo do tempo.
              </p>
              <p className="p-6 bg-gray-50 border border-gray-100 rounded-xl mt-8 italic text-gray-800 text-sm">
                Uma fórmula natural desenvolvida pensando em movimento, mobilidade, continuidade e liberdade — e não apenas em mascarar sinais que o corpo está tentando mostrar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO 4 */}
      <section className="bg-[#F8F6F4] py-24 px-6 sm:px-8 border-y border-gray-200/50">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-xl font-light tracking-tight text-emerald-950 sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15] mb-8">
              O problema nunca foi apenas a dor.
            </h2>
            <p className="text-base md:text-lg text-emerald-800 font-medium tracking-tight">
              O problema é começar a mudar sua vida por causa dela.
            </p>
          </div>

          <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-emerald-50">
            <ul className="space-y-6 text-[13px] text-gray-600 font-normal leading-relaxed mb-12">
              <li className="flex gap-4 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">✕</span>
                Evitar subir escadas.
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">✕</span>
                Parar de praticar esportes.
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">✕</span>
                Não conseguir brincar com os filhos ou netos.
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">✕</span>
                Perder momentos simples com a família.
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">✕</span>
                Sentir dificuldade para abaixar, levantar os braços ou até amarrar o próprio cadarço.
              </li>
            </ul>

            <div className="border-t border-gray-100 pt-8 mt-8">
              <p className="text-[13px] text-gray-800 font-medium leading-relaxed mb-6">
                Aos poucos, as pessoas deixam de viver com liberdade e começam a adaptar a rotina aos limites do próprio corpo.
              </p>
              <p className="text-sm font-bold text-red-800/80 bg-red-50 p-4 rounded-lg inline-block">
                E o pior: muita gente acredita que isso é inevitável.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOTO 2 e BLOCO 5 */}
      <section className="bg-white py-24 px-6 sm:px-8">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                  src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1000&auto=format&fit=crop" 
                  alt="Rotina ativa" 
                  className="w-full h-full object-cover aspect-[4/5] object-center"
              />
          </div>
          
          <div>
            <h2 className="text-xl font-light tracking-tight text-gray-900 sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15] mb-8">
              Nós acreditamos em continuidade.
              <br />
              <span className="font-medium text-emerald-800 tracking-tight mt-2 block text-lg md:text-xl">Não em soluções superficiais.</span>
            </h2>
            <div className="space-y-6 text-gray-600 font-normal leading-relaxed text-[13px]">
              <p>
                O MIX10 PRO foi desenvolvido para quem entende que cuidar do corpo não deveria começar apenas quando os movimentos já estão comprometidos.
              </p>
              <p className="text-[13px] md:text-sm font-medium text-gray-800 pt-4">
                E que liberdade, mobilidade e autonomia precisam ser preservadas antes de serem perdidas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ENCERRAMENTO */}
      <section className="bg-[#0a2417] py-32 px-6 sm:px-8 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="mx-auto max-w-2xl relative z-10">
          <h2 className="text-2xl font-light tracking-tight text-white sm:text-3xl lg:text-4xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15] mb-12">
            Continuar ativo não deveria ser exceção.
          </h2>
          
          <div className="space-y-6 text-emerald-100/90 text-[13px] md:text-sm font-normal leading-relaxed mb-16">
            <p>Cuidar do corpo não é luxo.</p>
            <p>Não é exagero.</p>
            <p>E não deveria ser apenas uma resposta emergencial ao desgaste acumulado.</p>
            
            <p className="text-base md:text-lg font-medium text-white pt-8">
              Para nós, é uma decisão diária sobre como você deseja continuar vivendo sua rotina nos próximos anos.
            </p>
          </div>

          <Link 
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-xs font-semibold tracking-widest uppercase text-[#0d2e1f] transition-all hover:bg-gray-100 hover:scale-105 focus:ring-2 focus:ring-white focus:outline-none shadow-[0_8px_30px_rgba(255,255,255,0.1)] gap-2"
          >
            Descubra a fórmula MIX10 PRO
            <MoveRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
