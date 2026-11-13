const getCookie = (name: string): string | null => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  } catch (e) {
    // ignore cookie access error
  }
  return null;
};

const setCookie = (name: string, value: string, days?: number) => {
  try {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
  } catch (e) {}
};

export const isAdminMode = (): boolean => {
  try {
    return (window as any).isInternalMode || getCookie("admin_logged_in") === "true";
  } catch (e) {
    return false;
  }
};

const generateUUID = (): string => {
  try {
    if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
  } catch (e) {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getDeviceType = (): "desktop" | "tablet" | "mobile" => {
  try {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  } catch (e) {}
  return "desktop";
};

const getUTMs = (): Record<string, string | null> => {
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const utms: Record<string, string | null> = {};
  
  try {
    const searchParams = new URLSearchParams(window.location.search);
    let foundInUrl = false;
    utmKeys.forEach((key) => {
      const val = searchParams.get(key);
      if (val) {
        utms[key] = val;
        foundInUrl = true;
      }
    });

    if (foundInUrl) {
      localStorage.setItem("session_utms", JSON.stringify(utms));
      return utms;
    }
  } catch (e) {}

  try {
    const stored = localStorage.getItem("session_utms");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}

  utmKeys.forEach((key) => {
    utms[key] = null;
  });
  return utms;
};

export const getAnalyticsContext = () => {
  let visitorId = getCookie("visitor_id");
  if (!visitorId) {
    try {
      visitorId = localStorage.getItem("visitor_id");
    } catch (e) {}
    if (!visitorId) {
      visitorId = generateUUID();
    }
    setCookie("visitor_id", visitorId, 90);
    try {
      localStorage.setItem("visitor_id", visitorId);
    } catch (e) {}
  }

  const now = Date.now();
  let sessionId = "";
  let needsNewSession = false;

  try {
    const lastActivityStr = localStorage.getItem("session_last_activity");
    const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : 0;
    if (now - lastActivity > 1800000) {
      needsNewSession = true;
    }
  } catch (e) {
    needsNewSession = true;
  }

  try {
    sessionId = sessionStorage.getItem("session_id") || "";
    if (needsNewSession || !sessionId) {
      sessionId = generateUUID();
      sessionStorage.setItem("session_id", sessionId);
    }
    localStorage.setItem("session_last_activity", now.toString());
  } catch (e) {
    if (needsNewSession || !(window as any).analytics_session_id) {
      (window as any).analytics_session_id = generateUUID();
    }
    sessionId = (window as any).analytics_session_id;
    (window as any).analytics_session_last_activity = now;
  }

  let checkoutSessionId = null;
  try {
    checkoutSessionId = sessionStorage.getItem("checkout_session_id");
  } catch (e) {
    checkoutSessionId = (window as any).checkout_session_id || null;
  }

  const utms = getUTMs();
  
  return {
    visitorId,
    sessionId,
    checkoutSessionId,
    device: getDeviceType(),
    utms,
  };
};

export const trackInternalEvent = (
  eventName: string,
  extra: {
    lpVersion: string;
    path: string;
    plan?: number | null;
    quantity?: number | null;
    origin?: string | null;
    value?: number | null;
    orderId?: string | null;
    paymentId?: string | null;
  }
) => {
  if (isAdminMode()) {
    return;
  }

  try {
    const ctx = getAnalyticsContext();
    const cleanLpVersion = (extra.lpVersion || "").trim().toLowerCase();
    
    let lpId = "original";
    if (cleanLpVersion === "v2" || cleanLpVersion === "lp-v2" || extra.path.includes("/lp-v2")) {
      lpId = "v2";
    } else if (cleanLpVersion === "v3" || cleanLpVersion === "lp-v3" || extra.path.includes("/lp-v3")) {
      lpId = "v3";
    }

    const payload = {
      event: eventName,
      visitorId: ctx.visitorId,
      sessionId: ctx.sessionId,
      checkoutSessionId: ctx.checkoutSessionId,
      lpId,
      lpVersion: extra.lpVersion || "original",
      path: extra.path,
      plan: extra.plan || null,
      quantity: extra.quantity || null,
      origin: extra.origin || null,
      value: extra.value || null,
      currency: "BRL",
      orderId: extra.orderId || null,
      paymentId: extra.paymentId || null,
      device: ctx.device,
      ...ctx.utms
    };

    fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Ignore silently
    });

  } catch (err) {
    // Ignore silently
  }
};

