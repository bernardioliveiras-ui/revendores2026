import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Download,
  RefreshCw,
  LogOut,
  Users,
  ShoppingBag,
  User,
  Ticket,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Cpu,
  TrendingUp,
  Database,
  Copy,
  Check,
  Plus,
  Edit,
  Archive
} from "lucide-react";

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

type Tab = "leads" | "orders" | "customers" | "coupons" | "cro";

const formatPlanOrKit = (value: any) => {
  if (!value) return "-";
  const strVal = String(value).trim().toLowerCase();
  if (strVal === "1" || strVal === "kit 1" || strVal === "1 caixa" || strVal === "kit 1 caixa" || strVal === "1 meses" || strVal === "1 mes") {
    return "Kit 1 caixa";
  }
  if (strVal === "3" || strVal === "kit 3" || strVal === "3 caixas" || strVal === "kit 3 caixas" || strVal === "3 meses") {
    return "Kit 3 caixas";
  }
  if (strVal === "5" || strVal === "kit 5" || strVal === "5 caixas" || strVal === "kit 5 caixas" || strVal === "5 meses") {
    return "Kit 5 caixas";
  }
  // Fallback if not matching:
  if (strVal.startsWith("kit ")) {
    return value;
  }
  return `Kit ${value}`;
};

const formatPlanLabel = (lead: any): string => {
  if (!lead) return "Kit não identificado";

  // 1. Mapeamento explícito de planId
  if (lead.planId !== undefined && lead.planId !== null && lead.planId !== "") {
    const pId = parseInt(String(lead.planId), 10);
    if (pId === 1) return "Kit 1 caixa";
    if (pId === 2) return "Kit 3 caixas";
    if (pId === 3) return "Kit 5 caixas";
  }

  // 2. Mapeamento de plano legado (nome do plano antigo)
  const planVal = lead.plan ?? lead.selectedPlan ?? lead.kit ?? lead.analytics?.plan;
  if (planVal !== undefined && planVal !== null && planVal !== "") {
    const cleanVal = String(planVal).trim().toLowerCase();

    // Kit 1 caixa mapping
    if (cleanVal === "kit 1" || cleanVal === "1 caixa" || cleanVal === "kit 1 caixa" || cleanVal === "1 meses" || cleanVal === "1 mes" || cleanVal === "1") {
      return "Kit 1 caixa";
    }
    
    // Kit 3 caixas mapping (including Kit 2 -> 3 caixas)
    if (cleanVal === "kit 2" || cleanVal === "3" || cleanVal === "3 caixas" || cleanVal === "kit 3 caixas" || cleanVal === "3 meses") {
      return "Kit 3 caixas";
    }

    // Kit 5 caixas mapping (including Kit 3 -> 5 caixas)
    if (cleanVal === "kit 3" || cleanVal === "kit 5" || cleanVal === "5" || cleanVal === "5 caixas" || cleanVal === "kit 5 caixas" || cleanVal === "5 meses") {
      return "Kit 5 caixas";
    }
  }

  // 3. Prioridade de quantidade se não houver identificador de plano
  const qty = lead.quantity ?? lead.analytics?.quantity ?? lead.selectedQuantity;
  if (qty !== undefined && qty !== null && qty !== "") {
    const cleanQty = parseInt(String(qty), 10);
    if (cleanQty === 1) return "Kit 1 caixa";
    if (cleanQty === 3) return "Kit 3 caixas";
    if (cleanQty === 5) return "Kit 5 caixas";
  }

  return "Kit não identificado";
};

const getQuantityAndBoxes = (item: any) => {
  if (!item) return { quantity: 1, baseBoxes: 1, totalBoxes: 1, isMulti: false };

  // Multiplicador selecionado no checkout (ex: 1, 2, 3 unidades)
  const rawQty = Number(
    item.quantity ??
    item.analytics?.quantity ??
    item.selectedQuantity ??
    1
  );
  const quantity = isNaN(rawQty) || rawQty < 1 ? 1 : rawQty;

  // Caixas base do kit (1, 3 ou 5)
  let baseBoxes = 1;
  const pId = Number(item.planId);
  const pMonths = Number(item.planMonths);
  const pStr = String(item.plan ?? item.selectedPlan ?? item.kit ?? item.analytics?.plan ?? "").toLowerCase();

  if (pId === 2 || pMonths === 3 || pStr.includes("3") || pStr.includes("kit 2")) {
    baseBoxes = 3;
  } else if (pId === 3 || pMonths === 5 || pStr.includes("5") || pStr.includes("kit 3")) {
    baseBoxes = 5;
  } else if (pId === 1 || pMonths === 1) {
    baseBoxes = 1;
  }

  const totalBoxes = baseBoxes * quantity;
  const isMulti = totalBoxes > 1;

  return { quantity, baseBoxes, totalBoxes, isMulti };
};

const renderQuantityBadge = (item: any) => {
  const { quantity, baseBoxes, totalBoxes, isMulti } = getQuantityAndBoxes(item);

  if (isMulti) {
    let sublabel = "";
    if (baseBoxes === 1 && quantity > 1) {
      sublabel = ` (${quantity} un.)`;
    } else if (baseBoxes > 1 && quantity > 1) {
      sublabel = ` (${quantity} kits)`;
    }

    return (
      <span 
        className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30 whitespace-nowrap shadow-sm"
        title={`Total de ${totalBoxes} ${totalBoxes === 1 ? "caixa" : "caixas"} do produto`}
      >
        <span>📦</span>
        <span>{totalBoxes} {totalBoxes === 1 ? "caixa" : "caixas"}{sublabel}</span>
      </span>
    );
  }

  return (
    <span 
      className="inline-flex items-center gap-1 rounded bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-400 font-medium border border-slate-700/50 whitespace-nowrap"
      title="1 caixa do produto"
    >
      1 caixa
    </span>
  );
};

const formatLeadOrigin = (lead: any): string => {
  if (!lead) return "Site — LP não identificada";

  const source = lead.source || (lead.origin === "asaas_direct" ? "asaas" : "site");
  const dictionary: Record<string, string> = {
    site: "Site",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    indicacao: "Indicação",
    asaas: "Asaas"
  };
  const baseLabel = dictionary[source] || source || "Site";

  if (baseLabel.toLowerCase() === "site") {
    // LP version extraction priority:
    // 1. lead.lpId
    // 2. lead.analytics?.lpId
    // 3. lead.lpVersion
    // 4. lead.analytics?.lpVersion
    // 5. lead.lp_version (older format compatibility)
    const lpVal = lead.lpId || lead.analytics?.lpId || lead.lpVersion || lead.analytics?.lpVersion || lead.lp_version;
    if (!lpVal) {
      return "Site — LP não identificada";
    }

    const cleanLp = String(lpVal).trim().toLowerCase();
    if (cleanLp === "original" || cleanLp === "main" || cleanLp === "lp-original" || cleanLp === "v1" || cleanLp === "landing page original") {
      return "Site — LP Original";
    }
    if (cleanLp === "v2" || cleanLp === "lp-v2" || cleanLp === "landing page v2") {
      return "Site — LP V2";
    }
    if (cleanLp === "v3" || cleanLp === "lp-v3" || cleanLp === "landing page v3") {
      return "Site — LP V3";
    }

    return "Site — LP não identificada";
  }

  return baseLabel;
};

const translateEtapa = (step: string): string => {
  if (!step) return "-";
  const dictionary: Record<string, string> = {
    personal_info_typing: "Preenchendo informações pessoais",
    personal_info_started: "Iniciou cadastro",
    personal_info_completed: "Completou informações pessoais",
    address_completed: "Completou endereço",
    checkout_started: "Iniciou checkout",
    payment_started: "Iniciou pagamento",
    payment_pending: "Aguardando pagamento",
    purchase_completed: "Compra concluída",
    payment_confirmed: "Pagamento confirmado",
    order_sent_to_hiper: "Enviado ao Hiper ERP",
    archived: "Arquivado"
  };
  return dictionary[step] || step;
};

const translateStatus = (status: string): string => {
  if (!status) return "-";
  const dictionary: Record<string, string> = {
    started: "Iniciado",
    active: "Em andamento",
    pending: "Aguardando pagamento",
    waiting_payment: "Aguardando pagamento",
    processing: "Processando",
    paid: "Pago",
    completed: "Concluído",
    sent_to_hiper: "Enviado ao Hiper ERP",
    archived: "Arquivado",
    checkout_started: "Iniciou checkout",
    payment_started: "Iniciou pagamento",
    personal_info_typing: "Preenchendo informações pessoais",
    personal_info_started: "Iniciou cadastro",
    personal_info_completed: "Completou informações pessoais",
    address_completed: "Completou endereço",
    purchase_completed: "Compra concluída",
    payment_confirmed: "Pagamento confirmado",
    order_sent_to_hiper: "Enviado ao Hiper ERP",
    lead_captured: "Lead Capturado"
  };
  return dictionary[status] || status;
};

const getEtapaBadgeColor = (step: string) => {
  switch (step) {
    case "personal_info_typing":
    case "personal_info_started":
    case "lead_captured":
      return "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/25"; // Cinza
    case "address_completed":
    case "checkout_started":
      return "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/25"; // Azul
    case "payment_started":
    case "payment_pending":
      return "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/25"; // Laranja
    case "purchase_completed":
    case "payment_confirmed":
    case "customer_created":
    case "paid":
      return "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25"; // Verde
    case "order_sent_to_hiper":
      return "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/25"; // Roxo
    case "archived":
      return "bg-slate-800/70 text-slate-400 ring-1 ring-slate-700/50"; // Cinza escuro
    default:
      return "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/25";
  }
};

const renderEtapaBadge = (step: string) => {
  if (!step) return "-";
  const translated = translateEtapa(step);
  const colorClass = getEtapaBadgeColor(step);
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
      {translated}
    </span>
  );
};

const getLeadSituacaoText = (lead: any, orders: any[]) => {
  if (!lead) return "-";

  // Check if archived
  if (lead.archived === true || lead.step === "archived") {
    return "Arquivado";
  }

  // Look for matched order
  const matchedOrder = orders.find((o) => o.paymentId === lead.paymentId || (lead.id && o.leadId === lead.id));

  // Determine stage based on matched order first
  if (matchedOrder) {
    if (matchedOrder.hiperStatus === "faturado" || matchedOrder.status === "faturado") {
      return "Pedido faturado";
    }
    if (matchedOrder.hiperStatus === "sent") {
      return "Pedido enviado ao Hiper";
    }
    if (matchedOrder.status === "pago" || matchedOrder.status === "paid") {
      return "Pago";
    }
    if (matchedOrder.status === "pendente" || matchedOrder.status === "pending") {
      return "Checkout finalizado (aguardando pagamento)";
    }
  }

  // Check lead status directly
  if (lead.status === "paid" || lead.status === "pago" || lead.step === "payment_confirmed") {
    if (lead.step === "order_sent_to_hiper") {
      return "Pedido enviado ao Hiper";
    }
    return "Pago";
  }

  // Map step to situation in order of progress
  const step = lead.step || "";
  if (step === "order_sent_to_hiper") {
    return "Pedido enviado ao Hiper";
  }
  if (step === "purchase_completed" || step === "payment_pending") {
    return "Checkout finalizado (aguardando pagamento)";
  }
  if (step === "payment_started") {
    return "Pagamento iniciado";
  }
  if (step === "frete_selecionado" || step === "shipping_selected" || step === "shipping") {
    return "Frete selecionado";
  }
  if (step === "address_completed" || step === "address") {
    return "Endereço preenchido";
  }
  if (step === "personal_info_completed") {
    return "Informações pessoais completadas";
  }
  if (step === "personal_info_typing" || step === "personal_info_started" || step === "personal_info") {
    return "Preenchendo informações pessoais";
  }
  if (step === "checkout_started" || lead.status === "checkout_started") {
    return "Checkout iniciado";
  }
  if (step === "lead_captured") {
    return "Preenchendo informações pessoais";
  }

  // Fallback translation
  return translateEtapa(step) || translateStatus(lead.status) || "-";
};

