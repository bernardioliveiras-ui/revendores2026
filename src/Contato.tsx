import React from 'react';
import { useScroll } from "./hooks/useScroll";
import { ArrowLeft, MessageCircle, Mail, Clock } from 'lucide-react';
import Footer from './components/Footer';

export default function Contato() {
  React.useEffect(() => {
    document.title = "Contato";
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nome = formData.get('nome') || '';
    const email = formData.get('email') || '';
    const telefone = formData.get('telefone') || '';
    const mensagem = formData.get('mensagem') || '';

    const subject = `Novo contato site MIX10 PRO - ${nome}`;
    const body = `Nome: ${nome}\nE-mail: ${email}\nTelefone: ${telefone}\n\nMensagem:\n${mensagem}`;
    
    window.location.href = `mailto:contato@mix10pro.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
        <section className="bg-white py-20 sm:py-24 relative overflow-hidden">
          <div className="mx-auto max-w-4xl px-6 text-center z-10 relative">
            <span className="inline-block mb-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full">
              ATENDIMENTO MIX10 PRO
            </span>
            <h1 className="mb-6 text-3xl font-light tracking-tight text-emerald-950 sm:text-5xl">
              Fale conosco
            </h1>
            <p className="mx-auto max-w-2xl text-[14px] sm:text-base font-light text-gray-500 leading-relaxed">
              Nossa equipe está pronta para ajudar você com dúvidas, suporte, pedidos e informações sobre o produto.
            </p>
          </div>
        </section>

        {/* MAIN SECTION */}
        <section className="bg-[#F8F6F4] px-6 py-16 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              
              {/* Direita - Formulário clean */}
              <div className="flex flex-col">
                  <form 
                    className="flex flex-col gap-6" 
                    onSubmit={handleSubmit}
                  >
                    <div className="flex flex-col gap-2">
                      <label htmlFor="nome" className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 ml-1">Nome</label>
                      <input 
                        type="text" 
                        id="nome" 
                        name="nome"
                        required
                        className="w-full rounded-2xl border-0 bg-white px-5 py-4 text-sm text-gray-800 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-emerald-600 focus:outline-none transition-all placeholder:text-gray-400" 
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 ml-1">E-mail</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email"
                        required
                        className="w-full rounded-2xl border-0 bg-white px-5 py-4 text-sm text-gray-800 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-emerald-600 focus:outline-none transition-all placeholder:text-gray-400" 
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="telefone" className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 ml-1">Telefone</label>
                      <input 
                        type="tel" 
                        id="telefone" 
                        name="telefone"
                        required
                        className="w-full rounded-2xl border-0 bg-white px-5 py-4 text-sm text-gray-800 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-emerald-600 focus:outline-none transition-all placeholder:text-gray-400" 
                        placeholder="(11) 90000-0000"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="mensagem" className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 ml-1">Mensagem</label>
                      <textarea 
                        id="mensagem" 
                        name="mensagem"
                        required
                        rows={4}
                        className="w-full rounded-2xl border-0 bg-white px-5 py-4 text-sm text-gray-800 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-emerald-600 focus:outline-none transition-all placeholder:text-gray-400 resize-none" 
                        placeholder="Como podemos ajudar?"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="mt-4 w-full sm:w-max rounded-full bg-emerald-950 px-10 py-4 text-[11px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-emerald-800 hover:shadow-lg focus:ring-2 focus:ring-emerald-950 focus:ring-offset-2 focus:ring-offset-[#F8F6F4] focus:outline-none"
                    >
                      ENVIAR MENSAGEM
                    </button>
                    
                    <p className="mt-2 text-xs text-gray-400 font-light px-1">
                      Ao enviar seus dados, você concorda com nossa{' '}
                      <a href="/politica-de-privacidade" className="text-emerald-700 hover:text-emerald-900 transition-colors hover:underline">
                        Política de Privacidade
                      </a>.
                    </p>
                  </form>
              </div>

            

              {/* Esquerda - Cartão premium de contato */}
              <div className="bg-white rounded-[2rem] p-6 lg:p-12 shadow-sm border border-transparent overflow-hidden">
                <div className="flex flex-col gap-8 lg:gap-10">
                  
                  <div className="flex items-start gap-4 lg:gap-6 group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100 lg:h-12 lg:w-12">
                      <MessageCircle className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-950 lg:mb-2 lg:text-xs">WhatsApp</h3>
                      <p className="truncate text-[10px] font-medium text-gray-700 lg:text-[11px]">(11) 93492-4155</p>
                    </div>
                  </div>
                  
                  <div className="h-[1px] w-full bg-gray-100" />

                  <div className="flex items-start gap-4 lg:gap-6 group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100 lg:h-12 lg:w-12">
                      <Mail className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-950 lg:mb-2 lg:text-xs">E-mail</h3>
                      <a href="mailto:contato@mix10pro.com.br" className="break-all text-[10px] font-medium text-gray-700 transition-colors hover:text-emerald-700 lg:text-[11px]">
                        contato@mix10pro.com.br
                      </a>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-gray-100" />

                  <div className="flex items-start gap-4 lg:gap-6 group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100 lg:h-12 lg:w-12">
                      <Clock className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-950 lg:mb-2 lg:text-xs">Atendimento</h3>
                      <p className="text-[10px] font-normal leading-relaxed text-gray-600 lg:text-[11px]">
                        Segunda a sexta<br />
                        das 9h às 17h30
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              </div>
          </div>
        </section>

        {/* BOTTOM SECTION */}
        <section className="bg-[#FAF9F7] py-24 sm:py-32">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="mb-6 text-2xl font-light tracking-tight text-emerald-950 sm:text-3xl">
              Atendimento transparente e suporte dedicado.
            </h2>
            <p className="text-[14px] sm:text-base font-light text-gray-500 leading-relaxed max-w-xl mx-auto">
              Buscamos oferecer uma experiência segura, clara e acolhedora em todas as etapas da sua jornada com o MIX10 PRO.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
