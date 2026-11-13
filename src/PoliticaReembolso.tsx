import React from 'react';
import { useScroll } from "./hooks/useScroll";
import { ArrowLeft } from 'lucide-react';
import Footer from './components/Footer';

export default function PoliticaReembolso() {
  React.useEffect(() => {
    document.title = "Política de Reembolso";
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

      <main className="mx-auto max-w-[800px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-12">
          <h1 className="mb-4 text-2xl font-light tracking-tight text-emerald-950 sm:text-3xl md:text-4xl">
            Política de Reembolso e Devolução
          </h1>
          <p className="mb-10 text-xs sm:text-sm text-gray-500">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <div className="prose prose-emerald max-w-none text-sm md:text-base text-gray-600">
            <p className="mb-6 leading-relaxed">
              No MIX10 PRO, buscamos oferecer uma experiência segura, transparente e satisfatória em todas as etapas da sua compra.
            </p>
            <p className="mb-10 leading-relaxed border-b border-gray-100 pb-10">
              Caso seja necessário solicitar devolução, troca ou reembolso, confira abaixo nossas condições e orientações.
            </p>

            <h2 className="mb-4 text-lg sm:text-xl font-semibold text-emerald-900">1. Direito de arrependimento</h2>
            <p className="mb-4 leading-relaxed">
              Conforme previsto no Código de Defesa do Consumidor, o cliente poderá solicitar o cancelamento da compra em até 7 (sete) dias corridos após o recebimento do produto.
            </p>
            <p className="mb-4 leading-relaxed">
              Para que a devolução seja aprovada, o produto deverá:
            </p>
            <ul className="mb-10 list-inside list-disc space-y-2 pl-4 border-b border-gray-100 pb-10">
              <li>estar sem sinais de uso;</li>
              <li>ser devolvido em sua embalagem original;</li>
              <li>conter todos os itens enviados no pedido.</li>
            </ul>

            <h2 className="mb-4 text-lg sm:text-xl font-semibold text-emerald-900">2. Produtos com avaria ou divergência</h2>
            <p className="mb-4 leading-relaxed">
              Caso o produto seja entregue com avaria, embalagem violada ou divergência no pedido, recomendamos entrar em contato imediatamente após o recebimento.
            </p>
            <p className="mb-10 leading-relaxed border-b border-gray-100 pb-10">
              Nossa equipe realizará a análise e orientará sobre os próximos passos para troca ou reenvio.
            </p>

            <h2 className="mb-4 text-lg sm:text-xl font-semibold text-emerald-900">3. Reembolso</h2>
            <p className="mb-4 leading-relaxed">
              Após o recebimento e análise do produto devolvido, o reembolso poderá ser realizado conforme a forma de pagamento utilizada no pedido.
            </p>
            <p className="mb-10 leading-relaxed border-b border-gray-100 pb-10">
              Os prazos podem variar conforme a operadora de pagamento ou instituição financeira responsável pela transação.
            </p>

            <h2 className="mb-4 text-lg sm:text-xl font-semibold text-emerald-900">4. Prazo para análise</h2>
            <p className="mb-10 leading-relaxed border-b border-gray-100 pb-10">
              Após o recebimento da devolução, o prazo para análise poderá ser de até 7 (sete) dias úteis.
            </p>

            <h2 className="mb-4 text-lg sm:text-xl font-semibold text-emerald-900">5. Produtos não elegíveis para devolução</h2>
            <p className="mb-4 leading-relaxed">
              Não serão aceitos produtos:
            </p>
            <ul className="mb-10 list-inside list-disc space-y-2 pl-4 border-b border-gray-100 pb-10">
              <li>com sinais de uso inadequado;</li>
              <li>sem embalagem original;</li>
              <li>enviados fora do prazo legal;</li>
              <li>danificados por mau uso.</li>
            </ul>

            <h2 className="mb-4 text-lg sm:text-xl font-semibold text-emerald-900">6. Como solicitar</h2>
            <p className="mb-6 leading-relaxed">
              Para solicitar troca, devolução ou reembolso, entre em contato através dos canais oficiais do MIX10 PRO:
            </p>
            
            <div className="mb-6 rounded-lg bg-gray-50 p-6 text-sm md:text-base">
              <p className="mb-2"><span className="font-medium text-emerald-950">WhatsApp:</span> (11) 93492-4155</p>
              <p><span className="font-medium text-emerald-950">E-mail:</span> <a href="mailto:sac@mix10pro.com.br" className="text-emerald-700 hover:underline">sac@mix10pro.com.br</a></p>
            </div>

            <p className="mb-4 leading-relaxed">
              Nossa equipe irá orientar você em todas as etapas do processo.
            </p>
            <p className="leading-relaxed">
              Atendimento de segunda a sexta, das 9h às 18h.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
