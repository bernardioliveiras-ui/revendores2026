import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldCheck, CreditCard, Truck, Tag, Lock, ArrowRight } from "lucide-react";

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export default function RecompraOfertas() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCoupon = searchParams.get("coupon");
  const storedCoupon = localStorage.getItem("recompraCouponCode") || getCookie("recompraCouponCode");
  const couponCode = urlCoupon || storedCoupon;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Ofertas Especiais de Recompra | MIX10 PRO";

    if (!couponCode) {
      navigate("/recompra");
    } else if (!urlCoupon) {
      setSearchParams({ coupon: couponCode });
    }
  }, [couponCode, urlCoupon, navigate, setSearchParams]);

  const handleSelectKit = (planId: number) => {
    if (couponCode) {
      navigate(`/checkout?plan=${planId}&coupon=${couponCode}`);
    }
  };

  const offers = [
    {
      id: 1,
      title: "1 CAIXA",
      subtitle: "Para manter sua rotina por 30 dias",
      originalPrice: 109.90,
      discountedPrice: 98.91,
      installments: 3,
      installmentValue: 34.96,
      image: "/kit-1.webp",
      popular: true,
      saving: 10.99,
      badge: "Oferta Exclusiva"
    },
    {
      id: 2,
      title: "3 CAIXAS",
      subtitle: "Mais escolhido para continuidade",
      originalPrice: 229.70,
      discountedPrice: 206.73,
      installments: 6,
      installmentValue: 38.15,
      image: "/kit-3.webp",
      popular: false,
      saving: 22.97,
      badge: "MAIS ESCOLHIDO"
    },
    {
      id: 3,
      title: "5 CAIXAS",
      subtitle: "Melhor custo por mês de uso",
      originalPrice: 349.70,
      discountedPrice: 314.73,
      installments: 10,
      installmentValue: 36.87,
      image: "/kit-5.webp",
      popular: false,
      saving: 34.97,
      badge: "MELHOR CUSTO-BENEFÍCIO"
    }
  ];

  const visibleOffers = offers.filter((o) => o.id === 1);

  return (
    <div className="min-h-screen bg-[#F8F6F4] font-sans text-gray-900 flex flex-col justify-between">
      {/* Header */}
      <div className="sticky top-0 z-50 w-full">
        <header className="py-5 px-6 sm:px-8 relative shrink-0 z-20" style={{ background: 'linear-gradient(135deg, #0b262c, #0d272c, #000000)' }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/">
              <img
                src="/logo-light.png"
                alt="MIX10 PRO"
                className="h-8 object-contain"
              />
            </a>
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              <Lock className="h-3 w-3" strokeWidth={2.5} />
              <span>Conexão Segura</span>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-12 md:py-16">
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-4">
            <Tag className="w-3.5 h-3.5" />
            Cupom Aplicado: {couponCode}
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-gray-900 leading-tight mb-4">
            Garanta sua caixa com 10% de desconto exclusivo para recompra
          </h1>
          <p className="text-gray-500 text-sm font-light">
            Seu cupom já está aplicado na oferta abaixo. Garanta sua caixa e continue seu cuidado diário com MIX10 PRO.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="max-w-md mx-auto items-stretch">
          {visibleOffers.map((offer) => (
            <motion.div
              key={offer.id}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`rounded-[32px] bg-white border flex flex-col justify-between p-8 md:p-10 shadow-sm relative transition-all duration-300 hover:shadow-md ${
                offer.popular 
                  ? "border-emerald-600 ring-1 ring-emerald-600 md:scale-105 z-10" 
                  : "border-gray-100"
              }`}
            >
              {/* Highlight Badge */}
              <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider leading-tight shadow-sm whitespace-nowrap ${
                offer.popular 
                  ? "bg-emerald-600 text-white" 
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}>
                {offer.badge}
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mt-2 text-center uppercase tracking-wide">
                  {offer.title}
                </h3>
                <p className="text-xs font-light text-gray-400 text-center tracking-wider mb-6">
                  {offer.subtitle}
                </p>

                {/* Kit Image */}
                <div className="h-40 flex items-center justify-center mb-6">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="h-full object-contain transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              <div>
                {/* Price block */}
                <div className="flex flex-col items-center mb-6 pt-6 border-t border-gray-50">
                  <span className="text-xs text-gray-400 line-through">
                    De R$ {offer.originalPrice.toFixed(2).replace(".", ",")}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-gray-900">
                      R$ {offer.discountedPrice.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded mt-2 uppercase tracking-wide">
                    Economize R$ {(offer.originalPrice - offer.discountedPrice).toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-xs font-medium text-gray-500 mt-3 uppercase tracking-wider">
                    Ou em {offer.installments}x de R$ {offer.installmentValue.toFixed(2).replace(".", ",")}
                  </span>
                </div>

                <button
                  onClick={() => handleSelectKit(offer.id)}
                  className={`w-full inline-flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-2xl text-xs tracking-widest uppercase transition-all active:scale-95 shadow-md ${
                    offer.popular
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                      : "bg-[#0d2e1f] hover:bg-emerald-950 text-white"
                  }`}
                >
                  COMPRAR COM DESCONTO
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benefits bar */}
        <div className="mt-20 pt-10 border-t border-gray-250/70">
          <div className="flex flex-wrap justify-center gap-y-6 gap-x-8 md:gap-16">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Compra 100% Segura</h4>
                <p className="text-[10px] text-gray-400 font-light">Seus dados estão protegidos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CreditCard className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Até 10x no Cartão</h4>
                <p className="text-[10px] text-gray-400 font-light">Facilidade no parcelamento</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Truck className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Frete Econômico</h4>
                <p className="text-[10px] text-gray-400 font-light">Rápido para todo o Brasil</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 border-t border-gray-200 bg-white">
        <p className="text-[11px] text-gray-400 font-light">
          &copy; {new Date().getFullYear()} MIX10 PRO. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