const getLeadSituacaoColorClass = (text: string) => {
  switch (text) {
    case "Pedido faturado":
    case "Pago":
      return "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25";
    case "Pedido enviado ao Hiper":
      return "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/25";
    case "Checkout finalizado (aguardando pagamento)":
    case "Pagamento iniciado":
      return "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/25";
    case "Frete selecionado":
    case "Endereço preenchido":
      return "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/25";
    case "Informações pessoais completadas":
    case "Preenchendo informações pessoais":
    case "Checkout iniciado":
      return "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/25";
    case "Arquivado":
      return "bg-slate-800/70 text-slate-400 ring-1 ring-slate-700/50";
    default:
      return "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/25";
  }
};

const renderSituacaoBadge = (lead: any, orders: any[]) => {
  const text = getLeadSituacaoText(lead, orders);
  const colorClass = getLeadSituacaoColorClass(text);
  
  let icon = null;
  if (text === "Pago" || text === "Pedido faturado" || text === "Pedido enviado ao Hiper") {
    icon = <CheckCircle className="h-3.5 w-3.5 text-current" />;
  } else if (text.includes("aguardando") || text.includes("iniciado") || text.includes("preenchendo") || text.includes("selecionado") || text.includes("preenchido")) {
    icon = <Clock className="h-3.5 w-3.5 text-current" />;
  }
  
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
      {icon} {text}
    </span>
  );
};

const renderLeadSourceBadge = (source: string) => {
  const dictionary: Record<string, string> = {
    site: "Site",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    indicacao: "Indicação",
    asaas: "Asaas"
  };
  const label = dictionary[source] || source || "Site";
  return (
    <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20 font-medium" title="Origem do Lead">
      🌱 {label}
    </span>
  );
};

const renderClosingChannelBadge = (channel: string) => {
  const dictionary: Record<string, string> = {
    checkout: "Checkout",
    whatsapp: "WhatsApp",
    manual: "Manual",
    phone: "Telefone",
    comercial: "Comercial"
  };
  const label = dictionary[channel] || channel || "Checkout";
  return (
    <span className="inline-flex items-center gap-1 rounded bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400 ring-1 ring-teal-500/20 font-medium" title="Canal de Fechamento">
      🤝 {label}
    </span>
  );
};

const getStatusBadgeColorClass = (text: string) => {
  const cleaned = text.toLowerCase();
  
  if (
    cleaned === "pago" ||
    cleaned === "concluído" ||
    cleaned === "compra concluída" ||
    cleaned === "cliente cadastrado" ||
    cleaned === "pagamento confirmado"
  ) {
    return "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25";
  }
  
  if (
    cleaned === "aguardando pagamento" ||
    cleaned === "iniciou pagamento"
  ) {
    return "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/25";
  }
  
  if (
    cleaned === "enviado ao hiper erp" ||
    cleaned === "enviado"
  ) {
    return "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/25";
  }
  
  if (
    cleaned === "arquivado"
  ) {
    return "bg-slate-800/70 text-slate-400 ring-1 ring-slate-700/50";
  }
  
  if (
    cleaned === "iniciado" ||
    cleaned === "em andamento" ||
    cleaned === "iniciou cadastro" ||
    cleaned === "completou informações pessoais" ||
    cleaned === "completou endereço" ||
    cleaned === "iniciou checkout" ||
    cleaned === "preenchendo informações pessoais" ||
    cleaned === "processando"
  ) {
    return "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/25";
  }
  
  return "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/25";
};

