import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Copy, CheckCircle, ExternalLink, AlertCircle, Loader2 } from "lucide-react";

interface Coupon {
  code: string;
  type: string;
  value: number;
  active: boolean;
  maxUses: number;
  usedCount: number;
  status: string;
  source: string;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
}

export default function Recompra() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Seu Presente de Recompra | MIX10 PRO";
    initRecompra();
  }, []);

  const initRecompra = async () => {
    setLoading(true);
    setError(null);

    const savedCode = localStorage.getItem("recompraCouponCode") || getCookie("recompraCouponCode");

    if (savedCode) {
      try {
        const response = await fetch(`/api/recompra/coupon/${savedCode}`);
        if (response.ok) {
          const data = await response.json();
          setCoupon(data);
          // Update storage just in case
          localStorage.setItem("recompraCouponCode", data.code);
          setCookie("recompraCouponCode", data.code, 365);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Erro ao validar cupom existente, gerando um novo:", err);
      }
    }

    // If no saved code, or it is invalid/used, generate a new one
    try {
      const generateResponse = await fetch("/api/recompra/generate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (generateResponse.ok) {
        const data = await generateResponse.json();
        setCoupon(data);
        localStorage.setItem("recompraCouponCode", data.code);
        setCookie("recompraCouponCode", data.code, 365);
      } else {
        const errData = await generateResponse.json();
        setError(errData.error || "Não foi possível gerar seu cupom de desconto.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleUseCoupon = () => {
    if (coupon) {
      navigate(`/recompra/ofertas?coupon=${coupon.code}`);
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 flex flex-col justify-between relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b262c, #0d272c, #021c12)' }}>
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] lg:w-[120%] lg:h-[150%] bg-[radial-gradient(circle_at_center,_#0b7655_0%,_transparent_70%)] opacity-20 pointer-events-none z-0"></div>

      {/* Header */}
      <div className="sticky top-0 z-50 w-full">
        <div className="w-full flex justify-center py-8 z-10 relative">
          <a href="/">
            <img
              src="/logo-light.png"
              alt="MIX10 PRO"
              className="h-[40px] md:h-[48px] object-contain hover:opacity-95 transition-opacity"
            />
          </a>
        </div>
      </div>

      {/* Card Content Container */}
      <div className="flex-grow flex items-center justify-center w-full max-w-xl mx-auto px-4 py-8 z-10 relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-white/5 backdrop-blur-md rounded-[32px] p-12 shadow-2xl border border-white/10 flex flex-col items-center text-center text-white"
            >
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-6" />
              <h2 className="text-xl font-light tracking-wide">Preparando seu presente...</h2>
              <p className="text-emerald-100/50 text-xs mt-2">Estamos gerando um cupom exclusivo para você.</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-white/5 backdrop-blur-md rounded-[32px] p-8 md:p-12 shadow-2xl border border-red-500/20 flex flex-col items-center text-center text-white"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-light text-red-200 mb-4">Algo deu errado</h2>
              <p className="text-red-100/70 text-sm font-light leading-relaxed mb-8 max-w-xs">
                {error}
              </p>
              <button
                onClick={initRecompra}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl text-xs tracking-widest uppercase shadow-md transition-all active:scale-95"
              >
                Tentar Novamente
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="coupon-present"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full bg-white rounded-[32px] p-8 md:p-12 shadow-2xl border border-gray-100 flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Top icon and badge */}
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50/50 relative z-10">
                <Gift className="w-10 h-10 text-emerald-700" strokeWidth={1.5} />
              </div>

              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest text-emerald-800 bg-emerald-100 mb-6 uppercase z-10 border border-emerald-250">
                EXCLUSIVO PARA VOCÊ 🎁
              </span>

              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 leading-tight mb-2">
                Seu benefício exclusivo de recompra está aqui
              </h1>
              <p className="text-gray-500 text-sm font-light leading-relaxed mb-8 max-w-sm">
                Você ganhou 10% de desconto para continuar sua rotina de cuidado com MIX10 PRO. Use seu cupom exclusivo e mantenha seu suporte diário para mobilidade, conforto e qualidade de vida.
              </p>

              {/* Coupon display block */}
              <div className="w-full bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 mb-8 relative group">
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1.5">Código do Cupom</div>
                <div className="text-xl md:text-2xl font-mono font-extrabold text-emerald-950 tracking-wider select-all uppercase">
                  {coupon?.code}
                </div>
                
                {/* Floating click to copy overlay (subtle) */}
                <button
                  onClick={handleCopy}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-emerald-700 hover:border-emerald-200 hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  title="Copiar cupom"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* Toast notifier for copied action */}
              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mb-6 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Cupom copiado com sucesso!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={handleUseCoupon}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#0d2e1f] hover:bg-emerald-800 text-white font-bold py-4.5 px-6 rounded-xl text-xs tracking-widest uppercase shadow-md transition-all active:scale-95"
                >
                  USAR MEU CUPOM AGORA
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  className="w-full bg-white border border-gray-250 hover:bg-gray-50 text-gray-700 font-bold py-4.5 px-6 rounded-xl text-xs tracking-widest uppercase transition-all active:scale-95"
                >
                  Copiar Código
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer copyright */}
      <div className="w-full text-center py-6 z-10 relative border-t border-white/5 bg-black/10">
        <p className="text-[11px] text-emerald-100/30 font-light">
          &copy; {new Date().getFullYear()} MIX10 PRO. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
