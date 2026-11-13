import React, { useState, useEffect, useRef } from "react";
import { useScroll } from "./hooks/useScroll";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  Activity,
  Leaf,
  CheckCircle2,
  Lock,
  Menu,
  X,
} from "lucide-react";

import {
  trackViewContent,
  trackLandingPageVersion,
  trackAddToCart as trackAddToCartShared,
} from "./services/tracking";

// Components
import HeaderHero from "./components/LandingPerformance/Hero";
import OfferBar from "./components/LandingPerformance/OfferBar";
import Benefits from "./components/LandingPerformance/Benefits";
import Ingredients from "./components/LandingPerformance/Ingredients";
import Testimonials from "./components/LandingPerformance/Testimonials";
import FAQ from "./components/LandingPerformance/FAQ";
import Guarantee from "./components/LandingPerformance/Guarantee";
import FinalCTA from "./components/LandingPerformance/FinalCTA";
import StickyCTA from "./components/LandingPerformance/StickyCTA";
import Footer from "./components/Footer";
import ExitIntentPopup from "./components/ExitIntentPopup";
import Checkout from "./components/Checkout";

export const APP_PLANS = {
  1: {
    id: 1,
    title: "1 Caixa",
    price: 109.9,
    installments: 3,
    installmentValue: 38.85,
    image: "/kit-1.webp",
  },
  2: {
    id: 2,
    title: "3 Caixas",
    price: 229.7,
    installments: 6,
    installmentValue: 42.39,
    image: "/kit-3.webp",
  },
  3: {
    id: 3,
    title: "5 Caixas",
    price: 349.7,
    installments: 10,
    installmentValue: 40.97,
    image: "/kit-5.webp",
  },
};