export const trackPageView = (lpVersion: string) => {
  trackInternalEvent("page_view", { lpVersion, path: window.location.pathname });

  if (isAdminMode()) {
    console.log("[Tracking - Admin Mode] Intercepted and blocked PageView tracking");
    return;
  }
  if (typeof (window as any).fbq !== "function") return;

  (window as any).fbq("track", "PageView", { lp_version: lpVersion });
  console.log(`[META] PageView fired, lp_version: ${lpVersion}`);
};

export const trackViewContent = (lpVersion: string) => {
  trackInternalEvent("view_content", { lpVersion, path: window.location.pathname });

  if (isAdminMode()) {
    console.log("[Tracking - Admin Mode] Intercepted and blocked ViewContent tracking");
    return;
  }
  if (typeof (window as any).fbq !== "function") return;

  (window as any).fbq("track", "ViewContent", {
    content_ids: ["mix10pro"],
    content_type: "product",
    lp_version: lpVersion
  });
  console.log(`[META] ViewContent fired, lp_version: ${lpVersion}`);
};

export const trackLandingPageVersion = (lpVersion: string) => {
  if (isAdminMode()) {
    console.log("[Tracking - Admin Mode] Intercepted and blocked LandingPageVersion tracking");
    return;
  }
  if (typeof (window as any).fbq !== "function") return;

  try {
    const alreadyTracked = sessionStorage.getItem("tracked_lp_version");
    if (alreadyTracked !== lpVersion) {
      (window as any).fbq("trackCustom", "LandingPageVersion", {
        version: lpVersion,
        experiment: "lp_ab_test_01"
      });
      sessionStorage.setItem("tracked_lp_version", lpVersion);
      console.log(`[META] LandingPageVersion fired: ${lpVersion}`);
    }
  } catch (e) {
    // fallback without storage deduplication if sessionStorage is blocked
    (window as any).fbq("trackCustom", "LandingPageVersion", {
      version: lpVersion,
      experiment: "lp_ab_test_01"
    });
    console.log(`[META] LandingPageVersion fired (fallback): ${lpVersion}`);
  }
};

export const trackAddToCart = (
  id: number,
  lpVersion: string,
  origin?: "OfferTop" | "OfferBottom",
  quantity: number = 1
) => {
  const safeQty = Math.max(1, quantity || 1);
  const totalItems = id === 2 ? 3 : id === 3 ? 5 : safeQty;
  const totalVal = (id === 2 ? 229.70 : id === 3 ? 349.70 : 109.90 * safeQty);

  trackInternalEvent("add_to_cart", {
    lpVersion,
    path: window.location.pathname,
    plan: id === 2 ? 3 : id === 3 ? 5 : 1,
    quantity: safeQty,
    origin,
    value: totalVal
  });

  if (isAdminMode()) {
    console.log("[Tracking - Admin Mode] Intercepted and blocked AddToCart tracking");
    return;
  }
  if (typeof (window as any).fbq !== "function") return;

  let contentId = "mix10pro-kit1";

  if (id === 2) {
    contentId = "mix10pro-kit3";
  } else if (id === 3) {
    contentId = "mix10pro-kit5";
  }

  const payload = {
    content_ids: [contentId],
    content_type: "product",
    value: totalVal,
    currency: "BRL",
    num_items: totalItems,
    lp_version: lpVersion
  };

  (window as any).fbq("track", "AddToCart", payload);
  console.log(`[META] AddToCart fired: ${contentId}, lp_version: ${lpVersion}`);

  if (origin) {
    (window as any).fbq("trackCustom", `AddToCart_${origin}`, payload);
    console.log(`[META] AddToCart_${origin} fired: ${contentId}, lp_version: ${lpVersion}`);
  }
};

