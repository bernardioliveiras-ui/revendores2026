import React, { useState, useEffect } from "react";
import {
  Facebook,
  Instagram,
  Globe,
  ChevronDown,
} from "lucide-react";

interface FooterProps {
  containerClassName?: string;
  simplified?: boolean;
}

export default function Footer({ containerClassName = "max-w-5xl", simplified = false }: FooterProps) {
  const [currentLang, setCurrentLang] = useState("pt");

  useEffect(() => {
    // Check cookies to determine current language
    const match = document.cookie.match(/googtrans=\/pt\/([a-z]{2})/);
    if (match) {
      setCurrentLang(match[1]);
    }

    // Add Google Translate script if not exists
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          { pageLanguage: "pt", autoDisplay: false },
          "google_translate_element"
        );
      };
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    const domain = window.location.hostname;
    
    // Atualiza o cookie pra uso real (fora do iframe)
    if (langCode === "pt") {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${domain}; path=/;`;
    } else {
      document.cookie = `googtrans=/pt/${langCode}; path=/;`;
      document.cookie = `googtrans=/pt/${langCode}; domain=.${domain}; path=/;`;
    }

    // Tenta aplicar a tradução sem recarregar a página (ideal para o preview e mais rápido)
    const googleSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (googleSelect) {
      if (langCode === 'pt') {
        // Volta ao idioma original
        const iframe = document.querySelector('.goog-te-banner-frame') as HTMLIFrameElement;
        if (iframe && iframe.contentDocument) {
          // Clique simulado no botão "Mostrar original" do banner do Google
          const restoreBtn = iframe.contentDocument.querySelector('button[id*="restore"]') as HTMLButtonElement;
          if (restoreBtn) restoreBtn.click();
        } else {
           // Fallback seguro se não encontrar
           window.location.reload();
        }
      } else {
        // Altera o combo do Google e dispara o evento
        googleSelect.value = langCode;
        googleSelect.dispatchEvent(new Event('change'));
      }
    } else {
      // Fallback
      window.location.reload();
    }
  };

  const getLangDisplay = () => {
    switch (currentLang) {
      case "en":
        return { label: "Inglês", code: "EN" };
      case "es":
        return { label: "Espanhol", code: "ES" };
      default:
        return { label: "Português", code: "BR" };
    }
  };

  const activeLang = getLangDisplay();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (["/", "/lp-v2", "/lp-v3"].includes(window.location.pathname)) {
      e.preventDefault();
      const element = document.getElementById(targetId);
      if (element) {
        const headerOffset = 72;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    } else {
      // Allow default navigation to /#targetId
    }
  };

  return (
    <>
      <div id="google_translate_element" className="hidden"></div>
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className={`mx-auto px-4 py-16 lg:py-20 sm:px-6 lg:px-8 ${containerClassName}`}>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-16 text-[12px] lg:text-[13px] text-gray-500 font-light">
            {/* Logo & Info */}
            <div className="lg:col-span-1 flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="mb-4">
                <img src="/logo.png" alt="MIX10 PRO" className="h-10 object-contain w-full object-center lg:object-left opacity-80" />
              </div>
              <p className="mb-6 text-[11px] font-normal text-gray-600 leading-relaxed">
                Fórmula premium com 10 ativos estratégicos para apoiar sua saúde
                articular, muscular e óssea, promovendo mais movimento e
                qualidade de vida.
              </p>
            </div>

            {/* Links columns based on simplified mode */}
            {simplified ? (
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 text-[11px] lg:text-xs uppercase tracking-wider">
                    INSTITUCIONAL
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="/sobre-nos" className="hover:text-emerald-700">
                        Sobre nós
                      </a>
                    </li>
                    <li>
                      <a href="/#faq" onClick={(e) => handleLinkClick(e, "faq")} className="hover:text-emerald-700">
                        FAQ
                      </a>
                    </li>
                    <li>
                      <a href="/contato" className="hover:text-emerald-700">
                        Contato
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 text-[11px] lg:text-xs uppercase tracking-wider">
                    POLÍTICAS
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="/politica-de-privacidade" className="hover:text-emerald-700">
                        Política de Privacidade
                      </a>
                    </li>
                    <li>
                      <a href="/politica-de-reembolso" className="hover:text-emerald-700">
                        Política de Reembolso
                      </a>
                    </li>
                    <li>
                      <a href="/politica-de-reembolso" className="hover:text-emerald-700">
                        Trocas e Devoluções
                      </a>
                    </li>
                    <li>
                      <a href="/termos-de-servico" className="hover:text-emerald-700">
                        Termos de Uso
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col items-center sm:items-start">
                  <h3 className="font-semibold text-gray-900 mb-4 text-[11px] lg:text-xs uppercase tracking-wider">
                    CONTATO & SEGURANÇA
                  </h3>
                  <p className="mb-4">contato@mix10pro.com.br</p>
                  <a
                    href="https://transparencyreport.google.com/safe-browsing/search?url=mix10pro.com.br&hl=pt_BR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-85 transition-opacity"
                  >
                    <img 
                      src="/siteseguro.jpg" 
                      alt="Site Seguro SSL" 
                      className="h-12 object-contain"
                    />
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Standard non-simplified Columns */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 text-[11px] lg:text-xs uppercase tracking-wider text-center lg:text-left">
                    INSTITUCIONAL
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="/sobre-nos" className="hover:text-emerald-700">
                        Sobre nós
                      </a>
                    </li>
                    <li>
                      <a href="/#ingredientes" onClick={(e) => handleLinkClick(e, "ingredientes")} className="hover:text-emerald-700">
                        Ingredientes
                      </a>
                    </li>
                    <li>
                      <a href="/#benefícios" onClick={(e) => handleLinkClick(e, "benefícios")} className="hover:text-emerald-700">
                        Benefícios
                      </a>
                    </li>
                    <li>
                      <a href="/#depoimentos" onClick={(e) => handleLinkClick(e, "depoimentos")} className="hover:text-emerald-700">
                        Depoimentos
                      </a>
                    </li>
                    <li>
                      <a href="/contato" className="hover:text-emerald-700">
                        Contato
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 text-[11px] lg:text-xs uppercase tracking-wider text-center lg:text-left">
                    MAIS INFORMAÇÕES
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="/#faq" onClick={(e) => handleLinkClick(e, "faq")} className="hover:text-emerald-700">
                        FAQ
                      </a>
                    </li>
                    <li>
                      <a href="/politica-de-privacidade" className="hover:text-emerald-700">
                        Política de Privacidade
                      </a>
                    </li>
                    <li>
                      <a href="/termos-de-servico" className="hover:text-emerald-700">
                        Termos de Uso
                      </a>
                    </li>
                    <li>
                      <a href="/politica-de-reembolso" className="hover:text-emerald-700">
                        Trocas e Devoluções
                      </a>
                    </li>
                    <li>
                      <a href="/revendedores" className="hover:text-emerald-700 flex items-center gap-1.5">
                        Revendedores
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Contact & Socials for non-simplified */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                  <h3 className="font-semibold text-gray-900 mb-4 text-[11px] lg:text-xs uppercase tracking-wider text-center lg:text-left">
                    CONTATO
                  </h3>
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                    <a href="https://www.facebook.com/mix10pro" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                      <Facebook className="h-3.5 w-3.5" />
                    </a>
                    <a href="https://www.instagram.com/mix10prooficial" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                      <Instagram className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <ul className="space-y-3">
                    <li>contato@mix10pro.com.br</li>
                  </ul>

                  <div className="mt-12 lg:mt-8 flex justify-center lg:justify-start w-full">
                    <a
                      href="https://transparencyreport.google.com/safe-browsing/search?url=mix10pro.com.br&hl=pt_BR"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-85 transition-opacity"
                    >
                      <img 
                        src="/siteseguro.jpg" 
                        alt="Site Seguro SSL" 
                        className="h-12 object-contain"
                      />
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-16 sm:mt-20 border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2 text-[12px] lg:text-[13px] text-gray-600 font-medium">
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <a href="/politica-de-privacidade" className="hover:text-emerald-700 transition-colors">Política de Privacidade</a>
                <span className="text-gray-300 font-light hidden md:inline">|</span>
                <a href="/politica-de-reembolso" className="hover:text-emerald-700 transition-colors">Política de Reembolso</a>
                <span className="text-gray-300 font-light hidden md:inline">|</span>
                <a href="/termos-de-servico" className="hover:text-emerald-700 transition-colors">Termos de Serviço</a>
              </div>
              
              <div className="flex items-center justify-center relative group">
                <div className="flex items-center gap-2 cursor-pointer hover:text-emerald-700 transition-colors">
                  <Globe className="h-4 w-4" strokeWidth={1.5} />
                  <span>{activeLang.label}</span>
                  <span className="text-gray-300 font-light">|</span>
                  <span className="text-gray-400">{activeLang.code}</span>
                  <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                </div>
                {/* Dropdown */}
                <div className="absolute bottom-full right-0 pb-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  <div className="w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                    <div onClick={() => changeLanguage('pt')} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 font-medium">Português</div>
                    <div onClick={() => changeLanguage('en')} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-700">Inglês</div>
                    <div onClick={() => changeLanguage('es')} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-700">Espanhol</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 flex flex-col items-center text-center text-[10px] text-gray-400 max-w-4xl mx-auto px-4 space-y-1">
              <p className="leading-snug">
                Todas as imagens utilizadas neste site são meramente ilustrativas.
              </p>
              <p className="leading-snug">
                Este produto não é medicamento. Em caso de doença ou sintomas
                persistentes, consulte um médico. Não exceder a recomendação
                diária de consumo indicada na embalagem.
              </p>
              <p className="leading-snug">
                Não contém Glúten. Não contém Lactose. Fabricado por Morbach Nutri
                Indústria Ltda.
              </p>
              <p className="leading-snug">
                Produto comercializado por: LORD GROUP NETWORK EPP - CNPJ: 47.201.289/0001-70
              </p>
            </div>

            <div className="mt-8 border-t border-gray-100 flex items-center justify-center pt-8 px-2">
              <p className="text-[11px] text-gray-500 text-center">
                &copy; {new Date().getFullYear()} MIX10 PRO. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
