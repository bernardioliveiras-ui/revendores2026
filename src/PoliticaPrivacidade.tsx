import React from 'react';
import { useScroll } from "./hooks/useScroll";
import { ArrowLeft } from 'lucide-react';
import Footer from './components/Footer';

export default function PoliticaPrivacidade() {
  React.useEffect(() => {
    document.title = "Política de Privacidade";
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

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-12">
          <h1 className="mb-4 text-2xl font-light tracking-tight text-emerald-950 sm:text-3xl md:text-4xl">
            Política de Privacidade
          </h1>
          <p className="mb-8 text-xs sm:text-sm text-gray-500">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <div className="prose prose-emerald max-w-none text-sm md:text-base text-gray-600">
            <p className="mb-6 leading-relaxed">
              A sua privacidade é importante para nós. Esta Política de Privacidade explica como o MIX10 PRO realiza a coleta, utilização e proteção das informações fornecidas pelos usuários em nosso site.
            </p>
            <p className="mb-8 leading-relaxed">
              Ao navegar em nosso site, você concorda com os termos descritos nesta política.
            </p>

            <h2 className="mb-4 mt-8 text-lg sm:text-xl font-semibold text-emerald-900">1. Informações coletadas</h2>
            <p className="mb-4 leading-relaxed">
              Podemos coletar informações fornecidas diretamente por você, como:
            </p>
            <ul className="mb-6 list-inside list-disc space-y-2 pl-4">
              <li>Nome</li>
              <li>Telefone</li>
              <li>E-mail</li>
              <li>Cidade/Estado</li>
              <li>Dados enviados em formulários ou atendimento via WhatsApp</li>
            </ul>
            <p className="mb-4 leading-relaxed">
              Além disso, algumas informações podem ser coletadas automaticamente durante sua navegação, incluindo:
            </p>
            <ul className="mb-8 list-inside list-disc space-y-2 pl-4">
              <li>Endereço IP</li>
              <li>Tipo de dispositivo</li>
              <li>Navegador utilizado</li>
              <li>Páginas acessadas</li>
              <li>Tempo de navegação</li>
              <li>Dados de interação com anúncios e páginas</li>
            </ul>

            <h2 className="mb-4 mt-8 text-lg sm:text-xl font-semibold text-emerald-900">2. Como utilizamos suas informações</h2>
            <p className="mb-4 leading-relaxed">
              As informações coletadas podem ser utilizadas para:
            </p>
            <ul className="mb-8 list-inside list-disc space-y-2 pl-4">
              <li>Atendimento e suporte</li>
              <li>Processamento de pedidos</li>
              <li>Comunicação sobre produtos e novidades</li>
              <li>Melhoria da experiência de navegação</li>
              <li>Análises estatísticas e desempenho do site</li>
              <li>Campanhas de marketing e remarketing</li>
              <li>Personalização de anúncios</li>
            </ul>

            <h2 className="mb-4 mt-8 text-lg sm:text-xl font-semibold text-emerald-900">3. Cookies e tecnologias de rastreamento</h2>
            <p className="mb-4 leading-relaxed">
              Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência em nosso site.
            </p>
            <p className="mb-4 leading-relaxed">
              Esses recursos podem ser utilizados para:
            </p>
            <ul className="mb-6 list-inside list-disc space-y-2 pl-4">
              <li>lembrar preferências de navegação;</li>
              <li>medir desempenho e tráfego;</li>
              <li>entender comportamento de navegação;</li>
              <li>personalizar conteúdo e anúncios;</li>
              <li>realizar campanhas de remarketing.</li>
            </ul>
            <p className="mb-4 leading-relaxed">
              Ferramentas de terceiros, como Meta Pixel e Google Analytics, podem coletar informações de navegação de forma automatizada.
            </p>
            <p className="mb-8 leading-relaxed">
              Você pode desativar os cookies diretamente nas configurações do seu navegador, embora algumas funcionalidades do site possam ser afetadas.
            </p>

            <h2 className="mb-4 mt-8 text-lg sm:text-xl font-semibold text-emerald-900">4. Compartilhamento de informações</h2>
            <p className="mb-4 leading-relaxed">
              O MIX10 PRO não comercializa dados pessoais dos usuários.
            </p>
            <p className="mb-4 leading-relaxed">
              As informações poderão ser compartilhadas apenas quando necessário para:
            </p>
            <ul className="mb-8 list-inside list-disc space-y-2 pl-4">
              <li>processamento de pagamentos;</li>
              <li>plataformas de anúncios;</li>
              <li>ferramentas de análise;</li>
              <li>serviços de hospedagem e tecnologia;</li>
              <li>cumprimento de obrigações legais.</li>
            </ul>

            <h2 className="mb-4 mt-8 text-lg sm:text-xl font-semibold text-emerald-900">5. Segurança das informações</h2>
            <p className="mb-8 leading-relaxed">
              Adotamos medidas técnicas e organizacionais para proteger as informações pessoais contra acessos não autorizados, perda, alteração ou divulgação indevida.
            </p>

            <h2 className="mb-4 mt-8 text-lg sm:text-xl font-semibold text-emerald-900">6. Direitos do usuário</h2>
            <p className="mb-4 leading-relaxed">
              Nos termos da Lei Geral de Proteção de Dados (LGPD), você poderá solicitar:
            </p>
            <ul className="mb-8 list-inside list-disc space-y-2 pl-4">
              <li>acesso aos seus dados;</li>
              <li>correção de informações;</li>
              <li>exclusão de dados;</li>
              <li>revogação de consentimento;</li>
              <li>esclarecimentos sobre o tratamento das informações.</li>
            </ul>

            <h2 className="mb-4 mt-8 text-lg sm:text-xl font-semibold text-emerald-900">7. Links externos</h2>
            <p className="mb-8 leading-relaxed">
              Nosso site poderá conter links para plataformas externas. Não nos responsabilizamos pelas políticas de privacidade ou conteúdo de terceiros.
            </p>

            <h2 className="mb-4 mt-8 text-lg sm:text-xl font-semibold text-emerald-900">8. Alterações desta política</h2>
            <p className="mb-8 leading-relaxed">
              Esta Política de Privacidade poderá ser atualizada periodicamente para refletir melhorias ou alterações legais e operacionais.
            </p>

            <h2 className="mb-4 mt-8 text-lg sm:text-xl font-semibold text-emerald-900">9. Contato</h2>
            <p className="mb-4 leading-relaxed">
              Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento de dados pessoais, entre em contato:
            </p>
            <div className="rounded-lg bg-gray-50 p-6 text-sm md:text-base">
              <p className="mb-2 font-medium text-emerald-950">MIX10 PRO</p>
              <p className="mb-1">LORD GROUP NETWORK EPP</p>
              <p className="mb-1">CNPJ: 47.201.289/0001-70</p>
              <p>Telefone/WhatsApp: (11) 93492-4155</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