export const trackInitiateCheckout = (
  plan: any,
  quantity: number,
  lpVersion: string
) => {
  trackInternalEvent("initiate_checkout", {
    lpVersion,
    path: window.location.pathname,
    plan: plan.id === 2 ? 3 : plan.id === 3 ? 5 : 1,
    quantity,
    value: (plan.id === 2 ? 229.70 : plan.id === 3 ? 349.70 : 109.90) * quantity
  });

  if (isAdminMode()) {
    console.log("[Tracking - Admin Mode] Intercepted and blocked InitiateCheckout tracking");
    return;
  }
  if (typeof (window as any).fbq !== "function") return;

  let contentId = "mix10pro-kit1";
  let val = 109.90;
  let numItems = 1;

  if (plan.id === 2) {
    contentId = "mix10pro-kit3";
    val = 229.70;
    numItems = 3;
  } else if (plan.id === 3) {
    contentId = "mix10pro-kit5";
    val = 349.70;
    numItems = 5;
  }

  (window as any).fbq("track", "InitiateCheckout", {
    content_ids: [contentId],
    content_type: "product",
    value: val * quantity,
    currency: "BRL",
    num_items: numItems * quantity,
    lp_version: lpVersion
  });
  console.log(`[META] InitiateCheckout fired: ${contentId}, value: ${val * quantity}, lp_version: ${lpVersion}`);
};

export const trackAddPaymentInfo = (
  plan: any,
  quantity: number,
  lpVersion: string
) => {
  trackInternalEvent("add_payment_info", {
    lpVersion,
    path: window.location.pathname,
    plan: plan.id === 2 ? 3 : plan.id === 3 ? 5 : 1,
    quantity,
    value: (plan.id === 2 ? 229.70 : plan.id === 3 ? 349.70 : 109.90) * quantity
  });

  if (isAdminMode()) {
    console.log("[Tracking - Admin Mode] Intercepted and blocked AddPaymentInfo tracking");
    return;
  }
  if (typeof (window as any).fbq !== "function") return;

  let contentId = "mix10pro-kit1";
  let val = 109.90;

  if (plan.id === 2) {
    contentId = "mix10pro-kit3";
    val = 229.70;
  } else if (plan.id === 3) {
    contentId = "mix10pro-kit5";
    val = 349.70;
  }

  (window as any).fbq("track", "AddPaymentInfo", {
    content_ids: [contentId],
    content_type: "product",
    value: val * quantity,
    currency: "BRL",
    lp_version: lpVersion
  });
  console.log(`[META] AddPaymentInfo fired: ${contentId}, value: ${val * quantity}, lp_version: ${lpVersion}`);
};

