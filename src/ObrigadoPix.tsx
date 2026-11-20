import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Copy, CheckCircle, Package } from "lucide-react";
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

export default function ObrigadoPix() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [pixData, setPixData] = useState<{
    encodedImage: string;
    payload: string;
  } | null>(location.state?.pixData || null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Obrigado";
  }, []);

  useEffect(() => {
    if (paymentId) {
      if ((import.meta as any).env?.DEV) {
        console.log("[META DEBUG] ObrigadoPix mounted", { paymentId });
      }

      // Retrieve state and fall back to localStorage if needed
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
        if ((import.meta as any).env?.DEV) {
          let contentId = 'mix10pro-kit1';
          let numItems = 1;
          if (state.planId === 2) {
            contentId = 'mix10pro-kit3';
            numItems = 3;
          } else if (state.planId === 3) {
            contentId = 'mix10pro-kit5';
            numItems = 5;
          }
          console.log("[META DEBUG] Pix Purchase payload", {
            contentId,
            value: state.value || 0,
            currency: 'BRL',
            num_items: numItems * (state.quantity || 1),
            lp_version: getLpVersion()
          });
          console.log("[META] Pix Purchase fired");
        }

        trackPurchase(
          state.paymentId,
          state.planId,
          state.value || 0,
          state.quantity || 1,
          getLpVersion(),
          state.orderId
        );
      }
    }
  }, [paymentId, location]);

  useEffect(() => {
    if (!paymentId || !pixData) {
      navigate("/");
    }
  }, [paymentId, pixData, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  useEffect(() => {
    // Poll for payment confirmation
    if (paymentId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payment-status/${paymentId}`);
          const data = await res.json();
          if (data.status === "CONFIRMED" || data.status === "RECEIVED" || data.status === "PAYMENT_RECEIVED") {
            navigate("/obrigado", {
              state: {
                value: location.state?.value,
                planTitle: location.state?.planTitle,
                planId: location.state?.planId,
                quantity: location.state?.quantity,
                paymentId: paymentId
              }
            });
          }
        } catch (e) {
          console.error("Error polling payment status", e);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentId, navigate]);

  const handleCopyPix = () => {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!pixData || !paymentId) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-[#F8F6F4] font-sans text-gray-900 flex flex-col pt-10">
      <div className="w-full flex justify-center mb-10">
        <img
          src="/logo.png"
          alt="MIX10 PRO"
          className="h-[48px] object-contain"
        />
      </div>

      <div className="flex-grow flex flex-col items-center justify-start px-6 pb-20">
        <div className="w-full max-w-xl bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-gray-900 leading-tight mb-2">
            Seu pedido está{" "}
            <span className="font-medium text-emerald-800">
              quase confirmado
            </span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-normal mb-8">
            Finalize o pagamento via PIX para liberar seu pedido.
          </p>

          {/* TIMER */}
          <div className="mb-6 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
              PIX Válido por:
            </span>
            <div className="text-3xl font-mono font-medium text-emerald-700">
              {minutes.toString().padStart(2, "0")}:
              {seconds.toString().padStart(2, "0")}
            </div>
          </div>

          {/* QR CODE */}
          <div className="mx-auto w-48 h-48 bg-white p-2 border border-gray-200 rounded-[20px] shadow-sm flex items-center justify-center mb-6">
            <img
              src={`data:image/png;base64,${pixData.encodedImage}`}
              alt="QR Code Pix"
              className="w-full h-full object-contain"
            />
          </div>

          {/* PIX COPIA E COLA */}
          <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center justify-between overflow-hidden gap-2 mb-10">
            <input
              type="text"
              readOnly
              value={pixData.payload}
              className="w-full text-xs text-center outline-none bg-transparent text-gray-500 truncate pl-2"
            />
            <button
              type="button"
              onClick={handleCopyPix}
              className="flex shrink-0 items-center gap-1 rounded bg-emerald-100 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 hover:bg-emerald-200 transition-colors"
            >
              <Copy className="h-4 w-4" />
              {copied ? "COPIADO!" : "COPIAR CÓDIGO"}
            </button>
          </div>

          {timeLeft <= 10 * 60 && timeLeft > 0 && (
            <div className="w-full bg-yellow-50 border border-yellow-100 rounded-2xl p-6 text-left shadow-sm mb-8">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                Ainda aguardando a confirmação do pagamento.
              </h3>
              <p className="text-xs text-yellow-700/80 mb-2">
                Seu pagamento será confirmado automaticamente assim que o Pix for identificado pelo banco.
              </p>
              <p className="text-xs text-yellow-700/80">
                Alguns bancos podem levar alguns minutos para concluir essa confirmação. Não feche esta página — seguimos verificando automaticamente.
              </p>
            </div>
          )}

          {timeLeft <= 0 && (
            <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-left mb-8 shadow-sm">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-2">
                Pagamento demorando para confirmar?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Se você já realizou o pagamento e ele ainda não foi confirmado, não se preocupe. Nosso atendimento pode te ajudar a verificar o status.
              </p>
              <a
                href={`https://wa.me/5511934924155?text=${encodeURIComponent(`Olá! Realizei um pagamento via Pix no checkout, mas ele ainda está aguardando confirmação. Pode me ajudar a verificar? Pedido/Pagamento: ${paymentId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center rounded-xl bg-emerald-600 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Falar com atendimento
              </a>
            </div>
          )}

          <div className="w-full bg-[#0d2e1f] text-white rounded-2xl p-6 md:p-8 text-left shadow-md mb-8">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-2">
              <Package className="w-4 h-4" /> O que acontece após o pagamento?
            </h3>

            <ul className="space-y-4 text-emerald-50">
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-5 h-5 text-emerald-400 shrink-0"
                  strokeWidth={2}
                />
                <span className="text-sm font-light">
                  Confirmação automática
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-5 h-5 text-emerald-400 shrink-0"
                  strokeWidth={2}
                />
                <span className="text-sm font-light">
                  Liberação imediata do pedido
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-5 h-5 text-emerald-400 shrink-0"
                  strokeWidth={2}
                />
                <span className="text-sm font-light">
                  Atualizações via WhatsApp/e-mail
                </span>
              </li>
            </ul>
          </div>

          <div className="w-full border-t border-gray-100 pt-8 mt-2 flex flex-col items-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Dúvidas sobre seu pagamento ou pedido?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <a
                href={`https://wa.me/5511934924155?text=${encodeURIComponent("Olá, tenho dúvida sobre o pagamento ou pedido.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#25D366] text-white px-6 py-4 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-[#1EBE5D] transition-colors focus:ring-2 focus:ring-[#25D366] focus:outline-none shadow-sm text-center"
              >
                Suporte via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
