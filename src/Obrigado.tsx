import React from "react";
import { CheckCircle, Truck, MessageCircle, Package, Bell } from "lucide-react";
import { useLocation } from "react-router-dom";
import { trackPurchase } from "./services/tracking";

const getLpVersion = () => {
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };
  return getCookie('lp_version') || localStorage.getItem('lp_version') || 'original';
};

export default function Obrigado() {
  const location = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Obrigado";

    if ((import.meta as any).env?.DEV) {
      console.log("[META DEBUG] Obrigado mounted", {
        hasFbq: typeof (window as any).fbq === "function",
        state: location.state
      });
    }

    // Track Purchase event with Meta Pixel with deduplication
    let state = location.state || {};
    if (!state.paymentId || !state.planId) {
      try {
        const stored = localStorage.getItem("last_purchase");
        if (stored) {
          const parsed = JSON.parse(stored);
          state = { ...parsed, ...state };
        }
      } catch (e) {
        // ignore
      }
    }

    if (state.planId) {
      trackPurchase(
        state.paymentId,
        state.planId,
        state.value || 0,
        state.quantity || 1,
        getLpVersion(),
        state.orderId
      );
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-[#F8F6F4] font-sans text-gray-900 flex flex-col pt-10">
      {/* HEADER LOGO */}
      <div className="w-full flex justify-center mb-10">
        <a href="/">
          <img
            src="/logo.png"
            alt="MIX10 PRO"
            className="h-[48px] object-contain"
          />
        </a>
      </div>

      <div className="flex-grow flex flex-col items-center justify-start px-6 pb-20">
        <div className="w-full max-w-2xl bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle
              className="w-10 h-10 text-emerald-600"
              strokeWidth={1.5}
            />
          </div>

          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-gray-900 leading-tight mb-2">
            Seu pedido foi{" "}
            <span className="font-medium text-emerald-800">confirmado.</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-normal mb-10">
            Agora começa sua nova rotina.
          </p>

          <div className="w-full bg-gray-50 rounded-2xl p-6 md:p-8 text-left border border-gray-100 mb-8">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 mb-6 flex items-center gap-2">
              <Truck className="w-4 h-4" /> O que acontece agora?
            </h3>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-5 h-5 text-emerald-500 shrink-0"
                  strokeWidth={2}
                />
                <span className="text-sm text-gray-700">Pedido confirmado</span>
              </li>
              <li className="flex items-start gap-3">
                <Package
                  className="w-5 h-5 text-yellow-500 shrink-0 animate-pulse"
                  strokeWidth={2}
                />
                <span className="text-sm text-gray-800 font-medium">
                  Separação do produto
                </span>
              </li>
              <li className="flex items-start gap-3 opacity-60">
                <Truck
                  className="w-5 h-5 text-gray-400 shrink-0"
                  strokeWidth={2}
                />
                <span className="text-sm text-gray-500">
                  Envio do código de rastreio
                </span>
              </li>
              <li className="flex items-start gap-3 opacity-60">
                <Bell
                  className="w-5 h-5 text-gray-400 shrink-0"
                  strokeWidth={2}
                />
                <span className="text-sm text-gray-500">
                  Atualizações via WhatsApp/e-mail
                </span>
              </li>
            </ul>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-medium bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100">
                <span className="font-bold">IMPORTANTE:</span> O prazo de
                entrega começa a contar a partir do envio do código de rastreio.
              </p>
            </div>
          </div>

          <div className="w-full bg-[#0d2e1f] text-white rounded-2xl p-6 md:p-8 text-left mb-8 shadow-md">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-emerald-400 mb-2 flex items-center gap-2">
              Como aproveitar melhor seu tratamento
            </h3>

            <ul className="space-y-4 mt-6 text-emerald-50">
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-5 h-5 text-emerald-400 shrink-0"
                  strokeWidth={2}
                />
                <span className="text-sm font-light">Uso contínuo diário</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-5 h-5 text-emerald-400 shrink-0"
                  strokeWidth={2}
                />
                <span className="text-sm font-light">
                  Consuma conforme orientação da embalagem
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-5 h-5 text-emerald-400 shrink-0"
                  strokeWidth={2}
                />
                <span className="text-sm font-light">
                  Resultados tendem a ser progressivos
                </span>
              </li>
            </ul>
          </div>

          <div className="w-full text-center space-y-4 mb-10 max-w-lg mx-auto">
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Muitas pessoas convivem por anos com dores, rigidez e limitações
              acreditando que isso faz parte da rotina.
            </p>
            <p className="text-[14px] text-gray-800 font-medium leading-relaxed">
              Seu pedido representa uma decisão de cuidar do corpo antes que os
              limites aumentem.
            </p>
          </div>

          <div className="w-full border-t border-gray-100 pt-8 mt-2 flex flex-col items-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Dúvidas sobre seu pedido?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <a
                href="https://wa.me/5511934924155?text=Ol%C3%A1%2C%20acabei%20de%20concluir%20meu%20pedido%20e%20tenho%20d%C3%BAvidas."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#25D366] text-white px-6 py-4 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-[#1EBE5D] transition-colors focus:ring-2 focus:ring-[#25D366] focus:outline-none shadow-sm text-center"
              >
                <MessageCircle className="w-5 h-5" />
                Concluí meu pedido
              </a>
              <a
                href="https://wa.me/5511934924155?text=Ol%C3%A1%2C%20acabei%20de%20fazer%20o%20pagamento%20e%20tenho%20d%C3%BAvidas%20sobre%20o%20meu%20pedido."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-800 text-white px-6 py-4 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-emerald-900 transition-colors focus:ring-2 focus:ring-emerald-800 focus:outline-none shadow-sm text-center"
              >
                <MessageCircle className="w-5 h-5" />
                Fiz o pagamento
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