const renderStatusBadge = (status: string) => {
  const translated = translateStatus(status);
  const colorClass = getStatusBadgeColorClass(translated);
  
  let icon = null;
  const cleaned = translated.toLowerCase();
  if (cleaned === "pago" || cleaned === "concluído" || cleaned.includes("hiper")) {
    icon = <CheckCircle className="h-3 w-3 text-current" />;
  } else if (cleaned.includes("aguardando") || cleaned.includes("iniciado") || cleaned.includes("andamento") || cleaned.includes("processando") || cleaned.includes("preenchendo")) {
    icon = <Clock className="h-3 w-3 text-current" />;
  }
  
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
      {icon} {translated}
    </span>
  );
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("leads");
  const [croDateFilter, setCroDateFilter] = useState<"today" | "yesterday" | "7days" | "30days" | "custom">("7days");
  const [croStartDate, setCroStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [croEndDate, setCroEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const [hiperTestMode, setHiperTestMode] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived">("active");
  const [orderArchiveFilter, setOrderArchiveFilter] = useState<"active" | "archived">("active");
  const [orderOriginFilter, setOrderOriginFilter] = useState<"site" | "asaas" | "all">("site");
  const [sendingOrder, setSendingOrder] = useState<string | null>(null);

  // Hiper products list states
  const [hiperProducts, setHiperProducts] = useState<any[]>([]);
  const [showHiperModal, setShowHiperModal] = useState(false);
  const [loadingHiperProducts, setLoadingHiperProducts] = useState(false);
  const [hiperProductsError, setHiperProductsError] = useState<string | null>(null);

  // Hiper preview payload states
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [previewValidationErrors, setPreviewValidationErrors] = useState<string[]>([]);
  const [previewIsPaid, setPreviewIsPaid] = useState<boolean>(true);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const [previewBuildVersion, setPreviewBuildVersion] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Sorting states
  const [sortField, setSortField] = useState<string>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Coupon creation states
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [couponViewFilter, setCouponViewFilter] = useState<"active" | "archived" | "all">("active");
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [openedWaLeadId, setOpenedWaLeadId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "percentage",
    value: "",
    maxUses: "1000",
    minOrderValue: "0",
    appliesToPlans: [1, 3, 5],
    expiresAt: "2050-12-31T23:59:59Z",
    active: true
  });

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponCode(code);
    setTimeout(() => {
      setCopiedCouponCode(null);
    }, 2000);
  };

  const handleCopyLeadData = (lead: any) => {
    const text = `Nome: ${lead.name || ""}\nEmail: ${lead.email || ""}\nTelefone: ${lead.phone || ""}`;
    navigator.clipboard.writeText(text);
    setCopiedLeadId(lead.id);
    setTimeout(() => {
      setCopiedLeadId(null);
    }, 2000);
  };

  const handleWhatsAppClick = (lead: any) => {
    if (!lead.phone) return;
    const cleanPhone = lead.phone.replace(/\D/g, "");
    const waUrl = `https://wa.me/55${cleanPhone}`;
    window.open(waUrl, "_blank");
    setOpenedWaLeadId(lead.id);
    setTimeout(() => {
      setOpenedWaLeadId(null);
    }, 3000);
  };

  const handleOpenCouponModal = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: "",
      type: "percentage",
      value: "",
      maxUses: "1000",
      minOrderValue: "0",
      appliesToPlans: [1, 3, 5],
      expiresAt: "2050-12-31T23:59:59Z",
      active: true
    });
    setCouponError(null);
    setShowCouponModal(true);
  };

  const handleOpenEditCouponModal = (coupon: any) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.type === "free_shipping" ? "" : String(coupon.value),
      maxUses: String(coupon.maxUses),
      minOrderValue: String(coupon.minOrderValue),
      appliesToPlans: coupon.appliesToPlans || [1, 3, 5],
      expiresAt: coupon.expiresAt || "2050-12-31T23:59:59Z",
      active: coupon.active !== false
    });
    setCouponError(null);
    setShowCouponModal(true);
  };

  const handleArchiveCoupon = async (code: string) => {
    if (!window.confirm(`Tem certeza que deseja arquivar o cupom ${code}? Ele deixará de funcionar no checkout.`)) {
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/coupons/${code}/archive`, {
        method: "POST",
        credentials: "include"
      });
      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }
      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Erro ao arquivar cupom.");
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Erro desconhecido ao arquivar cupom.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreCoupon = async (code: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/coupons/${code}/restore`, {
        method: "POST",
        credentials: "include"
      });
      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }
      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Erro ao restaurar cupom.");
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Erro desconhecido ao restaurar cupom.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlan = (plan: number) => {
    setCouponForm(prev => {
      const plans = prev.appliesToPlans.includes(plan)
        ? prev.appliesToPlans.filter(p => p !== plan)
        : [...prev.appliesToPlans, plan];
      return { ...prev, appliesToPlans: plans };
    });
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCoupon(true);
    setCouponError(null);

    // Front-end validations before posting:
    const codeStr = couponForm.code.trim().toUpperCase();
    if (!codeStr) {
      setCouponError("O código do cupom é obrigatório.");
      setCreatingCoupon(false);
      return;
    }

    let valNum = Number(couponForm.value);
    if (couponForm.type === "free_shipping") {
      valNum = 100;
    } else {
      if (isNaN(valNum) || valNum <= 0) {
        setCouponError("O valor do desconto deve ser um número maior que 0.");
        setCreatingCoupon(false);
        return;
      }
    }

    if (couponForm.type === "percentage" && valNum > 100) {
      setCouponError("Para descontos em porcentagem, o valor não pode ser maior que 100.");
      setCreatingCoupon(false);
      return;
    }

    const maxUsesNum = Number(couponForm.maxUses);
    if (isNaN(maxUsesNum) || maxUsesNum <= 0 || !Number.isInteger(maxUsesNum)) {
      setCouponError("A quantidade máxima de usos deve ser um número inteiro maior que 0.");
      setCreatingCoupon(false);
      return;
    }

    // Ao editar um cupom, não permitir que maxUses seja menor que usedCount.
    if (editingCoupon) {
      if (maxUsesNum < (editingCoupon.usedCount || 0)) {
        setCouponError("O limite máximo de usos não pode ser menor que a quantidade já utilizada.");
        setCreatingCoupon(false);
        return;
      }
    }

    const minOrderNum = Number(couponForm.minOrderValue);
    if (isNaN(minOrderNum) || minOrderNum < 0) {
      setCouponError("O valor mínimo do pedido deve ser maior ou igual a 0.");
      setCreatingCoupon(false);
      return;
    }

    if (couponForm.appliesToPlans.length === 0) {
      setCouponError("Selecione pelo menos um plano aplicável.");
      setCreatingCoupon(false);
      return;
    }

    try {
      const url = editingCoupon 
        ? `/api/admin/coupons/${editingCoupon.code}` 
        : "/api/admin/coupons/create";
      const method = editingCoupon ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...couponForm,
          code: codeStr,
          value: valNum,
          maxUses: maxUsesNum,
          minOrderValue: minOrderNum
        }),
        credentials: "include"
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Resposta inválida do servidor (HTTP ${response.status})`);
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error || (editingCoupon ? "Erro ao atualizar cupom." : "Erro ao criar cupom."));
      }

      // Success
      setShowCouponModal(false);
      setEditingCoupon(null);
      await fetchData(); // Refresh coupon list
    } catch (err: any) {
      setCouponError(err.message || (editingCoupon ? "Erro desconhecido ao tentar atualizar cupom." : "Erro desconhecido ao tentar criar cupom."));
    } finally {
      setCreatingCoupon(false);
    }
  };

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Run concurrent requests
      const [leadsRes, ordersRes, customersRes, couponsRes, authRes] = await Promise.all([
        fetch("/api/admin/leads", { credentials: "include" }),
        fetch("/api/admin/orders", { credentials: "include" }),
        fetch("/api/admin/customers", { credentials: "include" }),
        fetch("/api/admin/coupons", { credentials: "include" }),
        fetch("/api/admin/check-auth", { credentials: "include" })
      ]);

      if (leadsRes.status === 401) {
        navigate("/admin/login");
        return;
      }

      if (!leadsRes.ok || !ordersRes.ok || !customersRes.ok || !couponsRes.ok || !authRes.ok) {
        throw new Error("Erro ao carregar os dados das APIs do servidor.");
      }

      const [leadsData, ordersData, customersData, couponsData, authData] = await Promise.all([
        leadsRes.json(),
        ordersRes.json(),
        customersRes.json(),
        couponsRes.json(),
        authRes.json()
      ]);

      setLeads(leadsData);
      setOrders(ordersData);
      setCustomers(customersData);
      setCoupons(couponsData);
      setDebugMode(authData.debugMode || false);
      setHiperTestMode(authData.hiperTestMode || false);
    } catch (err: any) {
      setError(err.message || "Erro desconhecido ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchAnalytics = async (start: string, end: string) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/funnel?dateFrom=${start}&dateTo=${end}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (e) {
      console.error("Failed to fetch analytics:", e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "cro") {
      fetchAnalytics(croStartDate, croEndDate);
    }
  }, [croStartDate, croEndDate, activeTab]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
      navigate("/admin/login");
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  const handleArchiveLead = async (id: string) => {
    if (!window.confirm("Deseja realmente arquivar este lead?")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/leads/${id}/archive`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error("Erro ao arquivar o lead.");
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || "Erro ao arquivar lead.");
    }
  };

  const handleRestoreLead = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}/restore`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error("Erro ao restaurar o lead.");
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || "Erro ao restaurar lead.");
    }
  };

  const handleSendToHiper = async (id: string, isTest: boolean = false) => {
    const confirmMessage = isTest
      ? "Este pedido ainda não foi pago. Deseja enviar ao Hiper apenas para teste da integração?"
      : "Deseja enviar este pedido manualmente ao Hiper ERP?";
    if (!window.confirm(confirmMessage)) {
      return;
    }
    setSendingOrder(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/send-to-hiper`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar o pedido ao Hiper ERP.");
      }
      alert(data.message || "Pedido enviado com sucesso ao Hiper ERP!");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Erro ao processar o envio manual.");
    } finally {
      setSendingOrder(null);
    }
  };

  const handlePreviewHiper = async (id: string) => {
    setLoadingPreview(true);
    setPreviewError(null);
    setPreviewPayload(null);
    setPreviewValidationErrors([]);
    setPreviewWarnings([]);
    setCopiedPayload(false);
    setPreviewIsPaid(true);
    setPreviewBuildVersion(null);
    setShowPreviewModal(true);

    try {
      const res = await fetch(`/api/admin/orders/${id}/preview-hiper`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.isPaid !== undefined) {
        setPreviewIsPaid(data.isPaid);
      }
      if (data.warnings) {
        setPreviewWarnings(data.warnings);
      }

      if (!res.ok) {
        if (data.validationErrors) {
          setPreviewValidationErrors(data.validationErrors);
        }
        if (data.payload) {
          setPreviewPayload(data.payload);
        }
        if (data.hiperPayloadVersion) {
          setPreviewBuildVersion(data.hiperPayloadVersion);
        }
        throw new Error(data.error || "Erro ao gerar preview do payload.");
      }
      setPreviewPayload(data.payload);
      setPreviewBuildVersion(data.hiperPayloadVersion || null);
    } catch (err: any) {
      setPreviewError(err.message || "Erro ao buscar preview.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const renderOriginBadge = (origin: string) => {
    if (origin === "checkout_site") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
          Site
        </span>
      );
    }
    if (origin === "asaas_direct") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/20">
          Asaas externo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400 ring-1 ring-slate-700">
        Desconhecido
      </span>
    );
  };

  const handleArchiveOrder = async (id: string) => {
    if (!window.confirm("Deseja realmente arquivar este pedido?")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/orders/${id}/archive`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error("Erro ao arquivar o pedido.");
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || "Erro ao arquivar pedido.");
    }
  };

  const handleRestoreOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/restore`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error("Erro ao restaurar o pedido.");
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || "Erro ao restaurar pedido.");
    }
  };

  const handleListHiperProducts = async () => {
    setLoadingHiperProducts(true);
    setHiperProductsError(null);
    setShowHiperModal(true);
    try {
      const res = await fetch("/api/admin/hiper/products", {
        credentials: "include"
      });
      if (!res.ok) {
        const errData = await res.json();
        let errMsg = errData.error || "Erro ao obter produtos do Hiper.";
        if (errData.details) {
          const detailStr = typeof errData.details.responseData === "object"
            ? JSON.stringify(errData.details.responseData)
            : String(errData.details.responseData);
          errMsg += ` (API Hiper: ${detailStr} no endpoint ${errData.details.endpointCalled})`;
        }
        throw new Error(errMsg);
      }
      const data = await res.json();
      setHiperProducts(data);
    } catch (err: any) {
      setHiperProductsError(err.message || "Erro desconhecido ao carregar produtos do Hiper.");
    } finally {
      setLoadingHiperProducts(false);
    }
  };

  // Reset filter when tab changes
  useEffect(() => {
    setStatusFilter("all");
    setArchiveFilter("active");
    setOrderArchiveFilter("active");
    setCouponViewFilter("active");
    // Set default sort fields per tab
    if (activeTab === "leads") {
      setSortField("updatedAt");
      setSortDirection("desc");
    } else if (activeTab === "orders") {
      setSortField("createdAt");
      setSortDirection("desc");
    } else if (activeTab === "customers") {
      setSortField("updatedAt");
      setSortDirection("desc");
    } else if (activeTab === "coupons") {
      setSortField("code");
      setSortDirection("asc");
    }
  }, [activeTab]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Format Helper functions
  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "R$ 0,00";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Filter and Search logic for a specific tab
  const getFilteredDataForTab = (tabName: Tab) => {
    let currentList: any[] = [];
    if (tabName === "leads") {
      currentList = leads.filter((item) => {
        const isArchived = item.archived === true;
        return archiveFilter === "archived" ? isArchived : !isArchived;
      });
    }
    else if (tabName === "orders") {
      currentList = orders.filter((item) => {
        const isArchived = item.archived === true;
        const matchesArchive = orderArchiveFilter === "archived" ? isArchived : !isArchived;
        if (!matchesArchive) return false;

        // Filter by origin:
        if (orderOriginFilter === "site") {
          return item.origin !== "asaas_direct";
        }
        if (orderOriginFilter === "asaas") {
          return item.origin === "asaas_direct";
        }
        return true;
      });
    }
    else if (tabName === "customers") {
      currentList = customers.filter((item) => !item.archived);
    }
    else if (tabName === "coupons") {
      currentList = coupons.filter((item) => {
        const isArchived = item.archived === true;
        if (couponViewFilter === "archived") return isArchived;
        if (couponViewFilter === "active") return !isArchived;
        return true;
      });
    }

    // Search query matching (name, email, phone)
    let filtered = currentList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const nameMatch = item.name && item.name.toLowerCase().includes(q);
      const customerNameMatch = item.customerName && item.customerName.toLowerCase().includes(q);
      const emailMatch = item.email && item.email.toLowerCase().includes(q);
      const phoneMatch = item.phone && item.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""));
      const codeMatch = item.code && item.code.toLowerCase().includes(q);

      return nameMatch || customerNameMatch || emailMatch || phoneMatch || codeMatch;
    });

    // Status filter matching - ONLY apply if tabName matches activeTab
    if (statusFilter !== "all" && activeTab === tabName) {
      if (tabName === "leads") {
        if (statusFilter === "paid") {
          filtered = filtered.filter((item) => item.status === "paid");
        } else if (statusFilter === "checkout_started") {
          filtered = filtered.filter((item) => item.status === "checkout_started");
        } else {
          filtered = filtered.filter((item) => item.step === statusFilter);
        }
      } else if (tabName === "orders") {
        filtered = filtered.filter((item) => item.status === statusFilter);
      } else if (tabName === "coupons") {
        const isActive = statusFilter === "active";
        filtered = filtered.filter((item) => item.active === isActive);
      }
    }

    return filtered;
  };

  const getFilteredData = () => {
    const filtered = getFilteredDataForTab(activeTab);

    // Sorting logic
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "updatedAt") {
        if (!aVal) aVal = a.createdAt || "";
        if (!bVal) bVal = b.createdAt || "";
      }

      // Handle null/undefined values
      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      // Handle date comparisons
      if (sortField.toLowerCase().includes("at") || sortField === "createdAt") {
        const aTime = aVal ? new Date(aVal).getTime() : 0;
        const bTime = bVal ? new Date(bVal).getTime() : 0;
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      // Handle string/number comparisons
      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
    });

    return filtered;
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setArchiveFilter("active");
    setOrderArchiveFilter("active");
    setOrderOriginFilter("site");
    setCouponViewFilter("active");
  };

  // CSV Export logic
  const handleExportCSV = () => {
    const dataToExport = getFilteredData();
    if (dataToExport.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }

    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeTab === "leads") {
      headers = [
        "ID",
        "Nome",
        "E-mail",
        "Telefone",
        "CPF",
        "Plano",
        "Quantidade (Caixas)",
        "Cupom",
        "Status",
        "Etapa",
        "Criado Em",
        "Atualizado Em",
        "Versão da LP"
      ];
      rows = dataToExport.map((item) => [
        item.id,
        item.name,
        item.email,
        item.phone,
        item.cpf,
        formatPlanLabel(item),
        getQuantityAndBoxes(item).totalBoxes,
        item.couponCode,
        translateStatus(item.status),
        translateEtapa(item.step),
        item.createdAt,
        item.updatedAt,
        formatLeadOrigin(item)
      ]);
    } else if (activeTab === "orders") {
      const translateLeadSource = (src: string) => {
        const dict: Record<string, string> = {
          site: "Site",
          instagram: "Instagram",
          whatsapp: "WhatsApp",
          indicacao: "Indicação",
          asaas: "Asaas"
        };
        return dict[src] || src || "Site";
      };
      const translateClosingChannel = (chan: string) => {
        const dict: Record<string, string> = {
          checkout: "Checkout",
          whatsapp: "WhatsApp",
          manual: "Manual",
          phone: "Telefone",
          comercial: "Comercial"
        };
        return dict[chan] || chan || "Checkout";
      };

      headers = [
        "ID do Pedido",
        "ID do Pagamento Asaas",
        "ID do Cliente",
        "Nome do Cliente",
        "Meses do Plano",
        "Quantidade (Caixas)",
        "Valor Original",
        "Desconto",
        "Valor Final",
        "Cupom Utilizado",
        "Status de Pagamento",
        "Origem do Lead",
        "Canal de Fechamento",
        "Data de Criação",
        "Versão da LP"
      ];
      rows = dataToExport.map((item) => [
        item.id,
        item.paymentId,
        item.customerId,
        item.customerName,
        formatPlanOrKit(item.planMonths),
        getQuantityAndBoxes(item).totalBoxes,
        item.originalValue,
        item.discount,
        item.finalValue,
        item.couponCode,
        translateStatus(item.status),
        translateLeadSource(item.source || (item.origin === "asaas_direct" ? "asaas" : "site")),
        translateClosingChannel(item.closingChannel || (item.origin === "asaas_direct" ? "manual" : "checkout")),
        item.createdAt,
        item.lp_version || "original"
      ]);
    } else if (activeTab === "customers") {
      headers = [
        "ID do Cliente",
        "Nome",
        "E-mail",
        "Telefone",
        "CPF",
        "Total de Pedidos",
        "Total Gasto",
        "Data de Cadastro",
        "Última Compra"
      ];
      rows = dataToExport.map((item) => [
        item.id,
        item.name,
        item.email,
        item.phone,
        item.cpf,
        item.totalOrders,
        item.totalSpent,
        item.createdAt,
        item.updatedAt
      ]);
    } else if (activeTab === "coupons") {
      headers = [
        "Código do Cupom",
        "Tipo",
        "Valor",
        "Usos Atuais",
        "Usos Máximos",
        "Valor Mínimo Pedido",
        "Expira Em",
        "Status (Ativo/Inativo)",
        "Arquivado (Sim/Não)",
        "Origem de Criação",
        "Criado Em",
        "Atualizado Em",
        "Arquivado Em"
      ];
      rows = dataToExport.map((item) => [
        item.code,
        item.type === "free_shipping" ? "Frete Grátis" : (item.type === "percentage" ? "Porcentagem" : "Fixo"),
        item.type === "free_shipping" ? "Frete Grátis" : item.value,
        item.usedCount || 0,
        item.maxUses || "∞",
        item.minOrderValue || 0,
        item.expiresAt || "Sem expiração",
        item.active ? "Ativo" : "Inativo",
        item.archived ? "Sim" : "Não",
        item.source || "manual_admin",
        item.createdAt || "",
        item.updatedAt || "",
        item.archivedAt || ""
      ]);
    }

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(";"),
      ...rows.map((row) =>
        row
          .map((value) => {
            const str = value === null || value === undefined ? "" : String(value);
            const escaped = str.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(";")
      )
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeTab}_mix10pro_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to get a unique key for deduplication (Phone first, then Email)
  const getDeduplicateKey = (item: any) => {
    const cleanPhone = item.phone ? item.phone.trim().replace(/\D/g, "") : "";
    if (cleanPhone) {
      return `phone:${cleanPhone}`;
    }
    const cleanEmail = item.email ? item.email.trim().toLowerCase() : "";
    return cleanEmail ? `email:${cleanEmail}` : `id:${item.id || Math.random()}`;
  };

  // 1. Faturamento Total (Apenas pedidos confirmados/pagos, do site e não arquivados)
  const sitePaidOrders = orders.filter((o: any) => 
    o.origin === "checkout_site" && 
    (o.status === "pago" || o.status === "paid") && 
    o.archived !== true
  );
  const totalRevenue = sitePaidOrders.reduce((acc: number, curr: any) => acc + (curr.finalValue || 0), 0);

  // 2. Ticket Médio (Usando os mesmos filtros do faturamento do site)
  const averageTicket = sitePaidOrders.length ? totalRevenue / sitePaidOrders.length : 0;

  // 3. Conversão de Leads (Apenas leads do site e não arquivados)
  // Deduplicação: por telefone primeiro; se não houver telefone, usar e-mail.
  const leadGroups = new Map<string, any[]>();
  leads.forEach((l: any) => {
    if (l.origin === "checkout_site" && l.archived !== true) {
      const key = getDeduplicateKey(l);
      if (!leadGroups.has(key)) {
        leadGroups.set(key, []);
      }
      leadGroups.get(key)!.push(l);
    }
  });

  const totalUniqueLeads = leadGroups.size;
  let totalUniquePaid = 0;

  const paidSiteOrderPaymentIds = new Set<string>();
  orders.forEach((o: any) => {
    if (
      o.origin === "checkout_site" &&
      (o.status === "pago" || o.status === "paid") &&
      o.archived !== true &&
      o.paymentId
    ) {
      paidSiteOrderPaymentIds.add(o.paymentId);
    }
  });

  leadGroups.forEach((groupLeads) => {
    const isConverted = groupLeads.some((l: any) => {
      const hasPaidStatus = l.status === "paid" || l.status === "pago";
      const hasCompletedStep = l.step === "purchase_completed";
      const hasAssociatedPaidOrder = l.paymentId && paidSiteOrderPaymentIds.has(l.paymentId);
      
      return hasPaidStatus || hasCompletedStep || hasAssociatedPaidOrder;
    });

    if (isConverted) {
      totalUniquePaid++;
    }
  });

  const conversionRate = totalUniqueLeads
    ? ((totalUniquePaid / totalUniqueLeads) * 100).toFixed(1)
    : "0.0";

  // 4. Total de utilizações de cupons (Somente cupons usados em pedidos pagos do site e não arquivados)
  const totalCouponUses = orders.filter((o: any) => 
    o.origin === "checkout_site" && 
    (o.status === "pago" || o.status === "paid") && 
    o.archived !== true && 
    o.couponCode
  ).length;

  const filteredData = getFilteredData();

  // CRO & Performance helpers and rendering
  const getFilteredCroData = () => {
    const start = new Date(croStartDate + "T00:00:00");
    const end = new Date(croEndDate + "T23:59:59");

    const filteredLeads = leads.filter((lead) => {
      const dt = new Date(lead.createdAt || lead.updatedAt);
      return dt >= start && dt <= end;
    });

    const filteredOrders = orders.filter((order) => {
      const dt = new Date(order.createdAt);
      return dt >= start && dt <= end;
    });

    return { filteredLeads, filteredOrders };
  };

  const normalizeOrderStatus = (status?: string | null): string => {
    const clean = String(status ?? "").trim().toLowerCase();
    if (!clean) return "pendente";
    
    if (clean === "pago" || clean === "paid" || clean === "confirmed" || clean === "received") {
      return "pago";
    }
    if (clean === "pendente" || clean === "pending" || clean === "bank_slip_viewed" || clean === "updated") {
      return "pendente";
    }
    if (clean === "cancelado" || clean === "cancelled" || clean === "deleted" || clean === "overdue") {
      return "cancelado";
    }
    if (clean === "reembolsado" || clean === "refunded") {
      return "reembolsado";
    }
    return clean;
  };

  const isPaidOrder = (status?: string | null): boolean => {
    return normalizeOrderStatus(status) === "pago";
  };

  const normalizeLpVersion = (value?: string | null): string => {
    const clean = String(value ?? "").trim().toLowerCase();

    if (!clean) return "unknown";

    if (
      clean === "original" ||
      clean === "default" ||
      clean === "v1" ||
      clean === "lp-original"
    ) return "original";

    if (clean === "v2" || clean === "lp-v2") return "v2";
    if (clean === "v3" || clean === "lp-v3") return "v3";

    return clean;
  };

  const getLpVersionLabel = (v: string): string => {
    if (v === "original") return "Landing Page Original";
    if (v === "v2") return "Landing Page V2";
    if (v === "v3") return "Landing Page V3";
    if (v === "unknown") return "Origem não identificada (unknown)";
    return "Versão " + v.toUpperCase();
  };

  const renderCroTab = () => {
    const { filteredLeads, filteredOrders } = getFilteredCroData();

    // 1. Identify all versions dynamically
    const versionsSet = new Set<string>(["original", "v2", "v3", "unknown"]);
    filteredLeads.forEach((l) => {
      versionsSet.add(normalizeLpVersion(l.lp_version));
    });
    filteredOrders.forEach((o) => {
      versionsSet.add(normalizeLpVersion(o.lp_version));
    });

    // Remove "unknown" if there are no leads or orders for it
    const hasUnknownRecords =
      filteredLeads.some(l => normalizeLpVersion(l.lp_version) === "unknown") ||
      filteredOrders.some(o => normalizeLpVersion(o.lp_version) === "unknown");

    if (!hasUnknownRecords) {
      versionsSet.delete("unknown");
    }

    const versions = Array.from(versionsSet).sort((a, b) => {
      const priority = ["original", "v2", "v3", "unknown"];
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const MIN_SAMPLE_SIZE = 10;

    // 2. Compute stats for each version from analyticsData
    const stats: Record<string, {
      pageView: any;
      viewContent: any;
      selectKit: any;
      addToCart: any;
      initiateCheckout: any;
      addPaymentInfo: any;
      paymentCreated: any;
      paymentConfirmed: any;
      revenue: number;
      convPageToView: number;
      convViewToSelect: number;
      convSelectToCart: number;
      convCartToCheckout: number;
      convCheckoutToPaymentInfo: number;
      convPaymentInfoToConfirmed: number;
      convSessionToPaid: number;
      convVisitorToPaid: number;
    }> = {};

    const getStatsForVersion = (v: string) => {
      const g = analyticsData?.grouped?.[v] || {
        page_view: { uniqueVisitors: 0, uniqueSessions: 0, totalEvents: 0 },
        view_content: { uniqueVisitors: 0, uniqueSessions: 0, totalEvents: 0 },
        select_kit: { uniqueVisitors: 0, uniqueSessions: 0, totalEvents: 0 },
        add_to_cart: { uniqueVisitors: 0, uniqueSessions: 0, totalEvents: 0 },
        initiate_checkout: { uniqueVisitors: 0, uniqueSessions: 0, totalEvents: 0 },
        add_payment_info: { uniqueVisitors: 0, uniqueSessions: 0, totalEvents: 0 },
        payment_created: { uniqueVisitors: 0, uniqueSessions: 0, totalEvents: 0 },
        payment_confirmed: { uniqueVisitors: 0, uniqueSessions: 0, totalEvents: 0 },
        revenue: 0,
        conversionRates: {
          sessionToConfirmedPayment: 0,
          visitorToConfirmedPayment: 0
        }
      };
      return g;
    };

    versions.forEach((v) => {
      const g = getStatsForVersion(v);

      stats[v] = {
        pageView: g.page_view,
        viewContent: g.view_content,
        selectKit: g.select_kit,
        addToCart: g.add_to_cart,
        initiateCheckout: g.initiate_checkout,
        addPaymentInfo: g.add_payment_info,
        paymentCreated: g.payment_created,
        paymentConfirmed: g.payment_confirmed,
        revenue: g.revenue,
        // Conversion Rates (sessions)
        convPageToView: g.page_view.uniqueSessions ? (g.view_content.uniqueSessions / g.page_view.uniqueSessions) * 100 : 0,
        convViewToSelect: g.view_content.uniqueSessions ? (g.select_kit.uniqueSessions / g.view_content.uniqueSessions) * 100 : 0,
        convSelectToCart: g.select_kit.uniqueSessions ? (g.add_to_cart.uniqueSessions / g.select_kit.uniqueSessions) * 100 : 0,
        convCartToCheckout: g.add_to_cart.uniqueSessions ? (g.initiate_checkout.uniqueSessions / g.add_to_cart.uniqueSessions) * 100 : 0,
        convCheckoutToPaymentInfo: g.initiate_checkout.uniqueSessions ? (g.add_payment_info.uniqueSessions / g.initiate_checkout.uniqueSessions) * 100 : 0,
        convPaymentInfoToConfirmed: g.add_payment_info.uniqueSessions ? (g.payment_confirmed.uniqueSessions / g.add_payment_info.uniqueSessions) * 100 : 0,
        
        convSessionToPaid: g.conversionRates.sessionToConfirmedPayment,
        convVisitorToPaid: g.conversionRates.visitorToConfirmedPayment
      };
    });

    // 3. Compute row maximums for highlighting
    const maxVals = {
      pageView: Math.max(...versions.map(v => stats[v]?.pageView?.uniqueSessions || 0)),
      viewContent: Math.max(...versions.map(v => stats[v]?.viewContent?.uniqueSessions || 0)),
      selectKit: Math.max(...versions.map(v => stats[v]?.selectKit?.uniqueSessions || 0)),
      addToCart: Math.max(...versions.map(v => stats[v]?.addToCart?.uniqueSessions || 0)),
      initiateCheckout: Math.max(...versions.map(v => stats[v]?.initiateCheckout?.uniqueSessions || 0)),
      addPaymentInfo: Math.max(...versions.map(v => stats[v]?.addPaymentInfo?.uniqueSessions || 0)),
      paymentCreated: Math.max(...versions.map(v => stats[v]?.paymentCreated?.uniqueSessions || 0)),
      paymentConfirmed: Math.max(...versions.map(v => stats[v]?.paymentConfirmed?.uniqueSessions || 0)),
      convSessionToPaid: Math.max(...versions.map(v => stats[v]?.convSessionToPaid || 0)),
      convVisitorToPaid: Math.max(...versions.map(v => stats[v]?.convVisitorToPaid || 0)),
      revenue: Math.max(...versions.map(v => stats[v]?.revenue || 0))
    };

    // 4. Rankings (ranked by sessionToConfirmedPayment conversion)
    const rankedVersions = [...versions].sort((a, b) => {
      return (stats[b]?.convSessionToPaid || 0) - (stats[a]?.convSessionToPaid || 0);
    });

    const winner = rankedVersions[0];
    const second = rankedVersions[1];
    const third = rankedVersions[2];

    const hasEnoughSample = winner && (stats[winner]?.pageView?.uniqueSessions || 0) >= MIN_SAMPLE_SIZE;

    let relativeImprovementText = "-";
    if (hasEnoughSample && second && (stats[second]?.convSessionToPaid || 0) > 0) {
      const improvement = (((stats[winner]?.convSessionToPaid || 0) - (stats[second]?.convSessionToPaid || 0)) / (stats[second]?.convSessionToPaid || 0)) * 100;
      relativeImprovementText = `↑ +${improvement.toFixed(0)}% em relação à segunda colocada.`;
    }

    // 5. Daily Evolution dates
    const getDatesArray = (startStr: string, endStr: string) => {
      const datesList = [];
      let current = new Date(startStr + "T00:00:00");
      const end = new Date(endStr + "T23:59:59");
      while (current <= end) {
        datesList.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
      return datesList;
    };

    const dates = getDatesArray(croStartDate, croEndDate);
    const purchasesByDateAndVersion: Record<string, Record<string, number>> = {};
    dates.forEach((d) => {
      purchasesByDateAndVersion[d] = {};
      versions.forEach((v) => {
        purchasesByDateAndVersion[d][v] = analyticsData?.dailyPurchases?.[d]?.[v] || 0;
      });
    });

    let maxDailyVal = 0;
    dates.forEach((d) => {
      versions.forEach((v) => {
        if (purchasesByDateAndVersion[d][v] > maxDailyVal) {
          maxDailyVal = purchasesByDateAndVersion[d][v];
        }
      });
    });
    if (maxDailyVal === 0) {
      maxDailyVal = 5;
    }

    const versionColors: Record<string, string> = {
      original: "#f59e0b",
      v2: "#3b82f6",
      v3: "#10b981",
      unknown: "#94a3b8"
    };

    const getVersionColor = (v: string, idx: number) => {
      if (versionColors[v]) return versionColors[v];
      const extraColors = ["#a855f7", "#ec4899", "#eab308", "#06b6d4"];
      return extraColors[idx % extraColors.length];
    };

    return (
      <div className="space-y-8 mt-6">
        {/* UPPER CARDS FUNNELS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {versions.map((v) => {
            const vStats = stats[v];
            const title = getLpVersionLabel(v);
            return (
              <div key={v} className="rounded-xl border border-slate-800/80 bg-slate-900/10 p-5 backdrop-blur-sm shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: versionColors[v] || "#a855f7" }}></div>
                <h3 className="text-sm font-bold text-white font-outfit uppercase tracking-wider mb-4 pl-2">{title}</h3>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 pl-2">
                    <span className="text-slate-400">Visitantes (Sessões / Únicos)</span>
                    <span className="text-white font-bold font-outfit">
                      {vStats.pageView?.uniqueSessions.toLocaleString()} / {vStats.pageView?.uniqueVisitors.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 pl-2">
                    <span className="text-slate-400">Visualizações (ViewContent)</span>
                    <span className="text-white font-bold font-outfit">
                      {vStats.viewContent?.uniqueSessions.toLocaleString()} ({vStats.viewContent?.totalEvents.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 pl-2">
                    <span className="text-slate-400">Seleção de Kit (SelectKit)</span>
                    <span className="text-white font-bold font-outfit">
                      {vStats.selectKit?.uniqueSessions.toLocaleString()} ({vStats.selectKit?.totalEvents.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 pl-2">
                    <span className="text-slate-400">AddToCart (Carrinho)</span>
                    <span className="text-white font-bold font-outfit">
                      {vStats.addToCart?.uniqueSessions.toLocaleString()} ({vStats.addToCart?.totalEvents.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 pl-2">
                    <span className="text-slate-400">InitiateCheckout (Checkout)</span>
                    <span className="text-white font-bold font-outfit">
                      {vStats.initiateCheckout?.uniqueSessions.toLocaleString()} ({vStats.initiateCheckout?.totalEvents.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 pl-2">
                    <span className="text-slate-400">AddPaymentInfo (Pagamento)</span>
                    <span className="text-white font-bold font-outfit">
                      {vStats.addPaymentInfo?.uniqueSessions.toLocaleString()} ({vStats.addPaymentInfo?.totalEvents.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 pl-2">
                    <span className="text-slate-400">Pedidos Criados (created)</span>
                    <span className="text-white font-bold font-outfit">
                      {vStats.paymentCreated?.uniqueSessions.toLocaleString()} ({vStats.paymentCreated?.totalEvents.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 pl-2 font-bold text-blue-400">
                    <span className="text-slate-300">Pedidos Pagos (confirmed)</span>
                    <span className="font-outfit">
                      {vStats.paymentConfirmed?.uniqueSessions.toLocaleString()} ({vStats.paymentConfirmed?.totalEvents.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 pl-2 font-bold text-emerald-400">
                    <span className="text-slate-300">Faturamento Realizado</span>
                    <span className="font-outfit">
                      R$ {vStats.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 pl-2 text-emerald-400 font-bold text-sm">
                    <span>Conversão por Sessão</span>
                    <span className="font-outfit">{vStats.convSessionToPaid.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between pt-1 pl-2 text-emerald-500 font-bold text-xs">
                    <span>Conversão por Visitante</span>
                    <span className="font-outfit">{vStats.convVisitorToPaid.toFixed(2)}%</span>
                  </div>
                  {v === "unknown" && (
                    <div className="mt-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-400 font-bold leading-normal">
                      ⚠️ Alerta de qualidade de dados: Existem registros sem identificação de versão da LP no banco. Verifique a integridade do tracking.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* PODIUM RANKING */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/10 p-6 backdrop-blur-sm shadow-lg">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            🏆 Ranking de Performance
          </h3>
          
          {!hasEnoughSample ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-center text-sm font-bold text-yellow-400">
                ⚠️ Dados insuficientes para definir uma vencedora (Mínimo de {MIN_SAMPLE_SIZE} sessões de visitantes na LP líder. Líder atual possui {winner ? stats[winner]?.pageView?.uniqueSessions : 0} sessões).
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {versions.map((v) => {
                  const vStats = stats[v];
                  const label = getLpVersionLabel(v);
                  return (
                    <div key={v} className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 text-center min-h-[160px] flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                      <div className="mt-3">
                        <span className="text-xs text-slate-400 block">Conversão por Sessão</span>
                        <span className="text-2xl font-black text-white font-outfit">{vStats.convSessionToPaid.toFixed(2)}%</span>
                      </div>
                      <div className="mt-2.5 text-[10px] text-slate-500 space-y-1 font-mono">
                        <div>Sessões: {vStats.pageView?.uniqueSessions}</div>
                        <div>Criados: {vStats.paymentCreated?.uniqueSessions} | Pagos: {vStats.paymentConfirmed?.uniqueSessions}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {winner && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center relative overflow-hidden flex flex-col justify-center min-h-[160px] md:scale-105 shadow-xl ring-2 ring-emerald-500/30">
                  <span className="absolute top-2 right-2 text-2xl">🥇</span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Melhor Landing Page</span>
                  <h4 className="text-xl font-black text-white font-outfit mt-2">{getLpVersionLabel(winner)}</h4>
                  <div className="mt-3">
                    <span className="text-xs text-slate-400 block">Conversão por Sessão</span>
                    <span className="text-3xl font-black text-emerald-400 font-outfit">{stats[winner].convSessionToPaid.toFixed(2)}%</span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    Sessões: {stats[winner].pageView?.uniqueSessions} | Criados: {stats[winner].paymentCreated?.uniqueSessions} | Pagos: {stats[winner].paymentConfirmed?.uniqueSessions}
                  </div>
                  <p className="mt-2 text-[10px] text-emerald-300 font-bold">{relativeImprovementText}</p>
                </div>
              )}

              {second && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 text-center relative flex flex-col justify-center min-h-[160px]">
                  <span className="absolute top-2 right-2 text-xl">🥈</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2ª Colocada</span>
                  <h4 className="text-lg font-bold text-white font-outfit mt-2">{getLpVersionLabel(second)}</h4>
                  <div className="mt-3">
                    <span className="text-xs text-slate-400 block">Conversão por Sessão</span>
                    <span className="text-2xl font-black text-white font-outfit">{stats[second].convSessionToPaid.toFixed(2)}%</span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Sessões: {stats[second].pageView?.uniqueSessions} | Criados: {stats[second].paymentCreated?.uniqueSessions} | Pagos: {stats[second].paymentConfirmed?.uniqueSessions}
                  </div>
                </div>
              )}

              {third && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 text-center relative flex flex-col justify-center min-h-[160px]">
                  <span className="absolute top-2 right-2 text-xl">🥉</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3ª Colocada</span>
                  <h4 className="text-lg font-bold text-white font-outfit mt-2">{getLpVersionLabel(third)}</h4>
                  <div className="mt-3">
                    <span className="text-xs text-slate-400 block">Conversão por Sessão</span>
                    <span className="text-2xl font-black text-white font-outfit">{stats[third].convSessionToPaid.toFixed(2)}%</span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Sessões: {stats[third].pageView?.uniqueSessions} | Criados: {stats[third].paymentCreated?.uniqueSessions} | Pagos: {stats[third].paymentConfirmed?.uniqueSessions}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COMPARATIVE TABLE */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/10 overflow-hidden backdrop-blur-sm shadow-lg">
          <div className="p-5 border-b border-slate-800 bg-slate-900/20">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">📊 Comparativo Geral</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-900/40">
                  <th className="px-6 py-4">Métrica</th>
                  {versions.map(v => (
                    <th key={v} className="px-6 py-4 text-center">
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: versionColors[v] || "#a855f7" }} />
                        {getLpVersionLabel(v)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="px-6 py-4 font-medium text-slate-300">Visitantes (Sessões / Únicos)</td>
                  {versions.map(v => {
                    const isBest = stats[v]?.pageView?.uniqueSessions === maxVals.pageView && maxVals.pageView > 0;
                    return (
                      <td key={v} className="px-6 py-4 text-center font-outfit text-white font-bold">
                        <span className={isBest ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block" : ""}>
                          {stats[v]?.pageView?.uniqueSessions.toLocaleString()} / {stats[v]?.pageView?.uniqueVisitors.toLocaleString()}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="px-6 py-4 font-medium text-slate-300">ViewContent</td>
                  {versions.map(v => {
                    const isBest = stats[v]?.viewContent?.uniqueSessions === maxVals.viewContent && maxVals.viewContent > 0;
                    return (
                      <td key={v} className="px-6 py-4 text-center font-outfit text-white font-bold">
                        <span className={isBest ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block" : ""}>
                          {stats[v]?.viewContent?.uniqueSessions.toLocaleString()} ({stats[v]?.viewContent?.totalEvents.toLocaleString()})
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="px-6 py-4 font-medium text-slate-300">SelectKit</td>
                  {versions.map(v => {
                    const isBest = stats[v]?.selectKit?.uniqueSessions === maxVals.selectKit && maxVals.selectKit > 0;
                    return (
                      <td key={v} className="px-6 py-4 text-center font-outfit text-white font-bold">
                        <span className={isBest ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block" : ""}>
                          {stats[v]?.selectKit?.uniqueSessions.toLocaleString()} ({stats[v]?.selectKit?.totalEvents.toLocaleString()})
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="px-6 py-4 font-medium text-slate-300">AddToCart (Carrinho)</td>
                  {versions.map(v => {
                    const isBest = stats[v]?.addToCart?.uniqueSessions === maxVals.addToCart && maxVals.addToCart > 0;
                    return (
                      <td key={v} className="px-6 py-4 text-center font-outfit text-white font-bold">
                        <span className={isBest ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block" : ""}>
                          {stats[v]?.addToCart?.uniqueSessions.toLocaleString()} ({stats[v]?.addToCart?.totalEvents.toLocaleString()})
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="px-6 py-4 font-medium text-slate-300">InitiateCheckout</td>
                  {versions.map(v => {
                    const isBest = stats[v]?.initiateCheckout?.uniqueSessions === maxVals.initiateCheckout && maxVals.initiateCheckout > 0;
                    return (
                      <td key={v} className="px-6 py-4 text-center font-outfit text-white font-bold">
                        <span className={isBest ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block" : ""}>
                          {stats[v]?.initiateCheckout?.uniqueSessions.toLocaleString()} ({stats[v]?.initiateCheckout?.totalEvents.toLocaleString()})
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="px-6 py-4 font-medium text-slate-300">AddPaymentInfo</td>
                  {versions.map(v => {
                    const isBest = stats[v]?.addPaymentInfo?.uniqueSessions === maxVals.addPaymentInfo && maxVals.addPaymentInfo > 0;
                    return (
                      <td key={v} className="px-6 py-4 text-center font-outfit text-white font-bold">
                        <span className={isBest ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block" : ""}>
                          {stats[v]?.addPaymentInfo?.uniqueSessions.toLocaleString()} ({stats[v]?.addPaymentInfo?.totalEvents.toLocaleString()})
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="px-6 py-4 font-medium text-slate-300 text-emerald-400 font-bold">Pedidos Criados</td>
                  {versions.map(v => {
                    const isBest = stats[v]?.paymentCreated?.uniqueSessions === maxVals.paymentCreated && maxVals.paymentCreated > 0;
                    return (
                      <td key={v} className="px-6 py-4 text-center font-outfit text-white font-bold">
                        <span className={isBest ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block" : ""}>
                          {stats[v]?.paymentCreated?.uniqueSessions.toLocaleString()} ({stats[v]?.paymentCreated?.totalEvents.toLocaleString()})
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="px-6 py-4 font-medium text-slate-300 text-blue-400 font-bold">Vendas Pagas</td>
                  {versions.map(v => {
                    const isBest = stats[v]?.paymentConfirmed?.uniqueSessions === maxVals.paymentConfirmed && maxVals.paymentConfirmed > 0;
                    return (
                      <td key={v} className="px-6 py-4 text-center font-outfit text-white font-bold">
                        <span className={isBest ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block" : ""}>
                          {stats[v]?.paymentConfirmed?.uniqueSessions.toLocaleString()} ({stats[v]?.paymentConfirmed?.totalEvents.toLocaleString()})
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="px-6 py-4 font-medium text-slate-300">Faturamento Gerado</td>
                  {versions.map(v => {
                    const isBest = stats[v]?.revenue === maxVals.revenue && maxVals.revenue > 0;
                    return (
                      <td key={v} className="px-6 py-4 text-center font-outfit text-white font-bold text-emerald-400">
                        <span className={isBest ? "bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block font-black" : ""}>
                          R$ {stats[v]?.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="px-6 py-4 font-medium text-slate-300">Conversão por Sessão</td>
                  {versions.map(v => {
                    const isBest = stats[v]?.convSessionToPaid === maxVals.convSessionToPaid && maxVals.convSessionToPaid > 0;
                    return (
                      <td key={v} className="px-6 py-4 text-center font-outfit text-white font-bold">
                        <span className={isBest ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block font-black" : ""}>
                          {stats[v]?.convSessionToPaid.toFixed(2)}%
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="px-6 py-4 font-medium text-slate-300">Conversão por Visitante</td>
                  {versions.map(v => {
                    const isBest = stats[v]?.convVisitorToPaid === maxVals.convVisitorToPaid && maxVals.convVisitorToPaid > 0;
                    return (
                      <td key={v} className="px-6 py-4 text-center font-outfit text-white font-bold">
                        <span className={isBest ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block font-black" : ""}>
                          {stats[v]?.convVisitorToPaid.toFixed(2)}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* DAILY EVOLUTION SVG CHART */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/10 p-6 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">📈 Evolução Diária (Compras)</h3>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {versions.map((v, i) => (
                <div key={v} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: getVersionColor(v, i) }} />
                  <span className="text-slate-300 font-bold">{getLpVersionLabel(v)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[650px]">
              <svg viewBox="0 0 800 240" className="w-full h-auto text-slate-500">
                {/* Horizontal Grid lines */}
                {[0, 1, 2, 3, 4].map((gridIndex) => {
                  const yVal = 30 + gridIndex * 40;
                  const valueLabel = Math.round(maxDailyVal - (gridIndex * maxDailyVal) / 4);
                  return (
                    <g key={gridIndex} className="opacity-30">
                      <line x1="45" y1={yVal} x2="775" y2={yVal} stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="35" y={yVal + 4} textAnchor="end" className="text-[10px] font-bold fill-slate-400">{valueLabel}</text>
                    </g>
                  );
                })}

                {/* X Axis dates */}
                {dates.map((d, index) => {
                  if (dates.length > 10 && index % Math.ceil(dates.length / 8) !== 0 && index !== dates.length - 1) return null;
                  const x = 50 + (index / (dates.length - 1 || 1)) * 715;
                  const formattedDate = d.split("-").slice(1).reverse().join("/");
                  return (
                    <text key={d} x={x} y="210" textAnchor="middle" className="text-[9px] font-bold fill-slate-400 opacity-60">
                      {formattedDate}
                    </text>
                  );
                })}

                {/* Draw line paths for each version */}
                {versions.map((v, vIdx) => {
                  const color = getVersionColor(v, vIdx);
                  const xStep = 715 / (dates.length - 1 || 1);
                  const points = dates.map((d, index) => {
                    const val = purchasesByDateAndVersion[d][v] || 0;
                    const x = 50 + index * xStep;
                    const y = 190 - (val / maxDailyVal) * 160;
                    return `${x},${y}`;
                  });

                  const pathD = `M ${points.join(" L ")}`;

                  return (
                    <g key={v}>
                      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" className="transition-all duration-300" />
                      {dates.map((d, index) => {
                        const val = purchasesByDateAndVersion[d][v] || 0;
                        const x = 50 + index * xStep;
                        const y = 190 - (val / maxDailyVal) * 160;
                        return (
                          <circle
                            key={d}
                            cx={x}
                            cy={y}
                            r="4.5"
                            className="fill-slate-950 transition-all hover:r-6 cursor-pointer"
                            stroke={color}
                            strokeWidth="2.5"
                          >
                            <title>{`LP ${v}: ${val} compras em ${d.split("-").reverse().join("/")}`}</title>
                          </circle>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* VISUAL FUNNELS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {versions.map((v, vIdx) => {
            const vStats = stats[v];
            const title = getLpVersionLabel(v);
            
            const steps = [
              { name: "PageView (Visitantes)", value: vStats.pageView?.uniqueSessions ?? 0, total: vStats.pageView?.totalEvents ?? 0 },
              { name: "ViewContent", value: vStats.viewContent?.uniqueSessions ?? 0, total: vStats.viewContent?.totalEvents ?? 0 },
              { name: "SelectKit", value: vStats.selectKit?.uniqueSessions ?? 0, total: vStats.selectKit?.totalEvents ?? 0 },
              { name: "AddToCart", value: vStats.addToCart?.uniqueSessions ?? 0, total: vStats.addToCart?.totalEvents ?? 0 },
              { name: "InitiateCheckout (Checkout)", value: vStats.initiateCheckout?.uniqueSessions ?? 0, total: vStats.initiateCheckout?.totalEvents ?? 0 },
              { name: "AddPaymentInfo (Pagamento)", value: vStats.addPaymentInfo?.uniqueSessions ?? 0, total: vStats.addPaymentInfo?.totalEvents ?? 0 },
              { name: "Pedidos criados (created)", value: vStats.paymentCreated?.uniqueSessions ?? 0, total: vStats.paymentCreated?.totalEvents ?? 0 },
              { name: "Pedidos pagos (confirmed)", value: vStats.paymentConfirmed?.uniqueSessions ?? 0, total: vStats.paymentConfirmed?.totalEvents ?? 0 }
            ];

            return (
              <div key={v} className="rounded-xl border border-slate-800/80 bg-slate-900/10 p-6 backdrop-blur-sm shadow-lg">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getVersionColor(v, vIdx) }} />
                  <h3 className="text-sm font-bold text-white font-outfit uppercase tracking-wider">Funil {title}</h3>
                </div>

                <div className="flex flex-col items-center space-y-3.5 relative z-10">
                  {steps.map((step, idx) => {
                    const prevVal = idx > 0 ? steps[idx - 1].value : null;
                    const prevAvailable = prevVal !== null;
                    
                    const conversionRate = (prevAvailable && prevVal) ? (step.value / prevVal) * 100 : null;
                    const baseStep = steps[0]; // page_view
                    const cumulativeRate = (baseStep.value) ? (step.value / baseStep.value) * 100 : null;

                    return (
                      <React.Fragment key={step.name}>
                        {idx > 0 && (
                          <div className="flex flex-col items-center text-slate-500 opacity-60">
                            <span className="text-xs">↓</span>
                            <span className="text-[9px] font-bold bg-slate-800/60 px-2 py-0.5 rounded text-slate-400">
                              {conversionRate !== null ? `${conversionRate.toFixed(0)}% conversão` : "0%"}
                            </span>
                          </div>
                        )}

                        <div className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-4.5 transition-all hover:border-slate-700 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">{step.name}</span>
                            <span className="text-xs font-black text-white font-outfit">
                              {step.value.toLocaleString()} / {step.total.toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-1 text-[9px] text-slate-500">
                            (Sessões Únicas / Bruto)
                          </div>
                          
                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-bold border-t border-slate-800/30 pt-1.5">
                            <span>Queda etapa anterior:</span>
                            <span className="text-red-400 font-outfit">
                              {idx === 0 ? "0%" : conversionRate !== null ? `-${(100 - conversionRate).toFixed(0)}%` : "0%"}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                            <span>Aproveitamento (desde page_view):</span>
                            <span className="text-emerald-400 font-outfit">
                              {cumulativeRate !== null ? `${cumulativeRate.toFixed(2)}%` : "0%"}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-outfit">MIX10 PRO</h1>
              <p className="text-xs text-slate-400">Painel de Administração Interno</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {debugMode && (
              <button
                onClick={() => navigate("/admin/system")}
                title="Diagnóstico do Sistema"
                className="flex h-9 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-850 hover:text-white transition-all shadow-sm"
              >
                <Cpu className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Diagnóstico</span>
              </button>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              title="Recarregar Dados"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-900/35 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/30 hover:border-red-800 transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
          {/* Card 1: Total de Leads */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/10 p-5 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">TOTAL DE LEADS</span>
              <span className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-outfit">{totalUniqueLeads}</span>
              <span className="text-[10px] text-slate-450 font-semibold">leads únicos</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Total de leads válidos e deduplicados</p>
          </div>

          {/* Card 2: Conversão */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/10 p-5 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Conversão de Leads</span>
              <span className="rounded-lg bg-blue-500/10 p-1.5 text-blue-400">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-outfit">{conversionRate}%</span>
              <span className="text-[10px] text-slate-450">({totalUniquePaid} de {totalUniqueLeads} únicos)</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Conversão de compradores por leads únicos</p>
          </div>

          {/* Card 3: Uso de Cupons */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/10 p-5 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Uso de Cupons</span>
              <span className="rounded-lg bg-purple-500/10 p-1.5 text-purple-400">
                <Ticket className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-outfit">{totalCouponUses}</span>
              <span className="text-[10px] text-slate-450 font-semibold">utilizações</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Total de utilizações de cupons registradas</p>
          </div>
        </div>
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab("leads")}
            className={`flex items-center justify-center sm:justify-start gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "leads"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-450 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            Leads
            <span className="ml-1.5 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-slate-400 border border-slate-800">
              {getFilteredDataForTab("leads").length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center justify-center sm:justify-start gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "orders"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-450 hover:text-white"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Pedidos
            <span className="ml-1.5 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-slate-400 border border-slate-800">
              {getFilteredDataForTab("orders").length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("cro")}
            className={`flex items-center justify-center sm:justify-start gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "cro"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-450 hover:text-white"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            CRO & Performance
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex items-center justify-center sm:justify-start gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "customers"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-450 hover:text-white"
            }`}
          >
            <User className="h-4 w-4" />
            Clientes
            <span className="ml-1.5 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-slate-400 border border-slate-800">
              {getFilteredDataForTab("customers").length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("coupons")}
            className={`flex items-center justify-center sm:justify-start gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "coupons"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-450 hover:text-white"
            }`}
          >
            <Ticket className="h-4 w-4" />
            Cupons
            <span className="ml-1.5 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-slate-400 border border-slate-800">
              {getFilteredDataForTab("coupons").length}
            </span>
          </button>
        </div>

        {/* Filters and Actions Bar */}
        {activeTab !== "cro" ? (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-900/30 border border-slate-800/80 rounded-xl p-4">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder={
                    activeTab === "coupons"
                      ? "Pesquisar por código..."
                      : "Pesquisar por nome, email ou telefone..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-450 flex items-center gap-1.5">
                  <Filter className="h-3 w-3" /> Filtrar:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                >
                  <option value="all">Todos</option>
                  {activeTab === "leads" && (
                    <>
                      <option value="paid">Pago</option>
                      <option value="checkout_started">Iniciado</option>
                      <option value="personal_info_typing">Digitando Dados Pessoais</option>
                      <option value="personal_info_completed">Dados Pessoais Prontos</option>
                      <option value="address_completed">Endereço Preenchido</option>
                      <option value="payment_started">Pagamento Iniciado</option>
                      <option value="purchase_completed">Finalizado</option>
                    </>
                  )}
                  {activeTab === "orders" && (
                    <>
                      <option value="pago">Pago</option>
                      <option value="pendente">Pendente</option>
                    </>
                  )}
                  {activeTab === "coupons" && (
                    <>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </>
                  )}
                </select>
              </div>

              {activeTab === "leads" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-450 flex items-center gap-1.5">
                    Visualizar:
                  </span>
                  <select
                    value={archiveFilter}
                    onChange={(e: any) => setArchiveFilter(e.target.value)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  >
                    <option value="active">Leads Ativos</option>
                    <option value="archived">Leads Arquivados</option>
                  </select>
                </div>
              )}
              {activeTab === "orders" && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-450 flex items-center gap-1.5">
                      Origem:
                    </span>
                    <select
                      value={orderOriginFilter}
                      onChange={(e: any) => setOrderOriginFilter(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    >
                      <option value="site">Somente Site</option>
                      <option value="asaas">Somente Asaas Externo</option>
                      <option value="all">Todos</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-450 flex items-center gap-1.5">
                      Visualizar:
                    </span>
                    <select
                      value={orderArchiveFilter}
                      onChange={(e: any) => setOrderArchiveFilter(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    >
                      <option value="active">Pedidos Ativos</option>
                      <option value="archived">Pedidos Arquivados</option>
                    </select>
                  </div>
                </>
              )}
              {activeTab === "coupons" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-450 flex items-center gap-1.5">
                    Visualizar:
                  </span>
                  <select
                    value={couponViewFilter}
                    onChange={(e: any) => setCouponViewFilter(e.target.value as any)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  >
                    <option value="active">Cupons Ativos</option>
                    <option value="archived">Cupons Arquivados</option>
                    <option value="all">Todos os Cupons</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end">
              {activeTab === "orders" && (
                <button
                  onClick={handleListHiperProducts}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 active:scale-98 cursor-pointer"
                >
                  <Database className="h-4 w-4" />
                  Listar Produtos Hiper
                </button>
              )}
              {activeTab === "coupons" && (
                <button
                  onClick={handleOpenCouponModal}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 active:scale-98 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Criar Cupom
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25 active:scale-98"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-900/30 border border-slate-800/80 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Período:</span>
              <div className="flex flex-wrap gap-1.5">
                {(["today", "yesterday", "7days", "30days", "custom"] as const).map((preset) => {
                  const labels = {
                    today: "Hoje",
                    yesterday: "Ontem",
                    "7days": "Últimos 7 dias",
                    "30days": "Últimos 30 dias",
                    custom: "Personalizado"
                  };
                  const isSelected = croDateFilter === preset;
                  return (
                    <button
                      key={preset}
                      onClick={() => {
                        setCroDateFilter(preset);
                        const end = new Date();
                        const start = new Date();
                        if (preset === "today") {
                          setCroStartDate(end.toISOString().split("T")[0]);
                          setCroEndDate(end.toISOString().split("T")[0]);
                        } else if (preset === "yesterday") {
                          start.setDate(start.getDate() - 1);
                          end.setDate(end.getDate() - 1);
                          setCroStartDate(start.toISOString().split("T")[0]);
                          setCroEndDate(end.toISOString().split("T")[0]);
                        } else if (preset === "7days") {
                          start.setDate(start.getDate() - 7);
                          setCroStartDate(start.toISOString().split("T")[0]);
                          setCroEndDate(end.toISOString().split("T")[0]);
                        } else if (preset === "30days") {
                          start.setDate(start.getDate() - 30);
                          setCroStartDate(start.toISOString().split("T")[0]);
                          setCroEndDate(end.toISOString().split("T")[0]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-sm font-black"
                          : "bg-slate-850 text-slate-400 hover:text-white"
                      }`}
                    >
                      {labels[preset]}
                    </button>
                  );
                })}
              </div>
            </div>

            {croDateFilter === "custom" && (
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <input
                  type="date"
                  value={croStartDate}
                  onChange={(e) => setCroStartDate(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                />
                <span className="text-slate-500 text-xs">até</span>
                <input
                  type="date"
                  value={croEndDate}
                  onChange={(e) => setCroEndDate(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Data Board */}
        {activeTab !== "cro" ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/20 shadow-xl backdrop-blur-sm">
            {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
              <span className="text-slate-400 text-sm animate-pulse">Carregando dados...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <span className="text-sm">
                {activeTab === "leads" && "Nenhum lead corresponde aos filtros selecionados."}
                {activeTab === "orders" && "Nenhum pedido corresponde aos filtros selecionados."}
                {activeTab === "customers" && "Nenhum cliente corresponde aos filtros selecionados."}
                {activeTab === "coupons" && "Nenhum cupom corresponde aos filtros selecionados."}
              </span>
              <button
                onClick={handleClearFilters}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-all border border-slate-750 cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80">
                  {activeTab === "leads" && (
                    <tr>
                      <th className="px-6 py-4 w-[25%] cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("name")}>
                        Nome {sortField === "name" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4 w-[30%] cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("email")}>
                        Contato {sortField === "email" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4 w-[12%]">Plano / Qtd</th>
                      <th className="px-6 py-4 w-[18%]">Situação</th>
                      <th className="px-6 py-4 min-w-[160px]">Origem</th>
                      <th className="px-6 py-4 w-[9%] cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("updatedAt")}>
                        Atualizado em {sortField === "updatedAt" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4 w-[10%] text-right">Ações</th>
                    </tr>
                  )}
                  {activeTab === "orders" && (
                    <tr>
                      <th className="px-6 py-4">Pedido</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("customerName")}>
                        Cliente {sortField === "customerName" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4">Plano / Qtd</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("originalValue")}>
                        Original {sortField === "originalValue" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4">Desconto</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("finalValue")}>
                        Pago {sortField === "finalValue" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4">Cupom</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Origem</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("createdAt")}>
                        Data {sortField === "createdAt" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4">Status Hiper</th>
                      <th className="px-6 py-4">Envio Hiper</th>
                      <th className="px-6 py-4">Erro Hiper</th>
                      <th className="px-6 py-4">Ações</th>
                    </tr>
                  )}
                  {activeTab === "customers" && (
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("name")}>
                        Nome {sortField === "name" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4">Contato</th>
                      <th className="px-6 py-4">CPF</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("totalOrders")}>
                        Pedidos {sortField === "totalOrders" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("totalSpent")}>
                        Gasto Total {sortField === "totalSpent" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("updatedAt")}>
                        Última Compra {sortField === "updatedAt" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                    </tr>
                  )}
                  {activeTab === "coupons" && (
                    <tr>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("code")}>
                        Cupom {sortField === "code" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4">Tipo</th>
                      <th className="px-6 py-4">Desconto</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort("usedCount")}>
                        Usos {sortField === "usedCount" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                      </th>
                      <th className="px-6 py-4">Valor Mínimo</th>
                      <th className="px-6 py-4">Vencimento</th>
                      <th className="px-6 py-4">Ações</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/10">
                   {activeTab === "leads" &&
                    filteredData.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          {(() => {
                            const displayName = isValidLeadName(lead.name) ? lead.name.trim() : "Nome não informado";
                            return (
                              <div 
                                className="truncate max-w-[150px] sm:max-w-[200px] block cursor-help"
                                title={displayName}
                              >
                                {displayName}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-slate-350">{lead.email || "-"}</span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-slate-450">{lead.phone || "-"}</span>
                              {lead.phone && (
                                <button
                                  onClick={() => handleWhatsAppClick(lead)}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                                  title="Enviar mensagem WhatsApp"
                                >
                                  {openedWaLeadId === lead.id ? (
                                    <span className="font-bold">✓ Aberto</span>
                                  ) : (
                                    <>
                                      <svg className="h-3.5 w-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.989 3.3 1.489 4.954 1.49 5.305 0 9.624-4.321 9.627-9.63.001-2.57-1.002-4.985-2.825-6.81C16.528 2.379 14.12 1.376 11.548 1.376c-5.312 0-9.633 4.32-9.637 9.631-.001 1.765.485 3.491 1.413 5.013l-.995 3.633 3.728-.977zm11.367-6.395c-.302-.151-1.791-.883-2.073-.985-.282-.102-.487-.152-.692.152-.205.305-.795.985-.974 1.189-.179.203-.359.229-.661.078-.302-.151-1.276-.47-2.43-1.499-.899-.801-1.505-1.792-1.681-2.095-.177-.302-.019-.466.132-.616.136-.135.302-.352.454-.528.152-.176.203-.302.305-.503.102-.202.051-.378-.026-.53-.077-.151-.692-1.668-.949-2.285-.25-.601-.525-.519-.718-.529-.187-.01-.401-.012-.614-.012-.213 0-.56.08-0.852.398-.292.318-1.116 1.092-1.116 2.663 0 1.571 1.144 3.09 1.303 3.3.159.21 2.25 3.434 5.451 4.817.761.329 1.355.525 1.817.672.764.243 1.46.209 2.01.127.613-.092 1.792-.733 2.047-1.442.256-.709.256-1.317.18-1.442-.077-.127-.282-.202-.585-.353z" />
                                      </svg>
                                      <span className="text-[11px]">WhatsApp</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs font-semibold text-slate-200">
                              {formatPlanLabel(lead)}
                            </span>
                            {renderQuantityBadge(lead)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {renderSituacaoBadge(lead, orders)}
                        </td>
                        <td className="px-6 py-4 text-xs min-w-[160px] whitespace-nowrap">
                          {(() => {
                            const label = formatLeadOrigin(lead);
                            return (
                              <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20 font-medium" title="Origem do Lead">
                                {label}
                              </span>
                            );
                          })()}
                        </td>
                        <td 
                          className="px-6 py-4 text-xs text-slate-450 cursor-help"
                          title={`Criado em: ${formatDate(lead.createdAt)}\nAtualizado em: ${formatDate(lead.updatedAt || lead.createdAt)}`}
                        >
                          {formatDate(lead.updatedAt || lead.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {lead.archived ? (
                            <button
                              onClick={() => handleRestoreLead(lead.id)}
                              className="rounded bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 ring-1 ring-emerald-500/20 transition-all cursor-pointer"
                            >
                              Restaurar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchiveLead(lead.id)}
                              className="rounded bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 ring-1 ring-amber-500/20 transition-all cursor-pointer"
                            >
                              Arquivar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                  {activeTab === "orders" &&
                    filteredData.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-450">{order.id}</td>
                        <td className="px-6 py-4 font-semibold text-white">
                          <div className="flex flex-col">
                            <span>{order.origin === "asaas_direct" ? "Pagamento externo" : order.customerName}</span>
                            <span className="font-mono text-[10px] text-slate-550">ID: {order.customerId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs font-semibold text-slate-200">
                              {formatPlanOrKit(order.planMonths)}
                            </span>
                            {renderQuantityBadge(order)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{formatCurrency(order.originalValue)}</td>
                        <td className="px-6 py-4 text-red-400/80">-{formatCurrency(order.discount)}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-400">{formatCurrency(order.finalValue)}</td>
                        <td className="px-6 py-4">
                          {order.couponCode ? (
                            <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
                              {order.couponCode}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {renderStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider w-[42px] inline-block">Lead:</span>
                              {renderLeadSourceBadge(order.source || (order.origin === "asaas_direct" ? "asaas" : "site"))}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider w-[42px] inline-block">Canal:</span>
                              {renderClosingChannelBadge(order.closingChannel || (order.origin === "asaas_direct" ? "manual" : "checkout"))}
                            </div>
                            {order.origin && (
                              <span className="text-[9px] text-slate-600 font-medium">({order.origin})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-450">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          {order.hiperStatus === "sent" ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                              Enviado
                            </span>
                          ) : order.hiperStatus === "failed" ? (
                            <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/20">
                              Falhou
                            </span>
                          ) : order.hiperStatus === "disabled" ? (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400 ring-1 ring-slate-700">
                              Desativado
                            </span>
                          ) : order.hiperStatus === "pending" ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/25">
                              Pendente
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-450">
                          {order.hiperSentAt ? formatDate(order.hiperSentAt) : "-"}
                        </td>
                        <td className="px-6 py-4 text-xs text-red-400 max-w-[150px] truncate" title={order.hiperError || ""}>
                          {order.hiperError || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {(order.origin === "checkout_site" || !order.origin) && (
                              <button
                                onClick={() => handlePreviewHiper(order.id)}
                                className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-750 px-3 py-1 text-xs font-semibold text-slate-200 hover:text-white transition-all ring-1 ring-slate-700 cursor-pointer whitespace-nowrap"
                              >
                                Preview Hiper
                              </button>
                            )}

                            {order.status === "pago" && order.hiperStatus !== "sent" && order.origin !== "asaas_direct" && (
                              <button
                                onClick={() => handleSendToHiper(order.id, false)}
                                disabled={sendingOrder === order.id}
                                className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                              >
                                {sendingOrder === order.id ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    Enviando...
                                  </>
                                ) : (
                                  "Enviar Hiper"
                                )}
                              </button>
                            )}
                            
                            {order.status !== "pago" && order.status !== "paid" && order.hiperStatus !== "sent" && order.origin === "checkout_site" && hiperTestMode && (
                              <button
                                onClick={() => handleSendToHiper(order.id, true)}
                                disabled={sendingOrder === order.id}
                                className="inline-flex items-center gap-1 rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                              >
                                {sendingOrder === order.id ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    Enviando...
                                  </>
                                ) : (
                                  "Enviar Hiper (Teste)"
                                )}
                              </button>
                            )}

                            {order.archived ? (
                              <button
                                onClick={() => handleRestoreOrder(order.id)}
                                className="rounded bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 ring-1 ring-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                              >
                                Restaurar
                              </button>
                            ) : (
                              <button
                                onClick={() => handleArchiveOrder(order.id)}
                                className="rounded bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 ring-1 ring-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                              >
                                Arquivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                  {activeTab === "customers" &&
                    filteredData.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-450">{customer.id}</td>
                        <td className="px-6 py-4 font-semibold text-white">{customer.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-200">{customer.email}</span>
                            <span className="text-xs text-slate-500">{customer.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{customer.cpf || "-"}</td>
                        <td className="px-6 py-4 font-semibold text-center sm:text-left">{customer.totalOrders}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-400">{formatCurrency(customer.totalSpent)}</td>
                        <td className="px-6 py-4 text-xs text-slate-450">
                          {formatDate(customer.updatedAt)}
                        </td>
                      </tr>
                    ))}

                  {activeTab === "coupons" &&
                    filteredData.map((coupon) => (
                      <tr key={coupon.code} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs capitalize text-slate-350">
                          {coupon.type === "free_shipping" ? "Frete Grátis" : (coupon.type === "percentage" ? "Porcentagem" : "Fixo")}
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          {coupon.type === "free_shipping" ? "Frete Grátis" : (coupon.type === "percentage" ? `${coupon.value}%` : formatCurrency(coupon.value))}
                        </td>
                        <td className="px-6 py-4">
                          {coupon.archived ? (
                            <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/20">
                              Arquivado
                            </span>
                          ) : coupon.active ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400 ring-1 ring-slate-700">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {coupon.usedCount} / {coupon.maxUses || "∞"}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {coupon.minOrderValue ? formatCurrency(coupon.minOrderValue) : "Nenhum"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-450">
                          {coupon.expiresAt ? formatDate(coupon.expiresAt) : "Sem expiração"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyCoupon(coupon.code)}
                              title="Copiar Código"
                              className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 active:bg-slate-650 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer border border-slate-700/50"
                            >
                              {copiedCouponCode === coupon.code ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleOpenEditCouponModal(coupon)}
                              title="Editar Cupom"
                              className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-400 hover:border-indigo-500/30 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer border border-slate-700/50"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Editar</span>
                            </button>
                            {coupon.archived ? (
                              <button
                                onClick={() => handleRestoreCoupon(coupon.code)}
                                title="Restaurar Cupom"
                                className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-emerald-600/30 hover:text-emerald-400 hover:border-emerald-500/30 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer border border-slate-700/50"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Restaurar</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleArchiveCoupon(coupon.code)}
                                title="Arquivar Cupom"
                                className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-red-600/30 hover:text-red-400 hover:border-red-500/30 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer border border-slate-700/50"
                              >
                                <Archive className="h-3.5 w-3.5" />
                                <span>Arquivar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        renderCroTab()
      )}
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 border-t border-slate-900/60 mt-12 bg-slate-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs text-slate-500">
          <div>
            <span>MIX10 PRO Admin &copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
      {showHiperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowHiperModal(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-white text-sm font-semibold hover:bg-slate-800 rounded-lg p-2 cursor-pointer"
            >
              Fechar
            </button>
            <h2 className="text-xl font-bold text-white mb-2 font-outfit">Produtos Cadastrados no Hiper ERP</h2>
            <p className="text-xs text-slate-450 mb-6">
              Use esta consulta para encontrar o produto <strong>SUPLEMENTO MIX10 PRO</strong> (Código: 3003) e copiar seu ID para a variável <code>HIPER_PRODUCT_MIX10</code> no arquivo <code>.env</code>.
            </p>

            {loadingHiperProducts ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                <span>Buscando produtos no Hiper ERP...</span>
              </div>
            ) : hiperProductsError ? (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 my-4">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{hiperProductsError}</span>
              </div>
            ) : hiperProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Nenhum produto integrado/sincronizado encontrado no Hiper ERP. Certifique-se de que os produtos possuem a opção "Enviar produto para a loja virtual" marcada no Hiper Gestão.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[400px] border border-slate-800 rounded-xl">
                <table className="w-full text-left text-sm text-slate-300 border-collapse">
                  <thead className="sticky top-0 bg-slate-950/95 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3">Código</th>
                      <th className="px-6 py-3">Nome</th>
                      <th className="px-6 py-3">Estoque</th>
                      <th className="px-6 py-3 font-mono">ID (UUID)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-900/50">
                    {hiperProducts.map((p) => {
                      const isTarget = String(p.codigo) === "3003" || p.nome.toUpperCase().includes("MIX10");
                      return (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isTarget 
                              ? "bg-indigo-500/10 border-l-2 border-l-indigo-500" 
                              : ""
                          }`}
                        >
                          <td className="px-6 py-4 font-semibold text-white font-mono text-xs">{p.codigo}</td>
                          <td className="px-6 py-4 text-white font-medium">{p.nome}</td>
                          <td className="px-6 py-4 font-mono text-xs">{p.estoque}</td>
                          <td className="px-6 py-4 font-mono text-xs select-all text-slate-400 hover:text-white" title="Clique duas vezes para selecionar e copiar">
                            {p.id}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHiperModal(false)}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-all cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 text-sm font-semibold hover:bg-slate-100 rounded-lg p-2 cursor-pointer"
            >
              Fechar
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-2 font-outfit">Pré-visualização do Payload do Hiper ERP</h2>
            <p className="text-xs text-slate-600 mb-4">
              Este é o JSON final montado e calculated com base nos dados do pedido e leads de fallback. Nenhum envio real foi realizado.
            </p>

            {loadingPreview ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                <span>Gerando payload...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {!previewIsPaid && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-350 bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Preview apenas para validação. Pedido não pago.</span>
                  </div>
                )}

                {previewWarnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                    <div className="font-semibold mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Alertas de Validação (Avisos):
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {previewWarnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewValidationErrors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                    <div className="font-semibold mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Erros de Validação Identificados:
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {previewValidationErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewError && previewValidationErrors.length === 0 && (
                  <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{previewError}</span>
                  </div>
                )}

                {previewBuildVersion && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <span className="text-xs font-semibold text-emerald-700">✓ Versão do build:</span>
                    <code className="text-xs font-mono text-emerald-800 font-bold">{previewBuildVersion}</code>
                  </div>
                )}

                {previewPayload && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(previewPayload, null, 2));
                        setCopiedPayload(true);
                        setTimeout(() => setCopiedPayload(false), 2000);
                      }}
                      className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors border border-slate-300 cursor-pointer"
                    >
                      {copiedPayload ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar JSON</span>
                        </>
                      )}
                    </button>
                    <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 max-h-[400px]">
                      {JSON.stringify(previewPayload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition-all cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => { setShowCouponModal(false); setEditingCoupon(null); }}
              className="absolute top-4 right-4 text-slate-450 hover:text-white text-sm font-semibold hover:bg-slate-800 rounded-lg p-2 cursor-pointer"
            >
              Fechar
            </button>
            <h2 className="text-xl font-bold text-white mb-2 font-outfit">
              {editingCoupon ? "Editar Cupom" : "Criar Novo Cupom Manual"}
            </h2>
            <p className="text-xs text-slate-450 mb-4">
              {editingCoupon 
                ? "Edite as configurações do cupom existente." 
                : "Preencha os campos abaixo para cadastrar um novo cupom no banco de dados do site."}
            </p>

            {editingCoupon && editingCoupon.usedCount > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3.5 text-xs text-yellow-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Este cupom já foi utilizado ({editingCoupon.usedCount} {editingCoupon.usedCount === 1 ? "vez" : "vezes"}). Para preservar o histórico, tipo, valor e planos aplicáveis não podem ser alterados.
                </span>
              </div>
            )}

            {couponError && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{couponError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: MIX10OFF"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                  disabled={!!editingCoupon}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className={couponForm.type === "free_shipping" ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"}>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tipo *
                  </label>
                  <select
                    value={couponForm.type}
                    onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                    disabled={editingCoupon && editingCoupon.usedCount > 0}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Fixo (R$)</option>
                    <option value="free_shipping">Frete Grátis</option>
                  </select>
                </div>
                {couponForm.type !== "free_shipping" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Valor Desconto *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      placeholder={couponForm.type === "percentage" ? "10" : "20.00"}
                      value={couponForm.value}
                      onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                      disabled={editingCoupon && editingCoupon.usedCount > 0}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Limite de Usos *
                  </label>
                  <input
                    type="number"
                    required
                    min={editingCoupon ? (editingCoupon.usedCount || 1) : 1}
                    value={couponForm.maxUses}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mínimo do Pedido (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={couponForm.minOrderValue}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Aplicável aos Planos *
                </label>
                <div className="flex gap-4">
                  {[1, 3, 5].map((plan) => (
                    <label key={plan} className={`flex items-center gap-2 text-sm text-white select-none ${editingCoupon && editingCoupon.usedCount > 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={couponForm.appliesToPlans.includes(plan)}
                        onChange={() => handleTogglePlan(plan)}
                        disabled={editingCoupon && editingCoupon.usedCount > 0}
                        className="rounded border-slate-850 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:cursor-not-allowed"
                      />
                      <span>Kit {plan} Caixa{plan > 1 ? "s" : ""}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Vencimento do Cupom
                </label>
                <input
                  type="datetime-local"
                  value={couponForm.expiresAt ? couponForm.expiresAt.substring(0, 16) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCouponForm({
                      ...couponForm,
                      expiresAt: val ? new Date(val).toISOString() : ""
                    });
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Se deixado em branco, o cupom expira em 31/12/2050 por padrão.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="coupon-active-checkbox"
                  checked={couponForm.active}
                  onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                <label htmlFor="coupon-active-checkbox" className="text-sm text-white cursor-pointer select-none">
                  Cupom Ativo (disponível para uso no checkout)
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => { setShowCouponModal(false); setEditingCoupon(null); }}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingCoupon}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {creatingCoupon ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {editingCoupon ? "Salvando..." : "Criando..."}
                    </>
                  ) : (
                    editingCoupon ? "Salvar Alterações" : "Criar Cupom"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
