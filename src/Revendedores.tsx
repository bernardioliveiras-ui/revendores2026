import React from 'react';
import { useScroll } from "./hooks/useScroll";
import { motion } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, RotateCw, Users2, Gem,
  Store, MapPin, Handshake, Stethoscope, MessageCircle, TrendingUp, DollarSign, Award, Leaf, Shield
} from 'lucide-react';
import Footer from './components/Footer';

export default function Revendedores() {
  React.useEffect(() => {
    document.title = "Revendedores";
  }, []);

  const isScrolled = useScroll(20);
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  const handleWhatsApp = () => {
    const text = "Olá! Gostaria de falar sobre revenda do MIX10 PRO.";
    window.open(`https://wa.me/5511934924155?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8F6F4] font-sans text-gray-900 antialiased">
      <div className="sticky top-0 z-50 w-full">
        <header className={`transition-all duration-300  ${isScrolled ? 'h-[52px] backdrop-blur-md' : 'h-[72px]'}`} style={{ background: isScrolled ? 'linear-gradient(135deg, rgba(11,38,44,0.85), rgba(13,39,44,0.85), rgba(0,0,0,0.85))' : 'linear-gradient(135deg, rgba(11,38,44,1), rgba(13,39,44,1), rgba(0,0,0,1))' }}>
          <div className={`mx-auto flex  transition-all duration-300  h-full  max-w-5xl items-center px-4 sm:px-6 lg:px-8`}>
            <a
              href="/"
              onClick={handleBack}
              className="flex items-center gap-2 text-sm font-medium text-emerald-800 transition-colors hover:text-emerald-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </a>
            <div className="ml-auto flex items-center">
              <img 
                src="/logo-light.png" 
                alt="MIX10 PRO" 
                className={`object-contain w-auto transform origin-center translate-x-[3px] sm:translate-x-0 transition-all duration-300 ${isScrolled ? 'h-8 sm:h-9' : 'h-10 sm:h-12'}`} 
              />
            </div>
          </div>
        </header>
      </div>

      <main className="mx-auto w-full">
        {/* HERO */}
        <section className="bg-white py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-50/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="mx-auto max-w-6xl px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl text-left"
              >
                <div className="inline-flex items-center gap-2 mb-8">
                  <span className="h-[1px] w-8 bg-emerald-700"></span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
                    Oportunidade Premium
                  </span>
                </div>
                <h1 className="mb-6 text-4xl font-light tracking-tight text-emerald-950 sm:text-5xl lg:text-[64px] leading-[1.1] text-balance">
                  Faça parte da rede <br/><span className="font-medium">MIX10 PRO</span>
                </h1>
                <p className="max-w-lg text-[16px] sm:text-[18px] font-light text-gray-500 leading-relaxed text-balance">
                  Leve uma fórmula premium para clientes que valorizam mobilidade, bem-estar e extrema qualidade de vida.
                </p>
                
                <div className="mt-10 flex justify-center lg:justify-start items-center gap-6">
                  <button 
                    onClick={handleWhatsApp}
                    className="w-full sm:w-max rounded-full bg-emerald-950 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-emerald-800 hover:shadow-lg focus:ring-2 focus:ring-emerald-950 focus:ring-offset-2 focus:ring-offset-white focus:outline-none"
                  >
                    Seja um Parceiro
                  </button>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="relative lg:ml-auto w-full max-w-[500px]"
              >
                {/* Premium Image Composition */}
                <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-gradient-to-br from-emerald-50/50 to-white border border-gray-100/50 shadow-[0_20px_60px_rgb(0,0,0,0.04)] flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08),transparent_70%)]" />
                  <img 
                    src="/img-revenda.webp" 
                    alt="Revenda MIX10 PRO" 
                    className="relative z-10 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  {/* Floating badge */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="absolute bottom-10 left-10 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-sm border border-white/20 flex flex-col items-start"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 mb-0.5">Alto Valor</span>
                    <span className="text-sm font-medium text-gray-900">Percepção Premium</span>
                  </motion.div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* SECTION 2: Por que o MIX10 PRO tem potencial de recompra? */}
        <section className="bg-[#F8F8F6] px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl mb-16 lg:mb-24">
              <h2 className="text-3xl lg:text-[42px] leading-tight font-light tracking-tight text-emerald-950 mb-6 text-balance">
                Por que o MIX10 PRO tem <br/><span className="font-medium text-emerald-800">potencial de recompra?</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div 
                whileHover={{ y: -4 }}
                className="group relative bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(16,185,129,0.04)] border border-gray-100 transition-all duration-300 flex flex-col items-start"
              >
                <div className="absolute top-8 right-8 text-[10px] font-semibold uppercase tracking-widest text-emerald-600/60 bg-emerald-50 px-3 py-1 rounded-full">
                  Uso Diário
                </div>
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-[#F8F6F4] text-emerald-800 mb-8 transition-colors group-hover:bg-emerald-50">
                  <RotateCw className="h-6 w-6" strokeWidth={1.25} />
                </div>
                <h3 className="text-[15px] font-medium tracking-wide uppercase text-gray-900 mb-4">Uso Contínuo</h3>
                <p className="text-[15px] text-gray-500 font-light leading-relaxed">
                  Fórmula pensada para a rotina diária, garantindo fidelização natural e clientes recorrentes em seu negócio.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4 }}
                className="group relative bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(16,185,129,0.04)] border border-gray-100 transition-all duration-300 flex flex-col items-start"
              >
                <div className="absolute top-8 right-8 text-[10px] font-semibold uppercase tracking-widest text-emerald-600/60 bg-emerald-50 px-3 py-1 rounded-full">
                  Público 40+
                </div>
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-[#F8F6F4] text-emerald-800 mb-8 transition-colors group-hover:bg-emerald-50">
                  <Users2 className="h-6 w-6" strokeWidth={1.25} />
                </div>
                <h3 className="text-[15px] font-medium tracking-wide uppercase text-gray-900 mb-4">Público Claro</h3>
                <p className="text-[15px] text-gray-500 font-light leading-relaxed">
                  Demanda direta de pessoas maduras e ativas que buscam mais conforto articular e ósseo todos os dias.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4 }}
                className="group relative bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(16,185,129,0.04)] border border-gray-100 transition-all duration-300 flex flex-col items-start md:col-span-2 lg:col-span-1"
              >
                <div className="absolute top-8 right-8 text-[10px] font-semibold uppercase tracking-widest text-emerald-600/60 bg-emerald-50 px-3 py-1 rounded-full">
                  Mercado Premium
                </div>
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-[#F8F6F4] text-emerald-800 mb-8 transition-colors group-hover:bg-emerald-50">
                  <Gem className="h-6 w-6" strokeWidth={1.25} />
                </div>
                <h3 className="text-[15px] font-medium tracking-wide uppercase text-gray-900 mb-4">Percepção Premium</h3>
                <p className="text-[15px] text-gray-500 font-light leading-relaxed">
                  Posicionamento elevado que agrega valor real ao lojista e parceiro, eliminando disputa predatória de preços.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Para quem é a revenda? */}
        <section className="bg-white px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16 lg:mb-24">
              <h2 className="text-3xl lg:text-[42px] font-light tracking-tight text-emerald-950 mb-6">
                Para quem é a revenda?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <motion.div whileHover={{ scale: 1.02 }} className="group p-8 rounded-3xl border border-gray-100/60 bg-gray-50/50 hover:bg-white hover:border-emerald-100 hover:shadow-[0_10px_30px_rgb(0,0,0,0.03)] transition-all">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-emerald-800 mb-6 group-hover:bg-emerald-50 group-hover:border-transparent transition-colors">
                  <Store className="h-5 w-5" strokeWidth={1.25} />
                </div>
                <h3 className="text-[16px] font-medium text-gray-900 mb-2">Lojistas</h3>
                <p className="text-[14px] text-gray-500 font-light leading-relaxed">Produtos premium para público com alta taxa de recorrência.</p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="group p-8 rounded-3xl border border-gray-100/60 bg-gray-50/50 hover:bg-white hover:border-emerald-100 hover:shadow-[0_10px_30px_rgb(0,0,0,0.03)] transition-all">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-emerald-800 mb-6 group-hover:bg-emerald-50 group-hover:border-transparent transition-colors">
                  <Stethoscope className="h-5 w-5" strokeWidth={1.25} />
                </div>
                <h3 className="text-[16px] font-medium text-gray-900 mb-2">Clínicas</h3>
                <p className="text-[14px] text-gray-500 font-light leading-relaxed">Solução complementar e sofisticada para pacientes e clientes.</p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="group p-8 rounded-3xl border border-gray-100/60 bg-gray-50/50 hover:bg-white hover:border-emerald-100 hover:shadow-[0_10px_30px_rgb(0,0,0,0.03)] transition-all">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-emerald-800 mb-6 group-hover:bg-emerald-50 group-hover:border-transparent transition-colors">
                  <Handshake className="h-5 w-5" strokeWidth={1.25} />
                </div>
                <h3 className="text-[16px] font-medium text-gray-900 mb-2">Parceiros</h3>
                <p className="text-[14px] text-gray-500 font-light leading-relaxed">Marca consolidada com forte percepção de valor agregado.</p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="group p-8 rounded-3xl border border-gray-100/60 bg-gray-50/50 hover:bg-white hover:border-emerald-100 hover:shadow-[0_10px_30px_rgb(0,0,0,0.03)] transition-all">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-emerald-800 mb-6 group-hover:bg-emerald-50 group-hover:border-transparent transition-colors">
                  <TrendingUp className="h-5 w-5" strokeWidth={1.25} />
                </div>
                <h3 className="text-[16px] font-medium text-gray-900 mb-2">Representantes</h3>
                <p className="text-[14px] text-gray-500 font-light leading-relaxed">Expanda seu portfólio com uma fórmula exclusiva e inovadora.</p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="group p-8 rounded-3xl border border-gray-100/60 bg-gray-50/50 hover:bg-white hover:border-emerald-100 hover:shadow-[0_10px_30px_rgb(0,0,0,0.03)] transition-all">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-emerald-800 mb-6 group-hover:bg-emerald-50 group-hover:border-transparent transition-colors">
                  <MapPin className="h-5 w-5" strokeWidth={1.25} />
                </div>
                <h3 className="text-[16px] font-medium text-gray-900 mb-2">Afiliados Locais</h3>
                <p className="text-[14px] text-gray-500 font-light leading-relaxed">Monetize sua rede de contatos regionais com um produto real.</p>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} className="group p-8 rounded-3xl border border-gray-100/60 bg-gray-50/50 hover:bg-white hover:border-emerald-100 hover:shadow-[0_10px_30px_rgb(0,0,0,0.03)] transition-all">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-emerald-800 mb-6 group-hover:bg-emerald-50 group-hover:border-transparent transition-colors">
                  <Shield className="h-5 w-5" strokeWidth={1.25} />
                </div>
                <h3 className="text-[16px] font-medium text-gray-900 mb-2">Profissionais</h3>
                <p className="text-[14px] text-gray-500 font-light leading-relaxed">Indique saúde articular com autoridade e credibilidade.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Diferenciais comerciais */}
        <section className="bg-[#022c22] px-6 py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.1),transparent_50%)] mask-image:linear-gradient(to_bottom,white,transparent)" />
          
          <div className="mx-auto max-w-6xl relative z-10">
            <h2 className="text-3xl lg:text-[42px] font-light tracking-tight text-white mb-16 text-center text-balance">
              Diferenciais Comerciais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
              
              <div className="flex items-center gap-6 bg-[#043d30]/60 backdrop-blur-sm rounded-[2rem] p-8 lg:p-10 border border-emerald-800/40 transition-colors hover:bg-[#043d30]">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-emerald-900/80 flex items-center justify-center border border-emerald-800/60">
                  <RotateCw className="h-6 w-6 text-emerald-300/80" strokeWidth={1.25} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium tracking-wider text-emerald-500/80 uppercase">Recorrência</span>
                  <span className="text-[18px] text-white font-light tracking-wide">Produto com recompra</span>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-[#043d30]/60 backdrop-blur-sm rounded-[2rem] p-8 lg:p-10 border border-emerald-800/40 transition-colors hover:bg-[#043d30]">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-emerald-900/80 flex items-center justify-center border border-emerald-800/60">
                  <Gem className="h-6 w-6 text-emerald-300/80" strokeWidth={1.25} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium tracking-wider text-emerald-500/80 uppercase">Estética</span>
                  <span className="text-[18px] text-white font-light tracking-wide">Comunicação premium</span>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-[#043d30]/60 backdrop-blur-sm rounded-[2rem] p-8 lg:p-10 border border-emerald-800/40 transition-colors hover:bg-[#043d30]">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-emerald-900/80 flex items-center justify-center border border-emerald-800/60">
                  <Users2 className="h-6 w-6 text-emerald-300/80" strokeWidth={1.25} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium tracking-wider text-emerald-500/80 uppercase">Audiência</span>
                  <span className="text-[18px] text-white font-light tracking-wide">Público claro e definido</span>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-[#043d30]/60 backdrop-blur-sm rounded-[2rem] p-8 lg:p-10 border border-emerald-800/40 transition-colors hover:bg-[#043d30]">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-emerald-900/80 flex items-center justify-center border border-emerald-800/60">
                  <DollarSign className="h-6 w-6 text-emerald-300/80" strokeWidth={1.25} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium tracking-wider text-emerald-500/80 uppercase">Lucratividade</span>
                  <span className="text-[18px] text-white font-light tracking-wide">Alta percepção de valor</span>
                </div>
              </div>
              
              <div className="md:col-span-2 flex items-center gap-6 bg-gradient-to-r from-emerald-800/40 to-[#043d30]/60 backdrop-blur-sm rounded-[2rem] p-8 lg:p-10 border border-emerald-700/50 transition-colors hover:border-emerald-600/50">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-emerald-900/50 flex items-center justify-center border border-emerald-700/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <Leaf className="h-6 w-6 text-emerald-300" strokeWidth={1.25} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium tracking-wider text-emerald-400 uppercase">Qualidade superior</span>
                  <span className="text-[20px] text-white font-light tracking-wide">Fórmula exclusiva com 10 ativos estratégicos</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 5: CTA */}
        <section className="bg-white px-6 py-24 sm:py-32 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-50/50 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="mx-auto max-w-3xl text-center relative z-10">
            <span className="inline-flex mb-8 h-16 w-16 rounded-full bg-white shadow-sm border border-gray-100 text-emerald-800 items-center justify-center mx-auto">
              <MessageCircle className="h-6 w-6" strokeWidth={1.25} />
            </span>
            <h2 className="text-3xl lg:text-[48px] leading-tight font-light tracking-tight text-emerald-950 mb-6">
              Vamos construir uma parceria de valor?
            </h2>
            <p className="text-[16px] lg:text-[18px] text-gray-500 font-light leading-relaxed mb-12 max-w-xl mx-auto">
              Converse com nossa equipe e descubra como representar o MIX10 PRO na sua região. Processo humanizado e exclusividade.
            </p>
            <button 
              onClick={handleWhatsApp}
              className="mt-4 w-full sm:w-max rounded-full bg-emerald-950 px-12 py-4 text-[12px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-emerald-800 hover:shadow-[0_10px_30px_rgba(2,44,34,0.15)] focus:ring-2 focus:ring-emerald-950 focus:ring-offset-2 focus:ring-offset-white focus:outline-none"
            >
              Quero falar sobre revenda
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