export const trackPurchase = (
  paymentId: string | undefined,
  planId: number,
  value: number,
  quantity: number,
  lpVersion: string,
  orderId?: string
) => {
  trackInternalEvent("purchase", {
    lpVersion,
    path: window.location.pathname,
    plan: planId === 2 ? 3 : planId === 3 ? 5 : 1,
    quantity,
    value,
    paymentId,
    orderId
  });

  if (isAdminMode()) {
    console.log("[Tracking - Admin Mode] Intercepted and blocked Purchase tracking");
    return;
  }
  if (typeof (window as any).fbq !== "function") return;

  let alreadyTracked = false;
  try {
    if (paymentId) {
      alreadyTracked = !!sessionStorage.getItem(`tracked_purchase_${paymentId}`);
      if (!alreadyTracked) {
        sessionStorage.setItem(`tracked_purchase_${paymentId}`, "true");
      }
    } else {
      alreadyTracked = !!sessionStorage.getItem("tracked_purchase_generic");
      if (!alreadyTracked) {
        sessionStorage.setItem("tracked_purchase_generic", "true");
      }
    }
  } catch (err) {
    console.error("Storage access failed, bypassing deduplication:", err);
  }

  if (alreadyTracked) {
    console.log(`Purchase already tracked (deduplicated) for paymentId: ${paymentId || 'generic'}`);
    return;
  }

  let contentId = "mix10pro-kit1";
  let numItems = 1;

  if (planId === 2) {
    contentId = "mix10pro-kit3";
    numItems = 3;
  } else if (planId === 3) {
    contentId = "mix10pro-kit5";
    numItems = 5;
  }

  // Set user data if available (Advanced Matching)
  try {
    const storedUserData = sessionStorage.getItem("pixel_user_data");
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      if (userData && userData.em && userData.ph && userData.fn) {
        (window as any).fbq("init", "992776610153750", userData);
        console.log("[Pixel] fbq('init', 992776610153750, userData) called for Advanced Matching");
      }
    }
  } catch (e) {
    // ignore silently
  }

  (window as any).fbq("track", "Purchase", {
    content_ids: [contentId],
    content_type: "product",
    value: value || 0,
    currency: "BRL",
    num_items: numItems * (quantity || 1),
    lp_version: lpVersion
  });
  console.log(`[META] Purchase fired: ${contentId}, value: ${value}, lp_version: ${lpVersion}`);

  // Meta Pixel Custom Event: CheckoutRecoveryRecovered
  try {
    const wasShown = sessionStorage.getItem("checkout_recovery_shown") === "true";
    const alreadyTracked = sessionStorage.getItem("checkout_recovery_recovered_tracked") === "true";
    if (wasShown && !alreadyTracked) {
      const cleanLp = (lpVersion || "").trim().toLowerCase();
      let lpId = "original";
      if (cleanLp === "v2" || cleanLp === "lp-v2") {
        lpId = "v2";
      } else if (cleanLp === "v3" || cleanLp === "lp-v3") {
        lpId = "v3";
      }

      (window as any).fbq("trackCustom", "CheckoutRecoveryRecovered", {
        lp_id: lpId,
        lp_version: lpVersion || "original",
        kit_quantity: numItems * (quantity || 1),
        kit_name: planId === 2 ? "Kit 3 caixas" : planId === 3 ? "Kit 5 caixas" : "Kit 1 caixa",
        value: value || 0,
        currency: "BRL",
        popup_origin: "checkout",
        popup_variant: "default",
        recovery_action: sessionStorage.getItem("checkout_recovery_action") || "continue",
        recovery_stage: "payment_confirmed"
      });
      sessionStorage.setItem("checkout_recovery_recovered_tracked", "true");
      console.log(`[META] CheckoutRecoveryRecovered fired: ${contentId}, value: ${value}`);
    }
  } catch (err) {
    console.error("Failed to track CheckoutRecoveryRecovered on client:", err);
  }
};

export const trackSelectKit = (
  planId: number,
  lpVersion: string
) => {
  trackInternalEvent("select_kit", {
    lpVersion,
    path: window.location.pathname,
    plan: planId === 2 ? 3 : planId === 3 ? 5 : 1,
    quantity: 1,
    value: planId === 2 ? 229.70 : planId === 3 ? 349.70 : 109.90
  });

  if (isAdminMode()) {
    console.log("[Tracking - Admin Mode] Intercepted and blocked SelectKit tracking");
    return;
  }
  if (typeof (window as any).fbq !== "function") return;

  let contentId = "mix10pro-kit1";
  let val = 109.90;

  if (planId === 2) {
    contentId = "mix10pro-kit3";
    val = 229.70;
  } else if (planId === 3) {
    contentId = "mix10pro-kit5";
    val = 349.70;
  }

  (window as any).fbq("trackCustom", "SelectKit", {
    content_ids: [contentId],
    content_type: "product",
    value: val,
    currency: "BRL",
    lp_version: lpVersion
  });
  console.log(`[META] SelectKit fired: ${contentId}, value: ${val}, lp_version: ${lpVersion}`);
};

