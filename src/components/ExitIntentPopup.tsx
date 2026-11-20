import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X, Volume2, VolumeX } from "lucide-react";
import { trackExitPopupEvent } from "../services/tracking";

interface ExitIntentPopupProps {
  isCheckoutOpen: boolean;
}

const getLpVersion = () => {
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };
  return getCookie('lp_version') || localStorage.getItem('lp_version') || 'original';
};

export default function ExitIntentPopup({ isCheckoutOpen }: ExitIntentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // Mobile eligibility states
  const [mobileTimeEligible, setMobileTimeEligible] = useState(false);
  const [mobileScrollEligible, setMobileScrollEligible] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Check if current page path is suppressed (checkout, obrigado, etc.)
  const isSuppressedPath =
    location.pathname === "/checkout" ||
    location.pathname === "/obrigado" ||
    location.pathname.startsWith("/obrigado-pix/");

  // Track checkout open state with a ref
  const isCheckoutOpenRef = useRef(isCheckoutOpen);
  useEffect(() => {
    isCheckoutOpenRef.current = isCheckoutOpen;
  }, [isCheckoutOpen]);

  // Dev logger utility
  const logDev = (msg: string) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(msg);
    }
  };

  // Local admin mode detector
  const isAdminMode = (): boolean => {
    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      return (window as any).isInternalMode || getCookie("admin_logged_in") === "true";
    } catch (e) {
      return false;
    }
  };

  // Helper to check mobile block conditions
  const isBlockedMobile = () => {
    try {
      if (isCheckoutOpen) { logDev("[EXIT MOBILE] blocked: checkout open"); return true; }
      if (sessionStorage.getItem("checkout_active") === "true") { logDev("[EXIT MOBILE] blocked: checkout open"); return true; }
      if (sessionStorage.getItem("checkout_started") === "true") { logDev("[EXIT MOBILE] blocked: checkout already started"); return true; }
      if (sessionStorage.getItem("checkout_payment_reached") === "true") { logDev("[EXIT MOBILE] blocked: payment reached"); return true; }
      if (sessionStorage.getItem("exit_popup_shown_mobile") === "true") { logDev("[EXIT MOBILE] blocked: popup already shown"); return true; }
      if (sessionStorage.getItem("exit_popup_closed_mobile") === "true") { logDev("[EXIT MOBILE] blocked: popup closed in this session"); return true; }
      if (isAdminMode()) { logDev("[EXIT MOBILE] blocked: admin mode active"); return true; }
      if (isSuppressedPath) { logDev("[EXIT MOBILE] blocked: suppressed path"); return true; }
    } catch (e) {
      if ((window as any).checkout_active_fallback === true) { logDev("[EXIT MOBILE] blocked: checkout open"); return true; }
      if ((window as any).checkout_started_fallback === true) { logDev("[EXIT MOBILE] blocked: checkout already started"); return true; }
      if ((window as any).checkout_payment_reached_fallback === true) { logDev("[EXIT MOBILE] blocked: payment reached"); return true; }
      if ((window as any).exit_popup_shown_mobile_fallback === true) { logDev("[EXIT MOBILE] blocked: popup already shown"); return true; }
      if ((window as any).exit_popup_closed_mobile_fallback === true) { logDev("[EXIT MOBILE] blocked: popup closed in this session"); return true; }
      if (isAdminMode()) { logDev("[EXIT MOBILE] blocked: admin mode active"); return true; }
      if (isSuppressedPath) { logDev("[EXIT MOBILE] blocked: suppressed path"); return true; }
    }
    return false;
  };

  // Trigger Popup
  const triggerPopup = (isPopState = false) => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      if (isBlockedMobile()) return;
      setIsOpen(true);
      try {
        sessionStorage.setItem("exit_popup_shown_mobile", "true");
      } catch (e) {
        (window as any).exit_popup_shown_mobile_fallback = true;
      }
      logDev("[EXIT MOBILE] popup fired");
    } else {
      const alreadyShown = sessionStorage.getItem("exit_popup_shown");
      if (alreadyShown || isSuppressedPath || isCheckoutOpen) return;
      setIsOpen(true);
      sessionStorage.setItem("exit_popup_shown", "true");
    }

    // Track Pixel Event: ExitPopupShown
    trackExitPopupEvent("ExitPopupShown", getLpVersion());

    if (!isPopState && window.history.state?.exitIntent) {
      window.history.back();
    }
  };

  // Close Popup
  const handleClose = () => {
    setIsOpen(false);
    
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      try {
        sessionStorage.setItem("exit_popup_closed_mobile", "true");
      } catch (e) {
        (window as any).exit_popup_closed_mobile_fallback = true;
      }
    }

    // Track Pixel Event: ExitPopupDismissed
    trackExitPopupEvent("ExitPopupDismissed", getLpVersion());
  };

  // WhatsApp Click
  const handleWhatsAppClick = () => {
    setIsOpen(false);

    // Track Pixel Events: ExitPopupWhatsApp & standard Contact
    trackExitPopupEvent("ExitPopupWhatsApp", getLpVersion());
    if (typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "Contact", { lp_version: getLpVersion() });
    }
  };

  // Choose Kit Click
  const handleChooseKitClick = () => {
    setIsOpen(false);

    // Track Pixel Event: ExitPopupChooseKit
    trackExitPopupEvent("ExitPopupChooseKit", getLpVersion());

    // Scroll to pricing section
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Toggle Mute
  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const willMute = !videoRef.current.muted;
      videoRef.current.muted = willMute;
      setIsMuted(willMute);

      if (!willMute) {
        // Ativou o som: reiniciar do começo e dar play
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((err) => {
          console.log("Play failed on unmute:", err);
        });
      }
    }
  };

  const handleVideoEnded = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((err) => {
          console.log("Play failed on click:", err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  };

  // 1. Desktop Trigger (mouse leave top)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile || isSuppressedPath || isCheckoutOpen) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 20) {
        triggerPopup();
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [isSuppressedPath, isCheckoutOpen]);

  // Mobile high frequency scroll state refs
  const lastScrollTopRef = useRef(0);
  const upwardAccumulationRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const hasFiredRef = useRef(false);

  // Keep track of fired status so we reset if it changes
  useEffect(() => {
    if (!isOpen) {
      hasFiredRef.current = false;
    } else {
      hasFiredRef.current = true;
      upwardAccumulationRef.current = 0; // reset accumulated scroll
    }
  }, [isOpen]);

  // 2. Mobile Timer (25s)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile || isSuppressedPath || isCheckoutOpen) return;

    const timer = setTimeout(() => {
      setMobileTimeEligible(true);
      logDev("[EXIT MOBILE] eligible by time");
    }, 25000);

    return () => clearTimeout(timer);
  }, [isSuppressedPath, isCheckoutOpen]);

  // 3. Mobile Scroll (30%)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile || isSuppressedPath || isCheckoutOpen) return;

    const handleScrollDepth = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      // Safety check for NaN/Infinity
      if (isNaN(scrollPercent) || !isFinite(scrollPercent)) return;

      if (scrollPercent >= 30) {
        setMobileScrollEligible((prev) => {
          if (!prev) {
            logDev("[EXIT MOBILE] eligible by scroll depth");
          }
          return true; // Remains true once reached
        });
      }
    };

    window.addEventListener("scroll", handleScrollDepth, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollDepth);
  }, [isSuppressedPath, isCheckoutOpen]);

  // 4. Mobile upward scroll detection gesture (100px accumulated, 1.5s window)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile || isSuppressedPath || isCheckoutOpen) return;

    // Initialize lastScrollTop to current scroll position immediately
    lastScrollTopRef.current = window.scrollY || document.documentElement.scrollTop;

    const handleScrollGesture = () => {
      // If popup has already been fired in this lifecycle/mount, ignore
      if (hasFiredRef.current) return;

      // Check all blocks prior to checking gestures (Avoids overhead/triggering during modal opening/closing)
      if (isBlockedMobile()) {
        upwardAccumulationRef.current = 0;
        return;
      }

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const now = Date.now();

      // Reset accumulation if time since last scroll gesture is more than 1.5 seconds (idle window)
      if (now - lastScrollTimeRef.current > 1500) {
        upwardAccumulationRef.current = 0;
      }
      lastScrollTimeRef.current = now;

      const diff = lastScrollTopRef.current - scrollTop; // positive if scrolling UP
      
      if (diff > 2) { // Diff > 2px to ignore browser small jitter/oscillations
        // Scroll up detected
        upwardAccumulationRef.current += diff;

        if (upwardAccumulationRef.current >= 100) {
          logDev("[EXIT MOBILE] upward scroll detected");
          
          // Re-verify ALL conditions right before the final trigger
          if (
            mobileTimeEligible &&
            mobileScrollEligible &&
            !isBlockedMobile()
          ) {
            hasFiredRef.current = true;
            upwardAccumulationRef.current = 0;
            triggerPopup();
          }
        }
      } else if (diff < -2) { // Diff < -2px: Scrolling down resets the accumulation
        upwardAccumulationRef.current = 0;
      }
      
      lastScrollTopRef.current = scrollTop;
    };

    window.addEventListener("scroll", handleScrollGesture, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollGesture);
  }, [isSuppressedPath, isCheckoutOpen, mobileTimeEligible, mobileScrollEligible]);

  // 5. ESC Key Listener on Desktop
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle video playback when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Auto-play blocked or failed:", err);
      });
    } else if (!isOpen && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isOpen]);

  // Close when clicking outside modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[3px] transition-opacity duration-300"
    >
      {/* Modal Container: 90% width on mobile, 480px on desktop */}
      <div
        ref={modalRef}
        style={{
          boxShadow: "0 0 40px rgba(0, 185, 145, 0.18)"
        }}
        className="relative w-[90%] md:w-full md:max-w-[480px] overflow-hidden rounded-[26px] border border-[rgba(0,185,145,0.35)] bg-[#021c12] p-6 shadow-2xl transition-all duration-300 transform scale-100 flex flex-col gap-5"
      >
        {/* Background radial glow matching the site testimonials section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_#0b7655_0%,_#021c12_70%)] opacity-35 pointer-events-none z-0"></div>
        
        {/* Close Button (discreet X) */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-emerald-100/60 hover:text-white transition-colors cursor-pointer z-20"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title & Subtitle styled exactly like the site's testimonials block */}
        <div className="relative z-10 text-center mt-2 px-2 max-w-[390px] mx-auto flex flex-col items-center">
          <h3 className="text-xl md:text-2xl font-bold text-white leading-[1.1] tracking-tight text-center">
            Ainda está em <span className="italic text-emerald-400 font-bold">dúvida?</span>
          </h3>
          <p className="mt-3 text-xs md:text-[13px] font-semibold text-emerald-100/90 leading-relaxed text-center max-w-[370px]">
            Ela também tinha dúvidas antes de experimentar. Veja o que aconteceu depois.
          </p>
        </div>

        {/* Horizontal Testimonial Video (16:9 aspect-video layout, compact & centered) */}
        <div className="relative z-10 aspect-video w-full max-w-[340px] md:max-w-[380px] overflow-hidden rounded-[22px] bg-emerald-950/40 border border-emerald-500/20 shadow-2xl flex items-center justify-center self-center transition-all duration-300">
          <video
            ref={videoRef}
            src="/DP-MARIA-DO-SOCORRO-site-CURTO-30S-o.mp4"
            muted={isMuted}
            playsInline
            onClick={handleVideoClick}
            onEnded={handleVideoEnded}
            className="h-full w-full object-cover rounded-[22px] cursor-pointer"
          />
          
          {/* Floating subtle secondary pill to unmute if muted - lower contrast & 25% smaller */}
          {isMuted ? (
            <button
              onClick={(e) => toggleMute(e)}
              className="absolute bottom-3 left-3 z-20 bg-black/60 backdrop-blur-sm border border-white/10 hover:bg-black/80 text-white/90 font-bold rounded-full px-2.5 py-1.5 text-[8px] uppercase tracking-wider shadow-lg flex items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <VolumeX className="w-3 h-3 text-white/80" />
              <span>Ativar Som</span>
            </button>
          ) : (
            <button
              onClick={(e) => toggleMute(e)}
              className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors cursor-pointer z-20"
              aria-label="Desativar som"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col gap-2 mt-1 w-full max-w-[390px] mx-auto">
          <a
            href="https://wa.me/5511934924155?text=Ol%C3%A1%2C%20visitei%20o%20site%20do%20MIX10%20PRO%20e%20gostaria%20de%20tirar%20algumas%20d%C3%BAvidas."
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="flex items-center justify-center gap-2 rounded-[14px] bg-[#12A875] hover:bg-[#0E8F64] h-[54px] text-sm font-bold text-white transition-all active:scale-98 cursor-pointer w-full text-center shadow-lg shadow-[#12A875]/15"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.714 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
            </svg>
            Conversar no WhatsApp
          </a>
          
          <button
            onClick={handleChooseKitClick}
            className="rounded-[14px] border border-emerald-500/20 hover:bg-emerald-950/30 h-[54px] text-sm font-bold text-emerald-100/70 hover:text-white transition-all cursor-pointer w-full text-center"
          >
            Quero meu MIX10 PRO
          </button>
        </div>
        
      </div>
    </div>
  );
}