export default function AppV3() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isScrolled = useScroll(20);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInternalMode, setIsInternalMode] = useState(false);

  const [checkoutPlan, setCheckoutPlan] = useState<{
    id: number;
    title: string;
    price: number;
    installments: number;
    installmentValue: number;
    image: string;
  } | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);

  // Dynamic head meta robots tag injection (noindex, nofollow)
  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]');
    let originalContent: string | null = null;
    let created = false;
    
    if (meta) {
      originalContent = meta.getAttribute('content');
      meta.setAttribute('content', 'noindex, nofollow');
    } else {
      const newMeta = document.createElement('meta');
      newMeta.setAttribute('name', 'robots');
      newMeta.setAttribute('content', 'noindex, nofollow');
      document.head.appendChild(newMeta);
      created = true;
    }

    return () => {
      const currentMeta = document.querySelector('meta[name="robots"]');
      if (currentMeta) {
        if (created) {
          document.head.removeChild(currentMeta);
        } else if (originalContent !== null) {
          currentMeta.setAttribute('content', originalContent);
        } else {
          currentMeta.removeAttribute('content');
        }
      }
    };
  }, []);

  const hasTrackedAddToCartRef = useRef(false);
  const lastCheckoutOrigin = useRef<'OfferTop' | 'OfferBottom' | undefined>(undefined);

  const getLpVersion = () => "v3";

  const trackAddToCart = (id: number, origin?: 'OfferTop' | 'OfferBottom', quantity: number = 1) => {
    trackAddToCartShared(id, getLpVersion(), origin, quantity);
  };

  const closeCheckout = () => {
    hasTrackedAddToCartRef.current = false;
    setCheckoutPlan(null);
  };

  // Monitor URL params for checkout direct trigger
  useEffect(() => {
    if (location.pathname === "/checkout") {
      const planId = searchParams.get("plan");
      const urlQty = Number(searchParams.get("quantity") || 1);
      if (planId) {
        const parsedPlanId = Number(planId);
        const selected = APP_PLANS[parsedPlanId as keyof typeof APP_PLANS];
        if (selected) {
          setCheckoutQuantity(urlQty || 1);
          if (!hasTrackedAddToCartRef.current) {
            hasTrackedAddToCartRef.current = true;
            lastCheckoutOrigin.current = undefined;
            trackAddToCart(parsedPlanId, undefined, urlQty || 1);
          }
          setCheckoutPlan(selected);
        }
      }
    }
  }, [location.pathname, searchParams]);

  const openCheckout = (id: number, origin?: 'OfferTop' | 'OfferBottom', quantity: number = 1) => {
    setCheckoutQuantity(quantity || 1);
    if (!hasTrackedAddToCartRef.current) {
      hasTrackedAddToCartRef.current = true;
      lastCheckoutOrigin.current = origin;
      trackAddToCart(id, origin, quantity || 1);
    }
    setCheckoutPlan(APP_PLANS[id as keyof typeof APP_PLANS]);
  };

  // Detect admin mode
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };
    
    const checkInternalMode = () => {
      const loggedInCookie = getCookie("admin_logged_in");
      if ((window as any).isInternalMode || loggedInCookie === "true") {
        setIsInternalMode(true);
      } else {
        setIsInternalMode(false);
      }
    };
    
    checkInternalMode();
    const interval = setInterval(checkInternalMode, 2000);
    return () => clearInterval(interval);
  }, []);

  // Set document title and fire meta pixel events
  useEffect(() => {
    document.title = "MIX10 PRO | LP V3 Performance - Suporte para Articulações e Mobilidade";

    if ((window as any).lastViewContentPath === window.location.pathname) {
      return;
    }
    (window as any).lastViewContentPath = window.location.pathname;

    const lpVersion = getLpVersion();
    trackViewContent(lpVersion);
    trackLandingPageVersion(lpVersion);
  }, []);

  const scrollToSection = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement> | null,
    targetId: string
  ) => {
    if (e) e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 72 + 10;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 antialiased selection:bg-emerald-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 w-full">
        <header
          className={`transition-all duration-300 ${
            isScrolled ? "h-[54px] backdrop-blur-md" : "h-[72px]"
          }`}
          style={{
            background: isScrolled
              ? "linear-gradient(135deg, rgba(11,38,44,0.88), rgba(13,39,44,0.88), rgba(0,0,0,0.88))"
              : "linear-gradient(135deg, rgba(11,38,44,1), rgba(13,39,44,1), rgba(0,0,0,1))",
          }}
        >
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-3 sm:px-8 h-full relative">
            <div className="flex items-center absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
              <img
                src="/logo-light.png"
                alt="MIX10 PRO"
                className={`object-contain w-auto transform origin-center transition-all duration-300 ${
                  isScrolled ? "h-7.5 sm:h-8.5" : "h-9.5 sm:h-11"
                }`}
              />
            </div>

            <nav className="hidden items-center md:flex gap-6 z-20">
              {[
                { label: "Benefícios", id: "beneficios" },
                { label: "Depoimentos", id: "depoimentos" },
                { label: "Ingredientes", id: "ingredientes" },
                { label: "FAQ", id: "faq" },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className="text-[10px] uppercase font-bold tracking-wider text-gray-300 transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <button
              onClick={() => scrollToSection(null, "hero")}
              className={`hidden items-center justify-center gap-2 rounded-full bg-white font-bold uppercase tracking-widest text-emerald-950 transition-all hover:bg-gray-100 md:flex z-20 relative shadow-sm ${
                isScrolled ? "px-4 py-1.5 text-[9px]" : "px-6 py-2.5 text-[10px]"
              }`}
            >
              Comprar Agora <span className="text-base leading-none font-light">→</span>
            </button>

            <button
              className="md:hidden flex items-center justify-center p-2 text-white relative z-20"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" strokeWidth={1.5} />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={1.5} />
              )}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          <div
            className={`md:hidden absolute left-0 w-full overflow-hidden transition-all duration-300 ease-in-out ${
              isScrolled ? "top-[54px]" : "top-[72px]"
            } ${
              isMobileMenuOpen
                ? "max-h-96 border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-lg"
                : "max-h-0"
            }`}
          >
            <nav className="flex flex-col px-6 sm:px-8 py-4 gap-4">
              {[
                { label: "Benefícios", id: "beneficios" },
                { label: "Depoimentos", id: "depoimentos" },
                { label: "Ingredientes", id: "ingredientes" },
                { label: "FAQ", id: "faq" },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    scrollToSection(e, item.id);
                  }}
                  className="text-[11px] uppercase font-bold tracking-wider text-gray-800 transition-colors hover:text-emerald-800"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>
      </div>

      {/* Landing Page Content Sections */}
      <HeaderHero onBuy={openCheckout} />
      
      <OfferBar />
      
      <Benefits />
      
      <Testimonials />
      
      <Ingredients />
      
      <FAQ />
      
      <Guarantee />

      <FinalCTA onAction={() => scrollToSection(null, "hero")} />

      {/* Main Page Footer */}
      <Footer simplified={true} containerClassName="max-w-[1440px] px-3 sm:px-8" />

      {/* Checkout Modal Frame */}
      <Checkout
        isOpen={!!checkoutPlan}
        onClose={closeCheckout}
        plan={checkoutPlan}
        onPlanChange={(id) =>
          setCheckoutPlan(APP_PLANS[id as keyof typeof APP_PLANS])
        }
        lpVersion="v3"
        initialQuantity={checkoutQuantity}
      />

      {/* Exit Intent Popup */}
      <ExitIntentPopup isCheckoutOpen={!!checkoutPlan} />

      {/* Sticky Call-To-Action (Mobile Fixed Button Bar) */}
      <StickyCTA />

      {/* WhatsApp Floating Icon */}
      <a
        href="https://wa.me/5511934924155?text=Ol%C3%A1%2C%20visitei%20o%20site%20do%20MIX10%20PRO%20e%20gostaria%20de%20tirar%20algumas%20d%C3%BAvidas."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-11 h-11 md:w-12 md:h-12 bg-[#25D366] text-white rounded-full shadow-md hover:shadow-lg hover:bg-[#1EBE5D] transition-all duration-300 hover:scale-110 active:scale-95 group"
        aria-label="Falar no WhatsApp"
      >
        <span className="absolute inset-x-0 inset-y-0 rounded-full bg-[#25D366]/30 animate-ping opacity-75 pointer-events-none group-hover:hidden" />
        <svg
          viewBox="0 0 24 24"
          className="w-5.5 h-5.5 md:w-6 md:h-6 relative z-10 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.714 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
        </svg>
      </a>

      {isInternalMode && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full border border-emerald-500/20 bg-slate-900/95 px-3 py-1.5 text-[11px] font-medium text-emerald-400 shadow-lg backdrop-blur-md transition-all duration-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>Modo Administrador</span>
        </div>
      )}
    </div>
  );
}
