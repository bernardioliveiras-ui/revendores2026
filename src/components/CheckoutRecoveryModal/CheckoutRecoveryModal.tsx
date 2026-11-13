import React, { useEffect, useRef } from "react";
import { X, MessageCircle } from "lucide-react";
import { trackCheckoutRecoveryEvent } from "../../services/tracking";

interface CheckoutRecoveryModalProps {
  isOpen: boolean;
  onClose: (action: "continue" | "whatsapp" | "dismissed") => void;
  plan: {
    id: number;
    title: string;
    price: number;
    installments: number;
    installmentValue: number;
    image: string;
  } | null;
  quantity: number;
  lpVersion: string;
  checkoutStep: string; // 'info' | 'shipping' | 'payment'
  paymentMethod: string; // 'credit' | 'pix'
}

export default function CheckoutRecoveryModal({
  isOpen,
  onClose,
  plan,
  quantity,
  lpVersion,
  checkoutStep,
  paymentMethod,
}: CheckoutRecoveryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const hasTrackedShown = useRef(false);

  useEffect(() => {
    if (isOpen && !hasTrackedShown.current) {
      // Set session storage flag to prevent multiple triggers in this session
      try {
        sessionStorage.setItem("checkout_recovery_shown", "true");
        sessionStorage.setItem("checkout_recovery_action", "dismissed"); // default action is dismissed unless overwritten
      } catch (e) {}

      // Track Show Event
      trackCheckoutRecoveryEvent(
        "CheckoutRecoveryShown",
        plan,
        quantity,
        lpVersion,
        { checkoutStep, paymentMethod }
      );
      hasTrackedShown.current = true;
    }
  }, [isOpen, plan, quantity, lpVersion, checkoutStep, paymentMethod]);

  // Clean state when modal unmounts or closes
  useEffect(() => {
    if (!isOpen) {
      hasTrackedShown.current = false;
    }
  }, [isOpen]);

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinue = () => {
    try {
      sessionStorage.setItem("checkout_recovery_action", "continue");
    } catch (e) {}
    
    trackCheckoutRecoveryEvent(
      "CheckoutRecoveryContinue",
      plan,
      quantity,
      lpVersion,
      { checkoutStep, paymentMethod, recoveryAction: "continue" }
    );
    onClose("continue");
  };

  const handleWhatsApp = () => {
    try {
      sessionStorage.setItem("checkout_recovery_action", "whatsapp");
    } catch (e) {}

    trackCheckoutRecoveryEvent(
      "CheckoutRecoveryWhatsApp",
      plan,
      quantity,
      lpVersion,
      { checkoutStep, paymentMethod, recoveryAction: "whatsapp" }
    );

    // Contextual message for WhatsApp conversion
    let kitDetails = "pedido";
    if (plan) {
      kitDetails = `${plan.title}`;
    }
    const message = `Olá, estou finalizando meu pedido do ${kitDetails} no checkout e gostaria de tirar algumas dúvidas antes de concluir.`;
    const whatsappUrl = `https://wa.me/5511934924155?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    onClose("whatsapp");
  };

  const handleDismiss = () => {
    try {
      sessionStorage.setItem("checkout_recovery_action", "dismissed");
    } catch (e) {}

    trackCheckoutRecoveryEvent(
      "CheckoutRecoveryDismissed",
      plan,
      quantity,
      lpVersion,
      { checkoutStep, paymentMethod, recoveryAction: "dismissed" }
    );
    onClose("dismissed");
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleDismiss();
    }
  };

  const getSimplifiedKitText = () => {
    if (!plan) return "Seu pedido continua selecionado.";
    return "Sua caixa de MIX10 PRO continua selecionada.";
  };

  const getKitImage = () => {
    if (!plan) return "/kit-1.webp";
    return plan.image || "/kit-1.webp";
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[3px] transition-opacity duration-300"
    >
      <div
        ref={modalRef}
        style={{
          boxShadow: "0 25px 50px -12px rgba(6, 36, 26, 0.25)"
        }}
        className="relative w-full max-w-[430px] overflow-hidden rounded-[24px] border border-emerald-900/10 bg-[#FAF8F5] p-6 shadow-2xl transition-all duration-300 transform scale-100 flex flex-col gap-5 text-[#06241a]"
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-full p-1.5 text-[#06241a]/40 hover:text-[#06241a] hover:bg-[#06241a]/5 transition-all cursor-pointer z-20"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Title */}
        <div className="relative z-10 text-center mt-2 px-2 flex flex-col items-center">
          <h3 className="text-xl md:text-2xl font-bold text-[#06241a] leading-tight tracking-tight max-w-[340px]">
            Você está a um passo de concluir seu pedido
          </h3>
        </div>

        {/* Mini Kit Visualizer and simplified text */}
        <div className="relative z-10 flex flex-col items-center text-center gap-4 py-1">
          {/* Centered Thumbnail */}
          <div className="w-[80px] h-[80px] flex items-center justify-center bg-white rounded-2xl p-1 border border-emerald-900/10 shadow-sm">
            <img src={getKitImage()} alt={plan?.title || "Kit"} className="w-full h-full object-contain" />
          </div>
          <div className="space-y-2 text-[#06241a]/95 text-sm leading-relaxed max-w-[360px]">
            <p className="font-bold text-[#06241a] text-base">
              {getSimplifiedKitText()}
            </p>
            <p className="text-xs text-[#06241a]/70 font-medium">
              Se ficou alguma dúvida, nossa equipe pode ajudar você agora. Ou basta continuar sua compra de onde parou.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col gap-3.5 w-full pt-1">
          <button
            onClick={handleContinue}
            className="flex items-center justify-center rounded-[14px] bg-[#0f6b47] hover:bg-[#0b5135] h-[52px] text-sm font-bold text-white transition-all active:scale-98 cursor-pointer w-full text-center shadow-md shadow-[#0f6b47]/10"
          >
            Continuar minha compra
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 rounded-[14px] border border-[#0f6b47]/20 hover:bg-[#0f6b47]/5 h-[52px] text-sm font-bold text-[#0f6b47] transition-all cursor-pointer w-full text-center"
          >
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            Conversar com um especialista
          </button>
        </div>
      </div>
    </div>
  );
}
