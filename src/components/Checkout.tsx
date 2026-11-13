import React, { useState, FormEvent, useEffect, ChangeEvent, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Copy,
  ShieldCheck,
  ChevronLeft,
  CreditCard,
  Box,
  Lock,
  Truck,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
} from "lucide-react";
import { calculateShipping } from "../utils/calculateShipping";
import { calculateInstallmentPrice, getInstallmentOptions } from "../utils/installmentCalculator";
import { APP_PLANS } from "../App";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackInitiateCheckout, trackAddPaymentInfo, isAdminMode, getAnalyticsContext } from "../services/tracking";
import CheckoutRecoveryModal from "./CheckoutRecoveryModal/CheckoutRecoveryModal";
function isValidLeadName(value: unknown): boolean {
  if (typeof value !== "string") return false;

  const normalized = value.trim().toLowerCase();

  return (
    normalized.length >= 2 &&
    normalized !== "cliente" &&
    normalized !== "nome não informado" &&
    normalized !== "não informado"
  );
}

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanChange?: (id: number) => void;
  plan: {
    id: number;
    title: string;
    price: number;
    installments: number;
    installmentValue: number;
    image: string;
  } | null;
  lpVersion: string;
  initialQuantity?: number;
}

export default function Checkout({
  isOpen,
  onClose,
  onPlanChange,
  plan,
  lpVersion,
  initialQuantity = 1,
}: CheckoutProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const couponFromUrl = searchParams.get("coupon");
  const isCouponLocked = !!couponFromUrl;

  const handleClose = () => {
    // Clear checkout session variables on redirect/close
    try {
      sessionStorage.removeItem("checkout_active");
    } catch (e) {}

    onClose();
    if (window.location.pathname.startsWith("/checkout")) {
      navigate("/");
    }
  };


  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix">(
    "credit",
  );
  const [isPixGenerated, setIsPixGenerated] = useState(false);
  const [pixData, setPixData] = useState<{
    encodedImage: string;
    payload: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "approved" | "refused" | null
  >(null);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);

  const [cardExpiryInput, setCardExpiryInput] = useState("");
  const [zipCodeInput, setZipCodeInput] = useState("");
  const [shippingOptions, setShippingOptions] = useState<
    { type: string; price: number; deliveryTime: string }[] | null
  >(null);
  const [selectedShippingIndex, setSelectedShippingIndex] = useState<
    number | null
  >(null);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [currentStep, setCurrentStep] = useState(1);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: string;
    value: number;
  } | null>(null);

  const hasTrackedInitiate = useRef(false);
  const hasTrackedPaymentInfo = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasTrackedInitiate.current = false;
      hasTrackedPaymentInfo.current = false;
    } else if (initialQuantity) {
      setQuantity(initialQuantity);
    }
  }, [isOpen, initialQuantity]);

  useEffect(() => {
    if (plan) {
      const totalBoxes = (plan.id === 1 ? 1 : plan.id === 2 ? 3 : 5) * (quantity || 1);
      const maxInst = totalBoxes >= 5 ? 10 : totalBoxes >= 3 ? 6 : totalBoxes >= 2 ? 6 : (plan.id === 1 ? 3 : 10);
      setSelectedInstallments((prev) => Math.min(prev, maxInst));
    }
  }, [plan, quantity]);

  useEffect(() => {
    if (isOpen && plan && !hasTrackedInitiate.current) {
      hasTrackedInitiate.current = true;

      // Set Pixel user data if personal details exist and are valid (independent of capture)
      if (personalData.name && personalData.email && personalData.phone) {
        setPixelUserData(personalData.name, personalData.email, personalData.phone);
      }

      trackInitiateCheckout(plan, quantity, lpVersion);
    }
  }, [isOpen, plan, quantity]);

  useEffect(() => {
    if (currentStep === 3 && plan && !hasTrackedPaymentInfo.current) {
      if ((import.meta as any).env?.DEV) {
        console.log("[META DEBUG] AddPaymentInfo fired");
        console.log("[META] AddPaymentInfo fired");
      }
      
      hasTrackedPaymentInfo.current = true;
      trackAddPaymentInfo(plan, quantity, lpVersion);
    }
  }, [currentStep, plan, quantity]);

  useEffect(() => {
    const cleanZip = zipCodeInput.replace(/\D/g, "");
    if (cleanZip.length === 8 && plan) {
      const quantityBox = parseInt(plan.title) || 1;
      const options = calculateShipping(cleanZip, quantityBox * quantity);
      setShippingOptions(options);
      if (options && options.length > 0) {
        setSelectedShippingIndex((prev) =>
          prev !== null && prev < options.length ? prev : 0,
        );
      } else {
        setSelectedShippingIndex(null);
      }
    } else {
      setShippingOptions(null);
      setSelectedShippingIndex(null);
    }
  }, [zipCodeInput, plan, quantity]);

  const [personalData, setPersonalData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  });
  const [addressExtras, setAddressExtras] = useState({
    addressNumber: "",
    complement: "",
  });
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardCvv: "",
    cardName: "",
  });

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const openTimeRef = useRef<number>(0);

  const personalDataRef = useRef(personalData);
  const zipCodeInputRef = useRef(zipCodeInput);
  const loadingRef = useRef(loading);
  const validatingCouponRef = useRef(validatingCoupon);
  const isChangingPlanRef = useRef(isChangingPlan);
  const isPixGeneratedRef = useRef(isPixGenerated);
  const paymentStatusRef = useRef(paymentStatus);
  const activePaymentIdRef = useRef(activePaymentId);

  useEffect(() => {
    personalDataRef.current = personalData;
    zipCodeInputRef.current = zipCodeInput;
    loadingRef.current = loading;
    validatingCouponRef.current = validatingCoupon;
    isChangingPlanRef.current = isChangingPlan;
    isPixGeneratedRef.current = isPixGenerated;
    paymentStatusRef.current = paymentStatus;
    activePaymentIdRef.current = activePaymentId;
  }, [personalData, zipCodeInput, loading, validatingCoupon, isChangingPlan, isPixGenerated, paymentStatus, activePaymentId]);

  useEffect(() => {
    if (isOpen) {
      openTimeRef.current = Date.now();
    } else {
      setShowRecoveryModal(false);
    }
  }, [isOpen]);

  const isEligibleForRecovery = (): boolean => {
    if (!isOpen || !plan) return false;
    if (window.location.pathname.startsWith("/admin")) return false;
    
    // Blocking rules
    if (loadingRef.current || validatingCouponRef.current || isChangingPlanRef.current) return false;
    if (isPixGeneratedRef.current || paymentStatusRef.current === "approved" || paymentStatusRef.current === "pending" || activePaymentIdRef.current) return false;

    // Session limit
    try {
      const alreadyShown = sessionStorage.getItem("checkout_recovery_shown") === "true";
      if (alreadyShown) return false;
    } catch (e) {
      return false;
    }

    return true;
  };

  const isEligibleForRecoveryRef = useRef(isEligibleForRecovery);
  useEffect(() => {
    isEligibleForRecoveryRef.current = isEligibleForRecovery;
  });

  // 1st Trigger: Cursor exit intent on desktop
  useEffect(() => {
    if (!isOpen || !plan) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 20) {
        // Desktop minimum time constraint: 4 seconds after checkout opens
        const timeElapsed = Date.now() - openTimeRef.current;
        if (timeElapsed >= 4000) {
          if (isEligibleForRecoveryRef.current()) {
            setShowRecoveryModal(true);
          }
        }
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isOpen, plan]);

  // 2nd Trigger: Back arrow close attempt
  const handleCheckoutCloseAttempt = () => {
    if (isEligibleForRecovery()) {
      setShowRecoveryModal(true);
    } else {
      handleClose();
    }
  };

  // 3rd Trigger: Intercept browser back button or page swipe back
  useEffect(() => {
    if (isOpen) {
      try {
        if (window.history.state?.checkoutOpen !== true) {
          window.history.pushState({ checkoutOpen: true }, "");
        }
      } catch (e) {}
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = (e: PopStateEvent) => {
      if (isEligibleForRecoveryRef.current()) {
        // Push state back to prevent navigation
        try {
          window.history.pushState({ checkoutOpen: true }, "");
        } catch (err) {}
        setShowRecoveryModal(true);
      } else {
        // Close checkout and allow normal close
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, onClose]);

  const handleRecoveryClose = (action: "continue" | "whatsapp" | "dismissed") => {
    setShowRecoveryModal(false);
  };

  const getStepName = (step: number): string => {
    if (step === 1) return "info";
    if (step === 2) return "shipping";
    if (step === 3) return "payment";
    return "info";
  };

  const setPixelUserData = (name: string, email: string, phone: string) => {
    try {
      const isAdmin = isAdminMode();
      if (isAdmin) {
        console.log("[Pixel - Admin Mode] Intercepted and blocked set userData");
        return;
      }

      if (typeof (window as any).fbq !== "function") {
        return;
      }

      const cleanEmail = (email || "").trim().toLowerCase();
      let cleanPhone = (phone || "").replace(/\D/g, "");
      if (cleanPhone.length === 10 || cleanPhone.length === 11) {
        cleanPhone = "55" + cleanPhone;
      }

      const nameTrimmed = (name || "").trim();
      if (!cleanEmail || !cleanPhone || !nameTrimmed) {
        return;
      }

      const nameParts = nameTrimmed.split(/\s+/);
      const firstName = nameParts[0].toLowerCase();
      const lastName = nameParts.slice(1).join(" ").toLowerCase();

      const userDataPayload: any = {
        em: cleanEmail,
        ph: cleanPhone,
        fn: firstName,
      };
      if (lastName) {
        userDataPayload.ln = lastName;
      }

      (window as any).fbq("init", "992776610153750", userDataPayload);
      
      // Save to sessionStorage for other pages/events (like Purchase)
      sessionStorage.setItem("pixel_user_data", JSON.stringify(userDataPayload));
      
      console.log("[Pixel] fbq('init', 992776610153750, userData) called for Advanced Matching");
    } catch (e) {
      // ignore silently
    }
  };

  const handlePersonalDataChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setPersonalData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressExtrasChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setAddressExtras((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCardDataChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setCardData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [addressData, setAddressData] = useState({
    address: "",
    province: "",
    city: "",
    state: "",
    codigoIbge: "",
  });

  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setAddressData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCardExpiryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExpiryInput(val);
  };

  const handleZipCodeChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    let rawValue = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formattedValue = rawValue;
    if (rawValue.length > 5) {
      formattedValue = rawValue.replace(/^(\d{5})(\d)/, "$1-$2");
    }
    setZipCodeInput(formattedValue);

    const cleanZip = rawValue;

    if (cleanZip.length === 8) {
      try {
        const res = await fetch(
          `https://brasilapi.com.br/api/cep/v1/${cleanZip}`,
        );
        if (res.ok) {
          const data = await res.json();
          
          let ibge = "";
          try {
            const viaRes = await fetch(
              `https://viacep.com.br/ws/${cleanZip}/json/`,
            );
            const viaData = await viaRes.json();
            if (!viaData.erro) {
              ibge = viaData.ibge || "";
            }
          } catch (e) {
            console.error("Erro ao buscar IBGE do ViaCEP no fluxo principal", e);
          }

          const city = data.city || "";
          const state = data.state || "";
          if (!ibge && city.toLowerCase().trim() === "osasco" && state.toLowerCase().trim() === "sp") {
            ibge = "3534401";
          }

          setAddressData((prev) => ({
            ...prev,
            address: data.street || prev.address,
            province: data.neighborhood || prev.province,
            city: city || prev.city,
            state: state || prev.state,
            codigoIbge: ibge,
          }));
        } else {
          const viaRes = await fetch(
            `https://viacep.com.br/ws/${cleanZip}/json/`,
          );
          const viaData = await viaRes.json();
          if (!viaData.erro) {
            const city = viaData.localidade || "";
            const state = viaData.uf || "";
            let ibge = viaData.ibge || "";

            if (!ibge && city.toLowerCase().trim() === "osasco" && state.toLowerCase().trim() === "sp") {
              ibge = "3534401";
            }

            setAddressData((prev) => ({
              ...prev,
              address: viaData.logradouro || prev.address,
              province: viaData.bairro || prev.province,
              city: city || prev.city,
              state: state || prev.state,
              codigoIbge: ibge,
            }));
          } else {
            setAddressData({ address: "", province: "", city: "", state: "", codigoIbge: "" });
          }
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  const captureLead = async (stepName: "personal_info" | "address_completed" | "payment_started") => {
    try {
      const payloadName = typeof personalData.name === "string" ? personalData.name.trim() : "";
      const payload = {
        name: payloadName,
        email: personalData.email,
        phone: personalData.phone,
        cpf: personalData.cpf,
        planId: plan?.id || null,
        quantity: quantity || 1,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        step: stepName,
        status: "checkout_started",
        zipCode: zipCodeInput,
        address: addressData.address,
        addressNumber: addressExtras.addressNumber,
        complement: addressExtras.complement,
        province: addressData.province,
        cityState: addressData.city && addressData.state ? `${addressData.city}/${addressData.state}` : null,
        paymentMethod: paymentMethod,
        codigoIbge: addressData.codigoIbge || null,
        lp_version: lpVersion,
      };



      await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Error capturing checkout lead:", e);
    }
  };

  const latestLeadDataRef = useRef({
    personalData,
    plan,
    quantity,
    appliedCoupon,
    zipCodeInput,
    addressData,
    addressExtras,
    paymentMethod,
    lpVersion,
  });

  useEffect(() => {
    latestLeadDataRef.current = {
      personalData,
      plan,
      quantity,
      appliedCoupon,
      zipCodeInput,
      addressData,
      addressExtras,
      paymentMethod,
      lpVersion,
    };
  });

  const autosaveTimerRef = useRef<any>(null);

  // Implement auto-save with a 2-second debounce for step 1 typing
  useEffect(() => {
    if (currentStep !== 1) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    const timer = setTimeout(() => {
      const currentForm = latestLeadDataRef.current;

      const hasValidPhone = (p: string) => {
        const clean = p.replace(/\D/g, "");
        return clean.length >= 10 && clean.length <= 11;
      };

      const hasValidEmail = (e: string) => {
        const clean = e.trim();
        return clean.length > 0 && /^\S+@\S+\.\S+$/.test(clean);
      };

      const nameVal = currentForm.personalData.name;
      const phoneVal = currentForm.personalData.phone;
      const emailVal = currentForm.personalData.email;

      const canCapture =
        hasValidPhone(phoneVal) &&
        (
          isValidLeadName(nameVal) ||
          hasValidEmail(emailVal)
        );

      if (!canCapture) return;

      const payload = {
        name: typeof nameVal === "string" ? nameVal.trim() : "",
        email: emailVal,
        phone: phoneVal,
        cpf: currentForm.personalData.cpf,
        planId: currentForm.plan?.id || null,
        quantity: currentForm.quantity || 1,
        couponCode: currentForm.appliedCoupon ? currentForm.appliedCoupon.code : null,
        step: "personal_info_typing",
        status: "checkout_started",
        zipCode: currentForm.zipCodeInput,
        address: currentForm.addressData.address,
        addressNumber: currentForm.addressExtras.addressNumber,
        complement: currentForm.addressExtras.complement,
        province: currentForm.addressData.province,
        cityState: currentForm.addressData.city && currentForm.addressData.state ? `${currentForm.addressData.city}/${currentForm.addressData.state}` : null,
        paymentMethod: currentForm.paymentMethod,
        codigoIbge: currentForm.addressData.codigoIbge || null,
        lp_version: currentForm.lpVersion,
      };



      fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) => console.error("Error auto-saving lead:", err));
    }, 2000);

    autosaveTimerRef.current = timer;

    return () => {
      clearTimeout(timer);
    };
  }, [
    personalData.name,
    personalData.email,
    personalData.phone,
    personalData.cpf,
    quantity,
    currentStep
  ]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      let checkoutSessionId = "";
      try {
        checkoutSessionId = sessionStorage.getItem("checkout_session_id") || "";
      } catch (e) {
        checkoutSessionId = (window as any).checkout_session_id || "";
      }

      if (!checkoutSessionId) {
        checkoutSessionId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
        try {
          sessionStorage.setItem("checkout_session_id", checkoutSessionId);
        } catch (e) {
          (window as any).checkout_session_id = checkoutSessionId;
        }
      }

      try {
        sessionStorage.setItem("checkout_active", "true");
        sessionStorage.setItem("checkout_started", "true");
      } catch (e) {
        (window as any).checkout_active_fallback = true;
        (window as any).checkout_started_fallback = true;
      }
    } else {
      try {
        sessionStorage.removeItem("checkout_active");
      } catch (e) {
        (window as any).checkout_active_fallback = false;
      }
    }
    return () => {
      try {
        sessionStorage.removeItem("checkout_active");
      } catch (e) {
        (window as any).checkout_active_fallback = false;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (currentStep === 3) {
      try {
        sessionStorage.setItem("checkout_payment_reached", "true");
      } catch (e) {
        (window as any).checkout_payment_reached_fallback = true;
      }
    }
  }, [currentStep]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPixGenerated && activePaymentId && !paymentStatus) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payment-status/${activePaymentId}`);
          const data = await res.json();
          if (data.status === "CONFIRMED" || data.status === "RECEIVED" || data.status === "PAYMENT_RECEIVED") {
            setPaymentStatus("approved");
            clearInterval(interval);
          } else if (data.status === "OVERDUE" || data.status === "REFUNDED") {
            setPaymentStatus("refused");
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Error polling payment status", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPixGenerated, activePaymentId, paymentStatus]);

  const handleCopyPix = () => {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shippingCost =
    selectedShippingIndex !== null && shippingOptions
      ? shippingOptions[selectedShippingIndex].price
      : 0;
  const shippingName =
    selectedShippingIndex !== null && shippingOptions
      ? shippingOptions[selectedShippingIndex].type
      : "Frete";
  const originalPrice = plan ? plan.price * quantity + shippingCost : 0;

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      discountAmount = (originalPrice * appliedCoupon.value) / 100;
    } else if (appliedCoupon.type === "free_shipping") {
      discountAmount = shippingCost;
    } else {
      discountAmount = Math.min(appliedCoupon.value, originalPrice);
    }
  }

  const finalPrice = originalPrice - discountAmount;
  const finalShippingCost =
    appliedCoupon && appliedCoupon.type === "free_shipping" ? 0 : shippingCost;

  // Calculate installment values and total values based on interest
  const paymentDetails = calculateInstallmentPrice(
    finalPrice,
    paymentMethod === "credit" ? selectedInstallments : 1
  );

  const finalInstallmentValue = paymentDetails.installmentValue;
  const finalChargedValue = paymentDetails.chargedValue;

  const handleApplyCoupon = async (codeOverride?: any) => {
    const codeToApply = typeof codeOverride === "string" ? codeOverride : couponInput;
    if (!codeToApply) return;
    setValidatingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: String(codeToApply).trim().toUpperCase(),
          orderValue: Number(originalPrice) || 0,
          shippingCost: Number(shippingCost) || 0,
          planMonths:
            plan?.id === 1 ? 1 : plan?.id === 2 ? 3 : plan?.id === 3 ? 5 : 1,
        }),
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Resposta inválida do servidor (HTTP ${res.status})`);
      }

      if (!res.ok) {
        setCouponError(data.error || "Cupom inválido.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: data.code,
          type: data.type,
          value: data.value,
        });
        if (data.type === "free_shipping") {
          setCouponSuccess("Você ganhou frete grátis neste pedido.");
        } else {
          setCouponSuccess("Cupom aplicado com sucesso!");
        }
        setCouponInput("");
      }
    } catch (e: any) {
      setCouponError(e.message || "Erro ao validar cupom.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess(null);
    setCouponError(null);
  };

  useEffect(() => {
    if (isOpen && couponFromUrl && originalPrice > 0 && !appliedCoupon) {
      handleApplyCoupon(couponFromUrl);
    }
  }, [isOpen, couponFromUrl, originalPrice]);

  const handleNextStep1 = () => {
    if (
      !personalData.name ||
      !personalData.email ||
      !personalData.phone ||
      !personalData.cpf
    ) {
      setValidationError(
        "Por favor, preencha todos os campos obrigatórios da identificação antes de continuar.",
      );
      return;
    }

    const cpf = personalData.cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      setValidationError("Por favor, insira um CPF válido.");
      return;
    }
    let sum = 0,
      rev = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) {
      setValidationError("O CPF informado é inválido.");
      return;
    }
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) {
      setValidationError("O CPF informado é inválido.");
      return;
    }

    const phone = personalData.phone.replace(/\D/g, "");
    if (phone.length < 10 || phone.length > 11) {
      setValidationError(
        "Por favor, insira um número de celular ou telefone válido com DDD.",
      );
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(personalData.email)) {
      setValidationError("Por favor, insira um e-mail válido.");
      return;
    }

    setValidationError(null);
    setCurrentStep(2);
    
    // Clear any active autosave debounced timer to prevent race conditions
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    // Enrich Pixel with user details immediately after valid step 1 submit
    setPixelUserData(personalData.name, personalData.email, personalData.phone);

    captureLead("personal_info");
  };

  const handleNextStep2 = () => {
    if ((import.meta as any).env?.DEV) {
      console.log("[META DEBUG] handleNextStep2 called");
    }

    if (!zipCodeInput || selectedShippingIndex === null) {
      setValidationError(
        "Por favor, digite um CEP válido e selecione uma opção de frete antes de continuar.",
      );
      return;
    }

    if (
      !addressData.address ||
      !addressExtras.addressNumber ||
      !addressData.province ||
      !addressData.city ||
      !addressData.state
    ) {
      setValidationError(
        "Por favor, preencha todos os campos obrigatórios de endereço.",
      );
      return;
    }

    const hasAlphabetVar = (val: string) => /[a-zA-ZÀ-ÿ]{2,}/.test(val);
    if (!hasAlphabetVar(addressData.address)) {
      setValidationError(
        "O endereço deve conter o nome da rua válido (com letras).",
      );
      return;
    }
    if (!hasAlphabetVar(addressData.province)) {
      setValidationError("O bairro informado precisa ser válido.");
      return;
    }
    if (!hasAlphabetVar(addressData.city)) {
      setValidationError("A cidade informada precisa ser válida.");
      return;
    }

    setValidationError(null);
    setCurrentStep(3);

    // Call setPixelUserData to ensure user data is updated/set before AddPaymentInfo
    setPixelUserData(personalData.name, personalData.email, personalData.phone);

    captureLead("address_completed");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);
    if (!plan) return;

    if (paymentMethod === "credit") {
      const cardNum = cardData.cardNumber.replace(/\D/g, "");
      if (cardNum.length < 13 || cardNum.length > 19) {
        setValidationError("O número do cartão de crédito é inválido.");
        return;
      }
      const expiry = cardExpiryInput;
      if (!/^\d{2}\/\d{2,4}$/.test(expiry)) {
        setValidationError(
          "A validade do cartão é inválida. Use o formato MM/AA ou MM/AAAA.",
        );
        return;
      }
      const [month] = expiry.split("/");
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        setValidationError("O mês de validade do cartão é inválido.");
        return;
      }
      const cvv = cardData.cardCvv.replace(/\D/g, "");
      if (cvv.length < 3 || cvv.length > 4) {
        setValidationError("O CVV do cartão de crédito é inválido.");
        return;
      }
    }

    captureLead("payment_started");
    setLoading(true);

    try {
      const customerPayload = {
        name: personalData.name,
        email: personalData.email,
        phone: personalData.phone,
        cpf: personalData.cpf.replace(/\D/g, ""),
        zipCode: zipCodeInput,
        addressNumber: addressExtras.addressNumber,
        complement: addressExtras.complement,
        address: addressData.address,
        province: addressData.province,
        city: addressData.city,
        state: addressData.state,
        codigoIbge: addressData.codigoIbge || "",
      };

      const customerRes = await fetch("/api/create-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerPayload),
      });
      const customerResData = await customerRes.json();
      if (!customerRes.ok) {
        throw new Error(customerResData.details?.errors?.[0]?.description || customerResData.error || "Erro ao criar cliente. Verifique se o CPF é válido.");
      }
      const customerId = customerResData.customerId;

      let expYear = cardExpiryInput.split("/")[1] || "";
      if (expYear.length === 2) {
        expYear = `20${expYear}`;
      }

      let analyticsPayload: any = null;
      try {
        const actx = getAnalyticsContext();
        const cleanLpVersion = (lpVersion || "").trim().toLowerCase();
        let lpId = "original";
        if (cleanLpVersion === "v2" || cleanLpVersion === "lp-v2" || window.location.pathname.includes("/lp-v2")) {
          lpId = "v2";
        } else if (cleanLpVersion === "v3" || cleanLpVersion === "lp-v3" || window.location.pathname.includes("/lp-v3")) {
          lpId = "v3";
        }

        const recoveryShown = sessionStorage.getItem("checkout_recovery_shown") === "true";
        const recoveryAction = sessionStorage.getItem("checkout_recovery_action") || null;

        analyticsPayload = {
          visitorId: actx.visitorId,
          sessionId: actx.sessionId,
          checkoutSessionId: actx.checkoutSessionId,
          lpId,
          lpVersion: lpVersion || "original",
          device: actx.device,
          UTMs: actx.utms,
          plan: plan?.id === 1 ? 1 : plan?.id === 2 ? 3 : plan?.id === 3 ? 5 : 1,
          quantity: quantity,
          origin: null,
          checkoutRecoveryShown: recoveryShown,
          checkoutRecoveryAction: recoveryAction
        };
      } catch (e) {
        console.error("Failed to build analytics context for checkout:", e);
      }

      const payload = {
        paymentMethod,
        customerId,
        orderValue: originalPrice,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        shippingCost: shippingCost,
        planMonths:
          plan?.id === 1 ? 1 : plan?.id === 2 ? 3 : plan?.id === 3 ? 5 : 1,
        quantity: quantity,
        customerData: customerPayload,
        creditCardData:
          paymentMethod === "credit"
            ? {
                holderName: cardData.cardName,
                number: cardData.cardNumber.replace(/\s/g, ""),
                expiryMonth: cardExpiryInput.split("/")[0],
                expiryYear: expYear,
                ccv: cardData.cardCvv,
                installments: selectedInstallments,
              }
            : undefined,
        lp_version: lpVersion,
        analytics: analyticsPayload
      };

      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Erro ao processar pagamento");
      }

      // Save last purchase details to localStorage
      try {
        localStorage.setItem("last_purchase", JSON.stringify({
          value: finalPrice - finalShippingCost,
          planTitle: plan.title,
          planId: plan.id,
          quantity: quantity,
          paymentId: responseData.paymentId
        }));
      } catch (e) {
        // ignore
      }

      if (paymentMethod === "pix") {
        if ((import.meta as any).env?.DEV) {
          console.log("[META DEBUG] PIX flow", {
            paymentId: responseData.paymentId,
            value: finalPrice - finalShippingCost
          });
        }
        setIsPixGenerated(true);
        setPixData(responseData.pix);
        setActivePaymentId(responseData.paymentId);
        navigate(`/obrigado-pix/${responseData.paymentId}`, {
          state: {
            pixData: responseData.pix,
            value: finalPrice - finalShippingCost,
            planTitle: plan.title,
            planId: plan.id,
            quantity: quantity,
            paymentId: responseData.paymentId
          }
        });
      } else {
        if (
          responseData.status === "CONFIRMED" ||
          responseData.status === "RECEIVED" ||
          responseData.status === "PAYMENT_RECEIVED"
        ) {
          navigate("/obrigado", {
            state: {
              value: finalPrice - finalShippingCost,
              planTitle: plan.title,
              planId: plan.id,
              quantity: quantity,
              paymentId: responseData.paymentId
            }
          });
        } else if (responseData.status === "PENDING") {
          setPaymentStatus("pending");
        } else {
          setPaymentStatus("refused");
        }
      }
    } catch (err: any) {
      console.error(err);
      setValidationError(
        err.message || "Ocorreu um erro ao processar o pagamento. Verifique os dados e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (paymentStatus) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 overflow-hidden bg-[#F8F6F4] flex flex-col items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
              {paymentStatus === "approved" && (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-6">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Pagamento Aprovado!
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Seu pedido foi confirmado e já está sendo preparado para
                    envio.
                  </p>
                </>
              )}
              {paymentStatus === "refused" && (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Pagamento Recusado
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Não foi possível processar seu pagamento. Por favor, tente
                    novamente com outro cartão.
                  </p>
                </>
              )}
              {paymentStatus === "pending" && (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 mb-6">
                    <RefreshCcw className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Pagamento em Análise
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Seu pagamento está em análise de segurança. Avisaremos por
                    e-mail assim que for concluído!
                  </p>
                </>
              )}
              <button
                onClick={() => {
                  setPaymentStatus(null);
                  handleClose();
                }}
                className="w-full rounded-xl bg-emerald-600 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-emerald-700"
              >
                Voltar para a Loja
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <>
      <AnimatePresence>
      {isOpen && plan && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 bg-[#F8F6F4] flex flex-col"
        >
          {/* Header */}
          <header className="flex flex-row items-center justify-between px-4 py-4 sm:px-8 shrink-0 relative" style={{ background: 'linear-gradient(135deg, #0b262c, #0d272c, #000000)' }}>
            <button
              onClick={handleCheckoutCloseAttempt}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 relative z-10"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <img
                src="/logo-light.png"
                alt="MIX10 PRO"
                className="h-8 object-contain pointer-events-auto"
              />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-100 relative z-10">
              <Lock className="h-3 w-3" strokeWidth={2} />
              <span className="hidden sm:inline">Compra Protegida</span>
              <span className="sm:hidden">Seguro</span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto overscroll-contain pb-24">
            <div className="mx-auto max-w-6xl px-3 py-6 sm:p-8">
              <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:gap-12">
                {/* Left Column - Product Summary */}

                {/* Produto Resumo */}
                <div className="lg:col-span-5 lg:sticky lg:top-8 h-fit lg:mt-0">
                  <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                    <h3 className="text-[11px] sm:text-xs font-semibold tracking-widest text-gray-400 uppercase mb-6 text-center">
                      Resumo da Compra
                    </h3>

                    <div className="flex gap-6 items-center border-b border-gray-100 pb-6 mb-6">
                      <div className="h-[86px] w-[86px] sm:h-24 sm:w-24 shrink-0 rounded-2xl bg-[#f4f7f6] flex items-center justify-center p-2 border border-gray-50">
                        <img
                          src={plan.image}
                          alt={plan.title}
                          className="h-full w-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 capitalize">
                          {plan.id === 1
                            ? (quantity === 1 ? "uma caixa" : `${quantity} caixas`)
                            : plan.id === 2
                              ? (quantity === 1 ? "três caixas" : `${3 * quantity} caixas`)
                              : plan.id === 3
                                ? (quantity === 1 ? "cinco caixas" : `${5 * quantity} caixas`)
                                : plan.title}
                        </h4>
                        <span className="block text-xs font-semibold text-emerald-600 mt-1">
                          {plan.id === 1
                            ? `aproximadamente ${30 * quantity} dias de uso`
                            : plan.id === 2
                              ? `aproximadamente ${90 * quantity} dias de uso`
                              : plan.id === 3
                                ? `aproximadamente ${150 * quantity} dias de uso`
                                : ""}
                        </span>
                        <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                          MIX10 PRO original: fórmula premium para suporte à mobilidade, conforto articular e qualidade de vida.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Quantidade selecionada</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                            disabled={quantity <= 1}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-gray-900 w-6 text-center text-sm">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity((prev) => Math.min(20, prev + 1))}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {appliedCoupon && appliedCoupon.type === "free_shipping" ? (
                        <>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Frete original</span>
                            <span className="font-medium text-gray-900">
                              R$ {shippingCost.toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-medium text-emerald-600">
                            <span>Desconto no frete</span>
                            <span>
                              - R$ {shippingCost.toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Frete final</span>
                            <span className="font-medium text-emerald-600">
                              R$ 0,00
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{shippingName}</span>
                          {selectedShippingIndex === null || !shippingOptions ? (
                            <span className="font-medium text-gray-500">
                              Calculado ao inserir CEP
                            </span>
                          ) : shippingCost === 0 ? (
                            <span className="font-medium text-emerald-600">
                              Grátis
                            </span>
                          ) : (
                            <span className="font-medium text-gray-900">
                              R$ {shippingCost.toFixed(2).replace(".", ",")}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Coupon Field */}
                      <div className="pt-2 border-t border-gray-50 mt-4">
                        {!appliedCoupon ? (
                          <div className="flex flex-col gap-2">
                            {!showCouponInput ? (
                              <button
                                type="button"
                                onClick={() => setShowCouponInput(true)}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 self-start border-b border-dashed border-emerald-600/30 pb-0.5"
                              >
                                Tem cupom de desconto?
                              </button>
                            ) : (
                              <>
                                <label className="text-xs font-medium text-gray-700">
                                  Cupom de desconto
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={couponInput}
                                    onChange={(e) =>
                                      setCouponInput(
                                        e.target.value.toUpperCase(),
                                      )
                                    }
                                    placeholder="Insira o código"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleApplyCoupon()}
                                    disabled={validatingCoupon || !couponInput}
                                    className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-300"
                                  >
                                    {validatingCoupon
                                      ? "Aplicando..."
                                      : "Aplicar"}
                                  </button>
                                </div>
                                {couponError && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {couponError}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                                Cupom Aplicado
                              </span>
                              <span className="text-sm font-bold text-emerald-600">
                                {appliedCoupon.code}
                              </span>
                              {isCouponLocked && (
                                <span className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                                  ✅ Desconto exclusivo de recompra aplicado
                                </span>
                              )}
                            </div>
                            {!isCouponLocked && (
                              <button
                                type="button"
                                onClick={removeCoupon}
                                className="text-xs font-medium text-red-500 hover:text-red-700"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        )}
                        {couponSuccess && (
                          <p className="text-xs text-emerald-600 mt-2">
                            {couponSuccess}
                          </p>
                        )}
                      </div>

                      {appliedCoupon && appliedCoupon.type !== "free_shipping" && (
                        <div className="flex justify-between items-center text-sm font-medium text-emerald-600">
                          <span>Desconto</span>
                          <span>
                            - R$ {discountAmount.toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            Total
                          </span>
                          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 mt-0.5">
                            Últimos lotes com valor reduzido
                          </span>
                        </div>
                        <div className="text-right">
                          {appliedCoupon && (
                            <div className="text-xs text-gray-400 line-through mb-0.5">
                              De R$ {originalPrice.toFixed(2).replace(".", ",")}
                            </div>
                          )}
                          {paymentMethod === "pix" ? (
                            <div className="text-2xl font-bold tracking-tight text-emerald-700">
                              R$ {finalPrice.toFixed(2).replace(".", ",")}
                            </div>
                          ) : (
                            <>
                              <div className="text-2xl font-bold tracking-tight text-emerald-700">
                                {selectedInstallments}x de R${" "}
                                {finalInstallmentValue
                                  .toFixed(2)
                                  .replace(".", ",")}
                              </div>
                              {selectedInstallments > 1 && (
                                <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">
                                  Total: R$ {finalChargedValue.toFixed(2).replace(".", ",")}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-6 space-y-4">
                      <div className="flex items-center gap-3 text-[13px] text-gray-700 font-medium">
                        <Truck
                          className="h-5 w-5 text-emerald-600 shrink-0"
                          strokeWidth={2}
                        />
                        <span>Frete Expresso para todo o Brasil</span>
                      </div>
                      <div className="flex items-center gap-3 text-[13px] text-gray-700 font-bold">
                        <RefreshCcw
                          className="h-5 w-5 text-emerald-600 shrink-0"
                          strokeWidth={2.5}
                        />
                        <span>Garantia de satisfação de 15 dias</span>
                      </div>
                      <div className="flex items-center gap-3 text-[13px] text-gray-700 font-medium">
                        <ShieldCheck
                          className="h-5 w-5 text-emerald-600 shrink-0"
                          strokeWidth={2}
                        />
                        <span>Pagamento rápido e seguro</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Form */}
                <div className="lg:col-span-7">
                  <div className="sm:rounded-3xl sm:border sm:border-gray-100 sm:bg-white sm:p-10 sm:shadow-sm">
                    <h2 className="text-xl font-medium text-gray-900 mb-6 sm:mb-8 tracking-tight px-1 sm:px-0">
                      {isCouponLocked ? "Finalize seu pedido com desconto exclusivo" : "Falta pouco para começar seu tratamento"}
                    </h2>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                      {/* Dados Pessoais */}
                      <section
                        className={`rounded-2xl border transition-all ${currentStep === 1 ? "border-emerald-200 bg-white ring-1 ring-emerald-500/10" : "border-gray-100 bg-gray-50/50"}`}
                      >
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className={`w-full flex items-center justify-between px-4 py-4 sm:p-5 text-left ${currentStep > 1 ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <h3
                            className={`text-xs font-bold tracking-widest uppercase flex items-center gap-3 ${currentStep === 1 ? "text-emerald-800" : "text-gray-500"}`}
                          >
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${currentStep === 1 ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-500"}`}
                            >
                              1
                            </span>
                            Identificação
                          </h3>
                          {currentStep > 1 && (
                            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 hover:text-emerald-800 transition-colors">
                              Editar
                            </span>
                          )}
                        </button>

                        {currentStep === 1 && (
                          <div className="px-4 pb-5 pt-2 sm:px-5 sm:pb-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-700">
                                  <span>Nome completo</span>
                                  <span className="text-[10px] font-normal text-gray-400">
                                    Para identificação do pedido
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  name="name"
                                  value={personalData.name}
                                  onChange={handlePersonalDataChange}
                                  required
                                  placeholder="Digite seu nome"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                  E-mail
                                </label>
                                <input
                                  type="email"
                                  name="email"
                                  value={personalData.email}
                                  onChange={handlePersonalDataChange}
                                  required
                                  placeholder="seu@email.com"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-700">
                                  <span>WhatsApp</span>
                                  <span className="text-[10px] font-normal text-gray-400 hidden sm:inline">
                                    Você receberá atualizações
                                  </span>
                                </label>
                                <input
                                  type="tel"
                                  name="phone"
                                  value={personalData.phone}
                                  onChange={handlePersonalDataChange}
                                  required
                                  placeholder="(00) 00000-0000"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                  CPF
                                </label>
                                <input
                                  type="text"
                                  name="cpf"
                                  value={personalData.cpf}
                                  onChange={handlePersonalDataChange}
                                  required
                                  placeholder="000.000.000-00"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                              </div>
                            </div>

                            {validationError && (
                              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-800">
                                  {validationError}
                                </p>
                              </div>
                            )}

                            <div className="mt-6">
                              <button
                                type="button"
                                onClick={handleNextStep1}
                                className="w-full rounded-xl bg-gray-900 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-gray-800 transition-colors"
                              >
                                Continuar para Entrega
                              </button>
                            </div>
                          </div>
                        )}
                      </section>

                      {/* Endereço */}
                      <section
                        className={`rounded-2xl border transition-all ${currentStep === 2 ? "border-emerald-200 bg-white ring-1 ring-emerald-500/10" : "border-gray-100 bg-gray-50/50"}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (currentStep > 2) setCurrentStep(2);
                          }}
                          className="w-full flex items-center justify-between px-4 py-4 sm:p-5 text-left cursor-default"
                        >
                          <h3
                            className={`text-xs font-bold tracking-widest uppercase flex items-center gap-3 ${currentStep === 2 ? "text-emerald-800" : "text-gray-500"}`}
                          >
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${currentStep === 2 ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-500"}`}
                            >
                              2
                            </span>
                            Entrega
                          </h3>
                          {currentStep > 2 && (
                            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 hover:text-emerald-800 transition-colors">
                              Editar
                            </span>
                          )}
                        </button>

                        {currentStep === 2 && (
                          <div className="px-4 pb-5 pt-2 sm:px-5 sm:pb-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                              <div>
                                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-700">
                                  <span>CEP</span>
                                  <span className="text-[10px] font-normal text-gray-400">
                                    Calculamos o frete automaticamente
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  name="zipCode"
                                  value={zipCodeInput}
                                  onChange={handleZipCodeChange}
                                  required
                                  placeholder="00000-000"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                              </div>

                              {/* Shipping options container */}
                              {shippingOptions && (
                                <div className="sm:col-span-2 space-y-3 mt-2">
                                  <label className="block text-xs font-medium text-gray-700">
                                    Opções de Frete
                                  </label>
                                  <div className="grid grid-cols-1 gap-3">
                                    {shippingOptions.map((option, index) => (
                                      <label
                                        key={index}
                                        className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-colors ${selectedShippingIndex === index ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                                      >
                                        <input
                                          type="radio"
                                          name="shippingOption"
                                          value={index}
                                          checked={
                                            selectedShippingIndex === index
                                          }
                                          onChange={() =>
                                            setSelectedShippingIndex(index)
                                          }
                                          className="sr-only"
                                        />
                                        <span className="flex flex-1">
                                          <span className="flex flex-col">
                                            <span className="block text-sm font-medium text-gray-900">
                                              {option.type}
                                            </span>
                                            <span className="mt-1 flex items-center text-xs text-gray-500">
                                              {option.deliveryTime}
                                            </span>
                                          </span>
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">
                                          {option.price === 0
                                            ? "Grátis"
                                            : `R$ ${option.price.toFixed(2).replace(".", ",")}`}
                                        </span>
                                        <CheckCircle
                                          className={`h-5 w-5 ml-4 ${selectedShippingIndex === index ? "text-emerald-500" : "text-transparent"}`}
                                        />
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="sm:col-span-2 mt-2">
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                  Endereço
                                </label>
                                <input
                                  type="text"
                                  name="address"
                                  value={addressData.address}
                                  onChange={handleAddressChange}
                                  required
                                  placeholder="Rua, Avenida, etc"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                  Número
                                </label>
                                <input
                                  type="text"
                                  name="addressNumber"
                                  value={addressExtras.addressNumber}
                                  onChange={handleAddressExtrasChange}
                                  required
                                  placeholder="000"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                  Complemento (opcional)
                                </label>
                                <input
                                  type="text"
                                  name="complement"
                                  value={addressExtras.complement}
                                  onChange={handleAddressExtrasChange}
                                  placeholder="Apto, Bloco, etc"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                  Bairro
                                </label>
                                <input
                                  type="text"
                                  name="province"
                                  value={addressData.province}
                                  onChange={handleAddressChange}
                                  required
                                  placeholder="Seu bairro"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                  Cidade
                                </label>
                                <input
                                  type="text"
                                  name="city"
                                  value={addressData.city}
                                  onChange={handleAddressChange}
                                  required
                                  placeholder="Sua cidade"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                  Estado (UF)
                                </label>
                                <input
                                  type="text"
                                  name="state"
                                  value={addressData.state}
                                  onChange={handleAddressChange}
                                  required
                                  placeholder="SP"
                                  maxLength={2}
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors uppercase"
                                />
                              </div>
                            </div>

                            {validationError && (
                              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-800">
                                  {validationError}
                                </p>
                              </div>
                            )}

                            <div className="mt-6">
                              <button
                                type="button"
                                onClick={handleNextStep2}
                                className="w-full rounded-xl bg-gray-900 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-gray-800 transition-colors"
                              >
                                Continuar para Pagamento
                              </button>
                            </div>
                          </div>
                        )}
                      </section>

                      {/* Pagamento */}
                      <section
                        className={`rounded-2xl border transition-all ${currentStep === 3 ? "border-emerald-200 bg-white ring-1 ring-emerald-500/10" : "border-gray-100 bg-gray-50/50"}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (currentStep > 3) setCurrentStep(3); // practically impossible, but logically sound
                          }}
                          className="w-full flex items-center justify-between px-4 py-4 sm:p-5 text-left cursor-default"
                        >
                          <h3
                            className={`text-xs font-bold tracking-widest uppercase flex items-center gap-3 ${currentStep === 3 ? "text-emerald-800" : "text-gray-500"}`}
                          >
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${currentStep === 3 ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-500"}`}
                            >
                              3
                            </span>
                            Pagamento
                          </h3>
                        </button>

                        {currentStep === 3 && (
                          <div className="px-4 pb-5 pt-2 sm:px-5 sm:pb-6">
                            <div className="space-y-4">
                              {/* Payment Methods Tabs */}
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                                <label className="cursor-pointer">
                                  <input
                                    type="radio"
                                    name="payment"
                                    value="credit"
                                    className="peer sr-only"
                                    checked={paymentMethod === "credit"}
                                    onChange={() => {
                                      setPaymentMethod("credit");
                                      setIsPixGenerated(false);
                                    }}
                                  />
                                  <div className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-transparent shadow-sm transition-all peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 hover:bg-gray-50">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="text-xs font-medium">
                                      Cartão
                                    </span>
                                  </div>
                                </label>
                                <label className="cursor-pointer">
                                  <input
                                    type="radio"
                                    name="payment"
                                    value="pix"
                                    className="peer sr-only"
                                    checked={paymentMethod === "pix"}
                                    onChange={() => setPaymentMethod("pix")}
                                  />
                                  <div className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-transparent shadow-sm transition-all peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 hover:bg-gray-50">
                                    <Box className="h-4 w-4" />
                                    <span className="text-xs font-medium">
                                      PIX
                                    </span>
                                  </div>
                                </label>
                              </div>

                              {/* Credit Card Form */}
                              {paymentMethod === "credit" && (
                                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-6 space-y-4">
                                  <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                      Número do Cartão
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        name="cardNumber"
                                        value={cardData.cardNumber}
                                        onChange={handleCardDataChange}
                                        required={paymentMethod === "credit"}
                                        placeholder="0000 0000 0000 0000"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      />
                                      <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                        Validade
                                      </label>
                                      <input
                                        type="text"
                                        name="cardExpiry"
                                        value={cardExpiryInput}
                                        onChange={handleCardExpiryChange}
                                        required={paymentMethod === "credit"}
                                        placeholder="MM/AA"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                        CVV
                                      </label>
                                      <input
                                        type="text"
                                        name="cardCvv"
                                        value={cardData.cardCvv}
                                        onChange={handleCardDataChange}
                                        required={paymentMethod === "credit"}
                                        placeholder="123"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                      Nome no Cartão
                                    </label>
                                    <input
                                      type="text"
                                      name="cardName"
                                      value={cardData.cardName}
                                      onChange={handleCardDataChange}
                                      required={paymentMethod === "credit"}
                                      placeholder="Como impresso no cartão"
                                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                      Parcelamento
                                    </label>
                                    <select
                                      name="installments"
                                      value={selectedInstallments}
                                      onChange={(e) =>
                                        setSelectedInstallments(
                                          Number(e.target.value),
                                        )
                                      }
                                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none"
                                    >
                                      {getInstallmentOptions(finalPrice, plan.id, quantity).map((opt) => (
                                        <option key={opt.installments} value={opt.installments}>
                                          {opt.installments}x de R${" "}
                                          {opt.installmentValue
                                            .toFixed(2)
                                            .replace(".", ",")}{" "}
                                          {opt.hasInterest ? "com juros" : "sem juros"}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}

                              {paymentMethod === "pix" && !isPixGenerated && (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-6 text-center space-y-3">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                    <Box className="h-5 w-5 text-emerald-600" />
                                  </div>
                                  <h4 className="text-sm font-medium text-emerald-900">
                                    Pagamento via PIX selecionado
                                  </h4>
                                  <p className="text-xs text-emerald-700/80">
                                    Após clicar em "Finalizar e gerar pagamento", o QR code Pix e o código copia e cola serão exibidos para você concluir o pagamento.
                                  </p>
                                </div>
                              )}

                              {paymentMethod === "pix" && isPixGenerated && (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-6 text-center space-y-4">
                                  <h4 className="text-sm font-medium text-emerald-900">
                                    Escaneie o QR Code
                                  </h4>
                                  <div className="mx-auto w-40 h-40 bg-white p-2 border border-gray-200 rounded-xl shadow-sm flex items-center justify-center">
                                    {pixData?.encodedImage ? (
                                      <img
                                        src={`data:image/jpeg;base64,${pixData.encodedImage}`}
                                        alt="QR Code PIX"
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                                        QR Code
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-gray-700">
                                      Ou copie o código abaixo:
                                    </p>
                                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 max-w-sm mx-auto overflow-hidden">
                                      <input
                                        type="text"
                                        readOnly
                                        value={pixData?.payload || ""}
                                        className="w-full text-xs text-center outline-none bg-transparent text-gray-500 truncate"
                                      />
                                      <button
                                        type="button"
                                        onClick={handleCopyPix}
                                        className="flex shrink-0 items-center gap-1 rounded bg-emerald-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 hover:bg-emerald-200 transition-colors"
                                      >
                                        {copied ? (
                                          "Copiado!"
                                        ) : (
                                          <>
                                            <Copy className="h-3 w-3" /> Copiar
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </section>

                      {validationError && currentStep === 3 && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800">
                            {validationError}
                          </p>
                        </div>
                      )}

                      {(currentStep === 3 || isPixGenerated) && (
                        <button
                          type="submit"
                          disabled={
                            loading ||
                            (paymentMethod === "pix" && isPixGenerated)
                          }
                          className="w-full rounded-xl bg-emerald-600 px-8 py-5 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:shadow-none"
                        >
                          {loading
                            ? "Processando..."
                            : paymentMethod === "pix" && isPixGenerated
                              ? "Aguardando Pagamento..."
                              : "finalizar e gerar pagamento"}
                        </button>
                      )}

                      <div className="flex flex-col items-center justify-center gap-4 mt-8 pb-4">
                        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                          <Lock className="h-3 w-3" strokeWidth={2} />
                          Ambiente 100% Seguro
                        </div>
                        <img
                          src="/selocartoes-min.jpg"
                          alt="Site Seguro SSL"
                          className="h-5.5 md:h-7 object-contain mix-blend-multiply opacity-80"
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <CheckoutRecoveryModal
      isOpen={showRecoveryModal}
      onClose={handleRecoveryClose}
      plan={plan}
      quantity={quantity}
      lpVersion={lpVersion}
      checkoutStep={getStepName(currentStep)}
      paymentMethod={paymentMethod}
    />
    </>
  );
}