// Exit Popup (Landing Page) custom events
export const trackExitPopupEvent = (
  eventName: "ExitPopupShown" | "ExitPopupChooseKit" | "ExitPopupWhatsApp" | "ExitPopupDismissed",
  lpVersion: string
) => {
  if (isAdminMode()) return;

  // 1. Meta Pixel Custom Event
  if (typeof (window as any).fbq === "function") {
    (window as any).fbq("trackCustom", eventName, { lp_version: lpVersion });
    console.log(`[META] Custom event ${eventName} fired, lp_version: ${lpVersion}`);
  }

  // 2. Internal Event Name Mapping
  const internalEventMap: Record<string, string> = {
    ExitPopupShown: "exit_popup_shown",
    ExitPopupChooseKit: "exit_popup_choose_kit",
    ExitPopupWhatsApp: "exit_popup_whatsapp",
    ExitPopupDismissed: "exit_popup_dismissed",
  };
  const internalName = internalEventMap[eventName];
  if (internalName) {
    trackInternalEvent(internalName, { lpVersion, path: window.location.pathname });
  }
};

// Checkout Recovery Modal custom events
export const trackCheckoutRecoveryEvent = (
  eventName: "CheckoutRecoveryShown" | "CheckoutRecoveryContinue" | "CheckoutRecoveryWhatsApp" | "CheckoutRecoveryDismissed",
  plan: any,
  quantity: number,
  lpVersion: string,
  extraData?: {
    checkoutStep?: string;
    paymentMethod?: string;
    popupVariant?: string;
    recoveryAction?: string;
    recoveryStage?: string;
  }
) => {
  if (isAdminMode()) return;

  let contentId = "mix10pro-kit1";
  let val = 109.90;
  let numItems = 1;

  if (plan) {
    if (plan.id === 2) {
      contentId = "mix10pro-kit3";
      val = 229.70;
      numItems = 3;
    } else if (plan.id === 3) {
      contentId = "mix10pro-kit5";
      val = 349.70;
      numItems = 5;
    }
  }

  const cleanLp = (lpVersion || "").trim().toLowerCase();
  let lpId = "original";
  if (cleanLp === "v2" || cleanLp === "lp-v2") {
    lpId = "v2";
  } else if (cleanLp === "v3" || cleanLp === "lp-v3") {
    lpId = "v3";
  }

  const parameters = {
    lp_id: lpId,
    lp_version: lpVersion || "original",
    kit_quantity: numItems * quantity,
    kit_name: plan ? plan.title : "Kit não identificado",
    value: val * quantity,
    currency: "BRL",
    checkout_step: extraData?.checkoutStep || null,
    payment_method: extraData?.paymentMethod || null,
    popup_origin: "checkout",
    popup_variant: extraData?.popupVariant || "default",
    recovery_action: extraData?.recoveryAction || null,
    recovery_stage: extraData?.recoveryStage || null
  };

  // 1. Meta Pixel Custom Event
  if (typeof (window as any).fbq === "function") {
    (window as any).fbq("trackCustom", eventName, parameters);
    console.log(`[META] Custom event ${eventName} fired`, parameters);
  }

  // 2. Internal Event Mapping
  const internalEventMap: Record<string, string> = {
    CheckoutRecoveryShown: "checkout_recovery_shown",
    CheckoutRecoveryContinue: "checkout_recovery_continue",
    CheckoutRecoveryWhatsApp: "checkout_recovery_whatsapp",
    CheckoutRecoveryDismissed: "checkout_recovery_dismissed",
  };
  const internalName = internalEventMap[eventName];
  if (internalName) {
    trackInternalEvent(internalName, {
      lpVersion,
      path: window.location.pathname,
      plan: plan ? (plan.id === 2 ? 3 : plan.id === 3 ? 5 : 1) : null,
      quantity,
      origin: "checkout",
      value: val * quantity,
    });
  }
};

