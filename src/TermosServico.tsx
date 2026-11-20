import React from 'react';
import { useScroll } from "./hooks/useScroll";
import { ArrowLeft } from 'lucide-react';
import Footer from './components/Footer';

export default function TermosServico() {
  React.useEffect(() => {
    document.title = "Termos de Serviço";
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

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">
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

      <main className="mx-auto max-w-[800px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {/* Simple Hero */}
        <div className="mb-16">
          <h1 className="mb-6 text-xl font-light tracking-tight text-emerald-950 sm:text-4xl lg:text-5xl">
            Termos de Serviço
          </h1>
          <p className="text-base font-light text-gray-500 leading-relaxed md:text-xl md:max-w-xl">
            Informações importantes sobre utilização do site, produtos e experiência de compra.
          </p>
          <p className="mt-8 text-xs sm:text-sm text-gray-400">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="prose prose-emerald max-w-none text-sm md:text-base text-gray-600">
          <p className="mb-12 text-base sm:text-lg font-light leading-relaxed">
            Bem-vindo ao site do MIX10 PRO. Ao acessar e utilizar este site, você concorda com os presentes Termos de Serviço. Recomendamos a leitura atenta das informações abaixo antes de navegar, realizar compras ou utilizar nossos canais de atendimento.
          </p>

          <h2 className="mb-6 mt-16 text-lg sm:text-xl font-medium text-emerald-900">1. Uso do site</h2>
          <p className="mb-6 leading-relaxed font-light">
            O conteúdo deste site é destinado à apresentação institucional e comercial do MIX10 PRO, bem como à disponibilização de informações relacionadas aos produtos, atendimento e experiência de compra.
          </p>
          <p className="mb-12 leading-relaxed font-light">
            O usuário compromete-se a utilizar este site de forma ética, responsável e em conformidade com a legislação vigente.
          </p>

          <h2 className="mb-6 mt-16 text-lg sm:text-xl font-medium text-emerald-900">2. Informações sobre o produto</h2>
          <p className="mb-6 leading-relaxed font-light">
            O MIX10 PRO é um suplemento alimentar.
          </p>
          <p className="mb-6 leading-relaxed font-light">
            As informações disponibilizadas neste site possuem caráter informativo e não substituem orientações médicas, diagnósticos ou tratamentos profissionais.
          </p>
          <p className="mb-6 leading-relaxed font-light">
            Os resultados podem variar de acordo com características individuais, rotina de uso e hábitos de cada pessoa.
          </p>
          <p className="mb-12 leading-relaxed font-light text-gray-500 italic">
            Produto dispensado de registro conforme RDC ANVISA nº 240/2018.
          </p>

          <h2 className="mb-6 mt-16 text-lg sm:text-xl font-medium text-emerald-900">3. Compras e pagamentos</h2>
          <p className="mb-6 leading-relaxed font-light">
            As compras realizadas através do site estão sujeitas à disponibilidade de estoque, aprovação do pagamento e confirmação dos dados fornecidos pelo cliente.
          </p>
          <p className="mb-12 leading-relaxed font-light">
            Os valores, condições promocionais e disponibilidade dos produtos poderão ser alterados sem aviso prévio.
          </p>

          <h2 className="mb-6 mt-16 text-lg sm:text-xl font-medium text-emerald-900">4. Política de entrega</h2>
          <p className="mb-6 leading-relaxed font-light">
            Os prazos de entrega poderão variar conforme a região, modalidade de envio e disponibilidade logística.
          </p>
          <p className="mb-12 leading-relaxed font-light">
            Eventuais atrasos causados por terceiros, transportadoras ou fatores externos não caracterizam responsabilidade direta do MIX10 PRO.
          </p>

          <h2 className="mb-6 mt-16 text-lg sm:text-xl font-medium text-emerald-900">5. Propriedade intelectual</h2>
          <p className="mb-6 leading-relaxed font-light">
            Todos os elementos presentes neste site, incluindo textos, imagens, marcas, logotipos, identidade visual e materiais gráficos, são protegidos por direitos autorais e propriedade intelectual.
          </p>
          <p className="mb-12 leading-relaxed font-light">
            Não é permitida a reprodução, distribuição ou utilização sem autorização prévia.
          </p>

          <h2 className="mb-6 mt-16 text-lg sm:text-xl font-medium text-emerald-900">6. Limitação de responsabilidade</h2>
          <p className="mb-6 leading-relaxed font-light">
            O MIX10 PRO não garante resultados específicos, considerando que os efeitos do produto podem variar conforme fatores individuais.
          </p>
          <p className="mb-12 leading-relaxed font-light">
            O uso do produto deve respeitar as orientações descritas na embalagem e demais recomendações oficiais.
          </p>

          <h2 className="mb-6 mt-16 text-lg sm:text-xl font-medium text-emerald-900">7. Privacidade e proteção de dados</h2>
          <p className="mb-12 leading-relaxed font-light">
            As informações coletadas através deste site são tratadas conforme nossa Política de Privacidade e em conformidade com a legislação aplicável de proteção de dados.
          </p>

          <h2 className="mb-6 mt-16 text-lg sm:text-xl font-medium text-emerald-900">8. Alterações destes termos</h2>
          <p className="mb-12 leading-relaxed font-light">
            Os presentes Termos de Serviço poderão ser atualizados periodicamente para refletir alterações operacionais, legais ou melhorias na experiência do usuário.
          </p>

          <h2 className="mb-6 mt-16 text-lg sm:text-xl font-medium text-emerald-900">9. Contato</h2>
          <p className="mb-8 leading-relaxed font-light">
            Em caso de dúvidas, suporte ou solicitações, entre em contato através dos canais oficiais do MIX10 PRO:
          </p>
          
          <div className="flex flex-col gap-3 font-light text-sm md:text-base text-gray-600">
            <p className="mb-1"><span className="text-emerald-900 font-medium">WhatsApp:</span> (11) 93492-4155</p>
            <p className="mb-4"><span className="text-emerald-900 font-medium">E-mail:</span> <a href="mailto:sac@mix10pro.com.br" className="text-emerald-600 hover:text-emerald-800 transition-colors">sac@mix10pro.com.br</a></p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Atendimento de segunda a sexta, das 9h às 18h.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
