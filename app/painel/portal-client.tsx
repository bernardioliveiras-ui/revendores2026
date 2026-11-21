"use client";
import { IntegrationCheck } from "@/components/integration-check";
import { PaymentSync } from "@/components/payment-sync";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PortalFrame, PortalMetric } from "@/components/portal-frame";
import { WelcomeVideo } from "@/components/welcome-video";
import { deliveryProgress } from "@/lib/delivery-progress";
import { ContentStudioAdmin } from "@/components/content-studio-admin";
import { LandingTextStudio } from "@/components/landing-text-studio";
import { IndicatorAdmin } from "@/components/indicator-admin";
import { MarketingFolder } from "@/components/marketing-folder";
import { ResellerMaterials } from "@/components/reseller-materials";
import { BkoControlDashboard } from "@/components/bko-control-dashboard";
import { ChartNoAxesCombined, ClipboardList, Search, ShoppingBag, Truck, Wallet } from "lucide-react";
import { manualWhatsAppLink, manualEmailLink } from "@/lib/manual-welcome.mjs";

type SessionUser = { id: string; email: string; name: string; phone?: string; role: "admin" | "reseller" | "indicator"; mustChangePassword: boolean };
type StockData = { stock: number; soldBoxes: number; grossSalesCents: number; movements: Array<{ id: string; type: string; boxes: number; notes: string; occurredAt: string }>; sales: Array<{ id: string; boxes: number; unitValueCents: number; totalValueCents: number; channel: string; customerName: string; soldAt: string }> };
type Purchase = { productTotalCents?:number;shippingCents?:number;interestCents?:number;asaasVerifiedAt?:string|null;campaignId?:string|null; id: string; orderNumber: string; name: string; email: string; phone: string; cpfCnpj: string; kit: string; boxes: number; totalCents: number; paymentStatus: string; shippingStatus: string; carrier?: string | null; trackingCode?: string | null; postalEvent?:string|null; postalEventAt?:string|null; postalCheckedAt?:string|null; postalIssue?:string|null; street: string; number: string; complement: string; district: string; city: string; state: string; postalCode: string; accessReleasedAt?: string | null; userId?: string | null; createdAt: string; welcomeStatus?: string };
type AdminReseller = { id: string; name: string; email: string; phone: string; status: string; createdAt: string; stock: number; soldBoxes: number; grossSalesCents: number };
type AdminSale = { id: string; userId: string; boxes: number; unitValueCents: number; totalValueCents: number; channel: string; customerName: string; soldAt: string };
type AdminData = { metrics: { activeResellers: number; paidPurchases: number; pendingAccess: number; kitRevenueCents: number; boxesSold: number; grossSalesCents: number; aggregateStock: number; affiliateLinks: number; affiliateClicks: number }; purchases: Purchase[]; resellers: AdminReseller[]; sales: AdminSale[] };
type View = "overview" | "stock" | "sales" | "manual" | "welcome" | "delivery" | "referrals";
type ResellerReferral = { id:string; publicCode:string; customerName:string; whatsapp:string; status:string; clickCount:number; createdAt:string; link:string };
type AdminTab = "integrations" | "materials" | "overview" | "indicators" | "access" | "orders" | "shipping" | "sales" | "content" | "studio" | "maintenance";
type Shipment = { id: string; orderNumber: string; kit: string; boxes: number; paymentStatus: string; shippingStatus: string; carrier?: string | null; trackingCode?: string | null; postalEvent?:string|null; postalEventAt?:string|null; postalCheckedAt?:string|null; postalIssue?:string|null; asaasInvoiceUrl?: string | null; totalCents?: number; paymentMethod?: string; installments?: number; createdAt: string; updatedAt?: string | null };
type ReplenishmentOption = { installments: number; installmentValueCents: number; chargedValueCents: number; interestCents: number; hasInterest: boolean };
type ReplenishmentShipping = { id: "economical" | "express"; label: string; priceCents: number; deliveryTime: string; baseCents: number; installments: ReplenishmentOption[] };
type ReplenishmentKit = { id: "kit20" | "kit50" | "kit100"; label: string; boxes: number; productTotalCents: number; shipping: ReplenishmentShipping[] };
type ReplenishmentData = { postalCode: string; kits: ReplenishmentKit[] };

const money = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (v: string) => new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

async function portalFetch(url: string, init: RequestInit = {}) {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(url === "/api/replenishment" && init.method === "POST" ? 75000 : 25000) });
    const body = await response.json().catch(() => ({ error: "O servidor não respondeu corretamente. Tente novamente." }));
    return { ok: response.ok, status: response.status, json: async () => body };
  } catch {
    return { ok: false, status: 503, json: async () => ({ error: "Não foi possível conectar. Confira sua conexão e tente novamente." }) };
  }
}

export function PortalClient({ welcomeVideoUrl = "", embedUrl = "", videoUrl = "", manualUrl = "/api/reseller/manual" }: { welcomeVideoUrl?: string; embedUrl?: string; videoUrl?: string; manualUrl?: string }) {
  const saleInFlight = useRef(false);
  const adminSaleInFlight = useRef(false);
  const [savingSale, setSavingSale] = useState(false);
  const [savingAdminSale, setSavingAdminSale] = useState(false);
  const [saleBoxesInput, setSaleBoxesInput] = useState("1");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("overview");
  const [stock, setStock] = useState<StockData | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [referrals, setReferrals] = useState<ResellerReferral[]>([]);
  const [referralBusy, setReferralBusy] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>("overview");
  const [studioDirty, setStudioDirty] = useState(false);
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [notice, setNotice] = useState("");
  const [resellerSearch,setResellerSearch]=useState("");
  const [resellerSort,setResellerSort]=useState("revenue");
  const [resellerBusy,setResellerBusy]=useState(false);
  const [editingReseller,setEditingReseller]=useState<AdminReseller|null>(null);
  const [editResellerDraft,setEditResellerDraft]=useState({name:"",email:"",phone:""});
  const [maintenanceLoading,setMaintenanceLoading]=useState(false);
  const [maintenancePreview,setMaintenancePreview]=useState<{counts:Record<string,number>;usersByRole:Record<string,number>;generatedAt:string}|null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string; phone: string; name: string } | null>(null);
  const [adminSaleUserId, setAdminSaleUserId] = useState("");
  const [adminSaleBoxesInput, setAdminSaleBoxesInput] = useState("1");
  const [replenishment, setReplenishment] = useState<ReplenishmentData | null>(null);
  const [replenishKit, setReplenishKit] = useState<"kit20" | "kit50" | "kit100">("kit20");
  const [replenishShipping, setReplenishShipping] = useState<"economical" | "express">("economical");
  const [replenishPayment, setReplenishPayment] = useState<"pix" | "credit">("pix");
  const [replenishInstallments, setReplenishInstallments] = useState(1);
  const [creatingReplenishment, setCreatingReplenishment] = useState(false);

  const loadReseller = useCallback(async () => {
    const [a, b, c] = await Promise.all([portalFetch("/api/stock", { cache: "no-store" }), portalFetch("/api/my-purchases", { cache: "no-store" }), portalFetch("/api/replenishment", { cache: "no-store" })]);
    if (a.status === 401 || b.status === 401 || c.status === 401) { location.href = "/entrar"; return; }
    const sa = await a.json(); const rb = await b.json(); const rc = await c.json();
    if (a.ok) {
      setStock(sa);
      setSaleBoxesInput((current) => {
        const parsed = Number.parseInt(current, 10);
        if (!Number.isFinite(parsed) || parsed < 1) return "1";
        return String(Math.min(parsed, Math.max(sa.stock, 1)));
      });
    } else setNotice(sa.error || "Não foi possível carregar o estoque.");
    if (b.ok) setShipments(rb.purchases || []); else setNotice(rb.error || "Não foi possível carregar os pedidos.");
    if (c.ok) setReplenishment(rc); else setNotice(rc.error || "Não foi possível preparar a reposição.");
  }, []);

  const loadReferrals = useCallback(async () => {
    const r=await portalFetch("/api/referrals",{cache:"no-store"}); const b=await r.json();
    if(!r.ok){setNotice(b.error||"Não foi possível carregar suas indicações.");return;}
    setReferrals(b.referrals||[]);
  },[]);

  const loadAdmin = useCallback(async () => {
    const r = await portalFetch("/api/admin/overview", { cache: "no-store" });
    if (r.status === 401) { location.href = "/entrar"; return; }
    const b = await r.json();
    if (r.ok) {
      setAdmin(b);
      setAdminSaleUserId((current) => current || b.resellers?.find((item: AdminReseller) => item.status === "active")?.id || "");
    } else setNotice(b.error || "Não foi possível carregar o BKO.");
  }, []);

  useEffect(() => {
    (async () => {
      const r = await portalFetch("/api/auth/session", { cache: "no-store" });
      const b = await r.json();
      if (!r.ok) { setNotice(b.error || "Não foi possível carregar o portal."); setLoading(false); return; }
      if (!b.authenticated) { location.href = "/entrar"; return; }
      if (b.user.mustChangePassword) { location.href = "/trocar-senha"; return; }
      setUser(b.user);
      if (b.user.role === "indicator") { location.replace("/minhas-indicacoes"); return; }
      if (b.user.role === "admin") await loadAdmin(); else await loadReseller();
      setLoading(false);
    })();
  }, [loadAdmin, loadReseller]);

  useEffect(() => {
    if (!user || user.role !== "reseller") return;
    const refresh = () => { if (document.visibilityState === "visible") void loadReseller().catch(() => setNotice("Não foi possível atualizar. Tente novamente.")); };
    const timer = setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [user, loadReseller]);

  useEffect(()=>{if(user?.role==="reseller"&&view==="referrals")void loadReferrals();},[user,view,loadReferrals]);

  async function createReferral(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(referralBusy)return;
    const form=e.currentTarget;setReferralBusy(true);setNotice("");
    try{const payload=Object.fromEntries(new FormData(form));const r=await portalFetch("/api/referrals",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const b=await r.json();if(!r.ok){setNotice(b.error||"Não foi possível criar a indicação.");return;}form.reset();await loadReferrals();setNotice("Link individual criado. Compartilhe apenas com o contato informado.");}finally{setReferralBusy(false)}
  }

  async function logout() { await portalFetch("/api/auth/logout", { method: "POST" }); location.href = "/entrar"; }

  async function registerSale(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (saleInFlight.current || !stock) return;
    const saleBoxes = Number.parseInt(saleBoxesInput, 10);
    if (!Number.isSafeInteger(saleBoxes) || saleBoxes < 1 || saleBoxes > stock.stock) { setNotice(`Informe uma quantidade entre 1 e ${stock.stock}.`); return; }
    saleInFlight.current = true; setSavingSale(true); setNotice("");
    const formElement = e.currentTarget;
    try {
      const payload = Object.fromEntries(new FormData(formElement).entries()); payload.boxes = String(saleBoxes);
      const r = await portalFetch("/api/sales", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const b = await r.json(); if (!r.ok) { setNotice(b.error || "Não foi possível registrar."); return; }
      formElement.reset(); setSaleBoxesInput("1"); setNotice("Venda registrada e estoque atualizado."); await loadReseller();
    } finally { saleInFlight.current = false; setSavingSale(false); }
  }

  async function createReplenishment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (creatingReplenishment) return;
    setCreatingReplenishment(true); setNotice("");
    try {
      const r = await portalFetch("/api/replenishment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kit: replenishKit, shippingType: replenishShipping, paymentMethod: replenishPayment, installments: replenishPayment === "pix" ? 1 : replenishInstallments }) });
      const b = await r.json();
      if (!r.ok || !b.invoiceUrl) { setNotice(b.error || "Não foi possível gerar a reposição."); return; }
      setNotice(`Pedido ${b.orderNumber} criado. Abrindo o pagamento seguro do Asaas…`);
      window.location.href = b.invoiceUrl;
    } finally { setCreatingReplenishment(false); }
  }

  async function registerAdminSale(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (adminSaleInFlight.current || !admin) return;
    const reseller = admin.resellers.find((item) => item.id === adminSaleUserId);
    if (!reseller) { setNotice("Escolha um revendedor."); return; }
    const adminSaleBoxes = Number.parseInt(adminSaleBoxesInput, 10);
    if (!Number.isSafeInteger(adminSaleBoxes) || adminSaleBoxes < 1 || adminSaleBoxes > reseller.stock) { setNotice(`A quantidade deve ficar entre 1 e ${reseller.stock} caixas disponíveis.`); return; }
    adminSaleInFlight.current = true; setSavingAdminSale(true); setNotice("");
    const form = e.currentTarget;
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.userId = adminSaleUserId; payload.boxes = String(adminSaleBoxes);
      const r = await portalFetch("/api/admin/sales", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const b = await r.json(); if (!r.ok) { setNotice(b.error || "Não foi possível registrar a venda pelo BKO."); return; }
      form.reset(); setAdminSaleBoxesInput("1"); setNotice(`Venda registrada pelo BKO. Estoque restante: ${b.remainingStock} caixas.`); await loadAdmin();
    } finally { adminSaleInFlight.current = false; setSavingAdminSale(false); }
  }

  function beginResellerEdit(person:AdminReseller){
    setEditingReseller(person);setEditResellerDraft({name:person.name,email:person.email,phone:person.phone});setNotice("");
  }
  async function saveResellerEdit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!editingReseller||resellerBusy)return;
    setResellerBusy(true);setNotice("");
    try{
      const r=await portalFetch("/api/admin/resellers",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({userId:editingReseller.id,...editResellerDraft})});
      const b=await r.json();if(!r.ok)throw Error(b.error||"Não foi possível salvar o cadastro.");
      setEditingReseller(null);await loadAdmin();setNotice(b.loginChanged?"Dados atualizados. Como o e-mail de login mudou, as sessões do revendedor foram encerradas.":"Cadastro do revendedor atualizado.");
    }catch(error){setNotice(error instanceof Error?error.message:"Não foi possível salvar o cadastro.");}
    finally{setResellerBusy(false)}
  }
  async function loadMaintenancePreview(){
    setMaintenanceLoading(true);setNotice("");
    try{const r=await portalFetch("/api/admin/maintenance",{cache:"no-store"});const b=await r.json();if(!r.ok)throw Error(b.error||"Não foi possível consultar o banco.");setMaintenancePreview(b);}
    catch(error){setNotice(error instanceof Error?error.message:"Prévia indisponível.");}
    finally{setMaintenanceLoading(false)}
  }
  function copyResetCommand(){
    const command="npm run db:reset:test -- --execute --confirm=ZERAR-TESTES --backup=./backups/lord-nutri-antes-reset.jsonl.gz";
    void navigator.clipboard.writeText(command).then(()=>setNotice("Comando copiado. Execute somente no servidor, após simular e conferir o banco alvo."),()=>setNotice("Não foi possível copiar. Selecione o comando mostrado e copie manualmente."));
  }

  async function resellerAccess(person:AdminReseller){
    const activate=person.status!=="active";
    if(!window.confirm(`${activate?"Reativar":"Desativar"} ${person.name}?${activate?"":" As sessões existentes serão encerradas."}`))return;
    setResellerBusy(true);setNotice("");
    try{const r=await portalFetch("/api/admin/resellers",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({userId:person.id,active:activate})});const b=await r.json();
      if(!r.ok)throw Error(b.error||"Falha ao alterar acesso.");await loadAdmin();setNotice(activate?"Revendedor reativado.":"Revendedor desativado; sessões encerradas.");}
    catch(e){setNotice(e instanceof Error?e.message:"Erro.")}finally{setResellerBusy(false)}
  }
  async function resellerDelete(person:AdminReseller){
    const confirmation=window.prompt(`EXCLUSÃO DE TESTE\n\n${person.name} · ${person.email}\n\nSó é possível excluir sem pedidos, estoque, vendas, indicações ou cashback. Para limpar todo o banco de testes, use o script com backup.\n\nDigite EXCLUIR:`);
    if(confirmation!=="EXCLUIR")return;
    setResellerBusy(true);setNotice("");
    try{const r=await portalFetch("/api/admin/resellers",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({userId:person.id,email:person.email,confirm:"EXCLUIR"})});const b=await r.json();
      if(!r.ok)throw Error(b.error||"Falha ao excluir.");setEditingReseller(null);await loadAdmin();setNotice(`Cadastro de ${person.name} excluído.`);}
    catch(e){setNotice(e instanceof Error?e.message:"Erro ao excluir.")}finally{setResellerBusy(false)}
  }
  async function cleanEmptyResellers(){
    if(!admin?.resellers.length)return;
    const confirm=window.prompt("Excluir somente revendedores SEM movimento? Cadastros vinculados a compras, estoque ou cashback serão preservados. Digite ZERAR REVENDEDORES:");
    if(confirm!=="ZERAR REVENDEDORES")return;
    setResellerBusy(true);let deleted=0;const blocked:string[]=[];
    for(const person of admin.resellers){
      const r=await portalFetch("/api/admin/resellers",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({userId:person.id,email:person.email,confirm:"EXCLUIR"})});
      if(r.ok)deleted++;else {const b=await r.json();blocked.push(`${person.name}: ${b.error||"não excluído"}`)}
    }
    await loadAdmin();setNotice(`Limpeza: ${deleted} revendedor(es) vazio(s) removido(s). ${blocked.length} conta(s) com bloqueio. ${blocked.slice(0,4).join(" | ")}`);setResellerBusy(false);
  }

  async function releaseAccess(p: Purchase, action: "release" | "reset-password" = "release") {
    setNotice("");
    const r = await portalFetch("/api/admin/access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purchaseId: p.id, action }) });
    const b = await r.json(); if (!r.ok) { setNotice(b.error || "Não foi possível liberar."); return; }
    if (b.password) setCredentials({ email: b.email, password: b.password, phone: p.phone, name: p.name });
    setNotice(action === "release" ? "Acesso criado. Copie e envie pelo WhatsApp." : "Nova senha provisória gerada."); await loadAdmin();
  }

  async function viewCredentials(p: Purchase) {
    const r = await portalFetch("/api/admin/access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purchaseId: p.id, action: "view-credentials" }) });
    const b = await r.json();
    if (!r.ok) { setNotice(b.error || "Não foi possível consultar o acesso."); return; }
    setCredentials({ email: b.email, password: b.password, phone: p.phone, name: p.name });
    setNotice("Acesso provisório disponível. Não compartilhe senhas em links de WhatsApp ou e-mail.");
  }

  async function approvePayment(p: Purchase) {
    if (!window.confirm(`Consultar o pagamento do pedido ${p.orderNumber} no Asaas? O sistema só confirma após verificar a cobrança.`)) return;
    setNotice("");
    const r = await portalFetch("/api/admin/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ purchaseId: p.id, status: "paid" }) });
    const b = await r.json(); if (!r.ok || !b.updated) { setNotice(b.error || b.message || "O Asaas ainda não confirmou o pagamento."); return; }
    if (b.password) setCredentials({ email: b.email, password: b.password, phone: p.phone, name: p.name });
    setNotice("Pagamento validado no Asaas; consulte o acesso e o estoque atualizados."); await loadAdmin();
  }

  async function confirmManualWelcome(p: Purchase) {
    if (p.paymentStatus !== "paid" || !p.accessReleasedAt || p.welcomeStatus === "sent") return;
    const channel = window.prompt(`Confirma que você ENVIOU as boas-vindas do pedido ${p.orderNumber}? Digite WHATSAPP ou EMAIL. Abrir a conversa não conta como envio.`)?.trim().toLowerCase();
    if (channel !== "whatsapp" && channel !== "email") return;
    const r = await portalFetch("/api/admin/welcome", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purchaseId: p.id, channel, confirm: "CONFIRMO_ENVIO" }) });
    const b = await r.json();
    setNotice(r.ok ? "BKO registrou o envio manual das boas-vindas." : b.error || "Não foi possível registrar o envio.");
    await loadAdmin();
  }

  async function shipping(p: Purchase, status: "separating" | "shipped" | "delivered") {
    let carrier = "", trackingCode = "";
    if (status === "shipped") {
      const carrierInput = window.prompt("Transportadora (ex.: Correios)", p.carrier || "Correios");
      if (carrierInput === null) return;
      const codeInput = window.prompt("Código de rastreio da etiqueta", p.trackingCode || "");
      if (codeInput === null) return;
      carrier = carrierInput.trim();
      trackingCode = codeInput.trim();
      if (/\b(correios|pac|sedex)\b/i.test(carrier) && trackingCode && !/^[a-z]{2}\d{9}[a-z]{2}$/i.test(trackingCode)) {
        setNotice("Confira o código dos Correios. A etiqueta tem duas letras, nove números e duas letras.");
        return;
      }
    }
    const r = await portalFetch("/api/admin/shipping", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ purchaseId: p.id, status, carrier, trackingCode }) });
    const b = await r.json(); if (!r.ok) { setNotice(b.error || "Não foi possível atualizar."); return; }
    setNotice("Expedição atualizada."); await loadAdmin();
  }

  const whatsappHref = useMemo(() => {
    if (!credentials) return null;
    return manualWhatsAppLink({ name: credentials.name, phone: credentials.phone, origin: typeof window !== "undefined" ? window.location.origin : "https://revendedores.mix10pro.com.br" });
  }, [credentials]);

  if (loading) return <main className="portal-loading">Carregando LORD NUTRI…</main>;
  if (!user) return <main className="portal-loading"><div><p role="alert">{notice || "Não foi possível carregar o portal."}</p><button className="primary-button" onClick={() => location.reload()}>Tentar novamente</button><p><Link href="/entrar">Voltar ao acesso</Link></p></div></main>;
  if (user.role === "indicator") return <main className="portal-loading"><Link href="/minhas-indicacoes">Ir para minhas indicações</Link></main>;

  if (user.role === "admin") {
    const activeReseller = admin?.resellers.find((item) => item.id === adminSaleUserId);
    const resellerName = (id: string) => admin?.resellers.find((item) => item.id === id)?.name || "Revendedor";
    const goToAdminTab = (id: AdminTab) => {if(id===adminTab)return;if(studioDirty&&!window.confirm("Sair do Studio e descartar alterações ainda não salvas?"))return;setAdminTab(id);setCredentials(null);if(id==="maintenance")void loadMaintenancePreview();};
    const mainTabs: Array<[AdminTab,string]> = [["overview","Visão Geral"],["indicators","Influenciadores"],["access","Revendedores"],["shipping","Expedição"],["orders","Acessos e Pedidos"],["studio","Studio LP"],["materials","Materiais"],["integrations","Integrações"],["maintenance","Configurações e Auditoria"]];
    const adminSections: Array<[AdminTab,string]> = [...mainTabs,["sales","Vendas do revendedor"],["content","Conteúdo institucional"]];
    const matchingResellers=(admin?.resellers??[]).filter(r=>[r.name,r.email,r.phone].some(value=>(value||"").toLocaleLowerCase("pt-BR").includes(resellerSearch.trim().toLocaleLowerCase("pt-BR"))))
      .sort((a,b)=>resellerSort==="revenue"?b.grossSalesCents-a.grossSalesCents:b.soldBoxes-a.soldBoxes);
    return <PortalFrame role="admin" name={user.name} sections={adminSections.map(([id,label])=>({id,label,onOpen:()=>goToAdminTab(id)}))} active={adminTab} onLogout={logout}><div className="role-detail">
      {adminTab !== "overview" && adminTab !== "indicators" && adminTab !== "access" ? <section className="portal-title"><div><span className="section-kicker">BKO · LORD NUTRI</span><h1>{adminSections.find(([id])=>id===adminTab)?.[1] || "Central de operação"}</h1><p>Operação integrada · indicadores e cadastros reais.</p></div><button type="button" className="ghost-button" onClick={loadAdmin}>↻ Atualizar dados</button></section> : null}
      {adminTab === "integrations" ? <IntegrationCheck/> : null}
      {adminTab === "orders" ? <PaymentSync onUpdated={loadAdmin}/> : null}
      {notice ? <div className="portal-notice">{notice}</div> : null}
      {credentials ? <section className="credential-card"><div><span>Acesso pronto para envio</span><strong>{credentials.email}</strong><code>{credentials.password}</code></div><div><button onClick={()=>navigator.clipboard.writeText(`E-mail: ${credentials.email}\nSenha provisória: ${credentials.password}`)} className="secondary-button">Copiar acesso</button>{whatsappHref ? <a className="primary-button" href={whatsappHref} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a> : null}<small>A mensagem do WhatsApp não inclui a senha; copie os dados de acesso e compartilhe com cuidado, somente com o titular.</small><button className="text-button" onClick={()=>setCredentials(null)}>Fechar</button></div></section> : null}
      {admin ? <>
        {adminTab === "overview" ? <BkoControlDashboard data={admin} onOpenOrders={()=>goToAdminTab("orders")} onOpenShipping={()=>goToAdminTab("shipping")} onOpenInfluencers={()=>goToAdminTab("indicators")} onOpenResellers={()=>goToAdminTab("access")} onRefresh={loadAdmin}/> : null}
        {adminTab === "access" ? <section><div className="pagehead"><div><div className="eyebrow">Rede comercial</div><h1>Revendedores</h1><p>Vendas, estoque e perfis em um só lugar.</p></div><button className="btn primary" onClick={()=>goToAdminTab("sales")}>＋ Registrar venda</button></div>
          <div className="grid four"><PortalMetric label="Revendedores ativos" value={admin.metrics.activeResellers} detail="Contas ativas" icon={<ShoppingBag/>}/><PortalMetric label="Caixas vendidas" value={admin.metrics.boxesSold} detail="Vendas registradas" icon={<ChartNoAxesCombined/>}/><PortalMetric label="Valor vendido" value={money(admin.metrics.grossSalesCents)} detail="Vendas dos revendedores" icon={<Wallet/>}/><PortalMetric label="Caixas em estoque" value={admin.metrics.aggregateStock} detail="Saldo dos revendedores" tone="blue" icon={<ClipboardList/>}/></div>
          <div className="mtlg"><div className="section-title"><div><h2>Ranking de revendedores</h2><p>Consulte o cadastro e gerencie o acesso de cada revendedor.</p></div></div>
          <div className="toolbar"><label className="search"><Search size={16}/><input aria-label="Buscar revendedor" type="search" placeholder="Buscar revendedor…" value={resellerSearch} onChange={e=>setResellerSearch(e.target.value)}/></label><select className="select" aria-label="Ordenar revendedores" value={resellerSort} onChange={e=>setResellerSort(e.target.value)}><option value="revenue">Maior valor</option><option value="sold">Mais caixas vendidas</option></select></div>
          <div className="box tablewrap"><table className="table"><thead><tr><th>Pos.</th><th>Revendedor</th><th>Caixas vendidas</th><th>Valor gerado</th><th>Estoque</th><th>Status</th><th>Cadastro</th></tr></thead>
          <tbody>{matchingResellers.map((r,i)=><tr key={r.id}><td><span className={i<3?"rank top":"rank"}>{i+1}</span></td><td className="namecell">{r.name}<small>{r.email}</small><small>{r.phone}</small></td><td>{r.soldBoxes}</td><td>{money(r.grossSalesCents)}</td><td>{r.stock}</td><td><span className={r.status==="active"?"pill":"pill gray"}>{r.status==="active"?"Ativo":"Inativo"}</span></td><td><button className="btn tiny" disabled={resellerBusy} onClick={()=>{beginResellerEdit(r);requestAnimationFrame(()=>document.getElementById("ln-edit-reseller")?.scrollIntoView({block:"start"}));}}>Editar cadastro</button></td></tr>)}</tbody></table>{!matchingResellers.length&&<p className="empty">Nenhum revendedor encontrado.</p>}</div></div>
          {editingReseller ? <form id="ln-edit-reseller" className="portal-form" onSubmit={saveResellerEdit} style={{marginTop:24,borderTop:"1px solid #ddd",paddingTop:18}}><h3>Editar: {editingReseller.name}</h3><div className="actions"><button type="button" className="btn tiny" disabled={resellerBusy} onClick={()=>{const current=admin.resellers.find(r=>r.id===editingReseller.id);if(current)void resellerAccess(current);}}>{admin.resellers.find(r=>r.id===editingReseller.id)?.status==="active"?"Desativar":"Reativar"}</button><button type="button" className="btn tiny" disabled={resellerBusy} onClick={()=>void resellerDelete(editingReseller)}>Excluir cadastro de teste</button></div><p className="portal-form-help">Altera o cadastro e login, sem reescrever comprovantes ou pedidos antigos. Se mudar o e-mail, o revendedor precisará entrar novamente.</p>
            <label>Nome completo<input required maxLength={120} minLength={2} value={editResellerDraft.name} onChange={e=>setEditResellerDraft(v=>({...v,name:e.target.value}))}/></label>
            <label>E-mail de acesso<input required type="email" maxLength={254} value={editResellerDraft.email} onChange={e=>setEditResellerDraft(v=>({...v,email:e.target.value}))}/></label>
            <label>Telefone com DDD<input required type="tel" minLength={10} maxLength={20} value={editResellerDraft.phone} onChange={e=>setEditResellerDraft(v=>({...v,phone:e.target.value}))}/></label>
            <div className="purchase-actions"><button type="submit" className="primary-button compact" disabled={resellerBusy}>{resellerBusy?"Salvando...":"Salvar cadastro"}</button><button type="button" className="secondary-button compact" onClick={()=>setEditingReseller(null)} disabled={resellerBusy}>Cancelar</button></div>
          </form>:null}
          <div className="box boxpad mtlg"><div className="section-title"><div><h2>Gerenciar revendedores</h2><p>Pedidos e senhas ficam em Acessos e Pedidos.</p></div><button className="btn tiny" disabled={resellerBusy||!admin.resellers.length} onClick={()=>void cleanEmptyResellers()}>Limpar revendedores sem movimento</button></div></div><p className="fine-print">Exclusão individual é bloqueada quando existe compra, perfil de compra, estoque, venda ou cashback. Para zerar também esses pedidos de teste, abra "Manutenção · Zerar testes".</p></section>:null}
        {adminTab === "orders" || adminTab === "shipping" ? <section className="portal-card"><div className="card-title"><h2>{adminTab === "orders" ? "Pedidos e liberação de acessos" : "Compras e expedição"}</h2><span>{admin.purchases.length} registros</span></div><div className="admin-purchase-list">{admin.purchases.map((p)=><article key={p.id} className="purchase-row"><div><span className="status-pill">{p.paymentStatus === "paid" ? "Pagamento confirmado" : p.paymentStatus}</span><h3>{p.name} · {p.kit.toUpperCase()}</h3>{p.trackingCode && <small>Rastreio: {p.trackingCode}</small>}{p.postalEvent && <p>Correios · {p.postalEvent} · {p.postalEventAt?.replace("T"," ")}</p>}{p.postalIssue && <small>{p.postalIssue}</small>}<p>{p.email} · {p.phone} · {p.city}/{p.state}</p><small>{p.orderNumber} · {money(p.totalCents)} · {date(p.createdAt)}</small></div><div className="purchase-actions">{adminTab === "orders" && p.paymentStatus === "paid" && !p.accessReleasedAt ? <button className="primary-button compact" onClick={()=>releaseAccess(p)}>Liberar acesso</button> : adminTab === "orders" && p.accessReleasedAt ? <><button className="secondary-button compact" onClick={()=>viewCredentials(p)}>Ver acesso</button><button className="secondary-button compact" onClick={()=>releaseAccess(p,"reset-password")}>Gerar nova senha</button></> : null}{adminTab === "shipping" && p.paymentStatus === "paid" ? <><button className={p.shippingStatus === "separating" ? "status-action active" : "status-action"} onClick={()=>shipping(p,"separating")}>Em separação</button><button className={p.shippingStatus === "shipped" ? "status-action active" : "status-action"} onClick={()=>shipping(p,"shipped")}>Em percurso</button><button className={p.shippingStatus === "delivered" ? "status-action active" : "status-action"} onClick={()=>shipping(p,"delivered")}>Entregue</button></> : null}{adminTab === "orders" && p.paymentStatus !== "paid" && p.paymentStatus !== "cancelled" ? <button className="secondary-button compact" onClick={()=>approvePayment(p)}>Consultar pagamento no Asaas</button> : null}{adminTab === "orders" && p.paymentStatus === "paid" && p.welcomeStatus !== "not_required" ? <><small>Boas-vindas: {p.welcomeStatus === "sent" ? "envio manual registrado pelo BKO" : p.accessReleasedAt ? "aguardando BKO enviar" : "aguardando criação do acesso"}</small>{p.accessReleasedAt && p.welcomeStatus !== "sent" ? <><a className="primary-button compact" href={manualWhatsAppLink({name:p.name,phone:p.phone,origin:typeof window!=="undefined"?window.location.origin:"https://revendedores.mix10pro.com.br"})||undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!manualWhatsAppLink({name:p.name,phone:p.phone,origin:typeof window!=="undefined"?window.location.origin:"https://revendedores.mix10pro.com.br"})} onClick={e=>{if(!manualWhatsAppLink({name:p.name,phone:p.phone,origin:window.location.origin})){e.preventDefault();setNotice("Confira o número do WhatsApp cadastrado.");}}}>Abrir WhatsApp</a><a className="secondary-button compact" href={manualEmailLink({name:p.name,email:p.email,origin:typeof window!=="undefined"?window.location.origin:"https://revendedores.mix10pro.com.br"})||undefined} onClick={e=>{if(!manualEmailLink({name:p.name,email:p.email,origin:window.location.origin})){e.preventDefault();setNotice("Confira o e-mail cadastrado.");}}}>Abrir e-mail</a><button className="secondary-button compact" onClick={()=>confirmManualWelcome(p)}>Marcar boas-vindas enviadas</button><small>Abra a mensagem, revise e envie. Se precisar, clique em “Gerar nova senha” e compartilhe a senha diretamente com o revendedor. Abrir o link NÃO envia nem confirma entrega.</small></> : null}</> : null}</div></article>)}</div></section> : null}
        {adminTab === "indicators" ? <IndicatorAdmin /> : null}
        {adminTab === "content" ? <ContentStudioAdmin /> : null}
        {adminTab === "materials" ? <ResellerMaterials admin /> : null}
        {adminTab === "studio" ? <LandingTextStudio onDirtyChange={setStudioDirty} /> : null}
        {adminTab === "maintenance" ? <section className="portal-card"><div className="card-title"><div><h2>Manutenção · Zerar dados de teste</h2><p className="portal-form-help">Atenção: ação irreversível sem restauração do backup. Não apaga cobranças no Asaas, e-mails enviados ou dados em serviços externos.</p></div><button type="button" className="secondary-button compact" disabled={maintenanceLoading} onClick={()=>void loadMaintenancePreview()}>{maintenanceLoading?"Consultando…":"Atualizar prévia"}</button></div>
          <p>O painel apresenta a prévia real do banco, mas <strong>não permite zerar pelo navegador</strong>. A execução exige acesso ao servidor e criação de backup obrigatório, para evitar um clique que apague dados em produção.</p>
          {maintenancePreview ? <div style={{margin:"18px 0"}}><h3>Dados atuais — prévia (nenhuma exclusão)</h3><p className="portal-form-help">Consultado em {date(maintenancePreview.generatedAt)}. Contas ADMIN preservadas: {maintenancePreview.usersByRole.admin||0}.</p>
            <div className="simple-table maintenance-counts"><div><strong>Revendedores</strong><span>{maintenancePreview.usersByRole.reseller||0} contas</span></div><div><strong>Influenciadores</strong><span>{maintenancePreview.usersByRole.indicator||0} contas</span></div><div><strong>Pedidos</strong><span>{maintenancePreview.counts.purchases||0} registros</span></div><div><strong>Vendas</strong><span>{maintenancePreview.counts.sales||0} registros</span></div><div><strong>Estoque</strong><span>{maintenancePreview.counts.stock_movements||0} movimentações</span></div><div><strong>Cashback</strong><span>{maintenancePreview.counts.affiliate_cashbacks||0} registros</span></div></div>
          </div> : <p>Para ver quantos cadastros e pedidos existem, clique em "Atualizar prévia".</p>}
          <div style={{padding:16,border:"1px solid #d0bb91",borderRadius:12,marginTop:16}}><h3>Como zerar no servidor</h3><p>1. Pare novas compras e webhooks durante a manutenção. Confira no Asaas se não há pagamentos reais ou pendentes em processamento.</p><p>2. No terminal da Hostinger, na pasta do projeto, execute <code>npm run db:reset:test</code> e confira o host/banco e todas as contagens.</p><p>3. Após conferir que é um ambiente apenas de testes, execute o comando abaixo. Um backup comprimido será salvo antes da exclusão.</p>
          <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",padding:12,background:"#f5f3ed",borderRadius:8}}>npm run db:reset:test -- --execute --confirm=ZERAR-TESTES --backup=./backups/lord-nutri-antes-reset.jsonl.gz</pre><button type="button" className="secondary-button compact" onClick={copyResetCommand}>Copiar comando de limpeza</button><p>4. Guarde o backup fora do servidor e confirme as contagens no BKO. O ADMIN e o conteúdo institucional serão preservados.</p></div>
          <p className="fine-print">Esta área é somente de consulta e orientação. Nunca use o comando em banco com vendas reais. Na Hostinger, mudanças exigem publicar a nova versão do projeto.</p>
        </section>:null}
        {adminTab === "sales" ? <section className="portal-card split-card bko-sales-card"><form onSubmit={registerAdminSale} className="portal-form"><h2>Registrar venda pelo BKO</h2><p className="portal-form-help">Use esta área quando o BKO precisar lançar a quantidade vendida em nome do revendedor.</p><label>Revendedor<select required name="userId" value={adminSaleUserId} onChange={(e)=>{setAdminSaleUserId(e.target.value);setAdminSaleBoxesInput("1");}}><option value="">Selecione</option>{admin.resellers.filter((r)=>r.status==="active").map((r)=><option key={r.id} value={r.id}>{r.name} · estoque {r.stock}</option>)}</select></label><label>Quantidade de caixas<div className="quantity-control"><button type="button" aria-label="Diminuir quantidade" onClick={()=>{const current=Number.parseInt(adminSaleBoxesInput,10)||1;setAdminSaleBoxesInput(String(Math.max(1,current-1)));}}>−</button><input required type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" name="boxes" value={adminSaleBoxesInput} onFocus={(e)=>e.currentTarget.select()} onChange={(e)=>{const clean=e.target.value.replace(/\D/g,"");setAdminSaleBoxesInput(clean);}} onBlur={()=>{const current=Number.parseInt(adminSaleBoxesInput,10);const max=Math.max(activeReseller?.stock||1,1);setAdminSaleBoxesInput(String(Number.isFinite(current)&&current>0?Math.min(current,max):1));}}/><button type="button" aria-label="Aumentar quantidade" onClick={()=>{const current=Number.parseInt(adminSaleBoxesInput,10)||0;const max=Math.max(activeReseller?.stock||1,1);setAdminSaleBoxesInput(String(Math.min(max,current+1)));}}>+</button></div><small>Disponível: {activeReseller?.stock || 0} caixas. Você pode digitar a quantidade diretamente.</small></label><label>Valor por caixa (R$)<input required type="number" min="0" step="0.01" name="unitValue" defaultValue="109.90"/></label><label>Canal<select name="channel" defaultValue="bko"><option value="bko">Lançamento BKO</option><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="presencial">Presencial</option><option value="marketplace">Marketplace</option><option value="other">Outro</option></select></label><label>Cliente (opcional)<input name="customerName"/></label><label>Observações<textarea name="notes" rows={3}/></label><button className="primary-button full" disabled={savingAdminSale || !activeReseller || activeReseller.stock < 1}>{savingAdminSale ? "Registrando…" : "Registrar venda"}</button></form><div><h2>Últimas vendas</h2><div className="sale-list">{admin.sales.slice(0,30).map((s)=><article key={s.id}><div><strong>{s.boxes} caixa{s.boxes>1?"s":""}</strong><span>{resellerName(s.userId)} · {s.customerName || s.channel}</span></div><div><strong>{money(s.totalValueCents)}</strong><span>{date(s.soldAt)}</span></div></article>)}</div></div></section> : null}
      </> : <section className="portal-card portal-retry-card"><h2>BKO temporariamente indisponível</h2><p>{notice || "A conexão com o banco não respondeu. Tente recarregar os dados."}</p><button type="button" className="primary-button" onClick={loadAdmin}>Tentar novamente</button></section>}
    </div></PortalFrame>;
  }

  const selectedKit = replenishment?.kits.find((item)=>item.id===replenishKit) || null;
  const selectedShipping = selectedKit?.shipping.find((item)=>item.id===replenishShipping) || selectedKit?.shipping[0] || null;
  const selectedInstallment = replenishPayment === "pix" ? selectedShipping?.installments[0] : selectedShipping?.installments.find((item)=>item.installments===replenishInstallments);

  const resellerTabs: Array<[View,string]> = [["overview","Visão Geral"],["manual","Manual do Revendedor"],["stock","Estoque"],["sales","Vendas"],["delivery","Meus Pedidos"],["referrals","Indicações"]];
  return <PortalFrame role="reseller" name={user.name} sections={resellerTabs.map(([id,label])=>({id,label,onOpen:()=>setView(id)}))} active={view} onLogout={logout}><section className="role-detail">
    {notice ? <div className="portal-notice">{notice}</div> : null}
    {view === "welcome" ? <><PortalTitle title="Boas Vindas" text="Comece sua jornada com a LORD NUTRI."/><section className="portal-welcome-grid"><div className="portal-card welcome-copy"><span className="section-kicker">PROGRAMA DE REVENDEDORES LORD NUTRI</span><h2>Seu portal está pronto para acompanhar sua operação.</h2><p>Aqui você encontra visão geral, Manual do Revendedor, estoque, vendas e acompanhamento de pedidos em um único ambiente.</p><button className="primary-button" onClick={()=>setView("overview")}>Ir para Visão Geral</button></div><WelcomeVideo sourceUrl={welcomeVideoUrl} embedUrl={embedUrl} videoUrl={videoUrl}/></section></> : null}
    {view === "overview" && stock ? <>
      <div className="pagehead"><div><div className="eyebrow">Seu negócio em movimento</div><h1>Visão Geral</h1><p>Tudo o que você precisa acompanhar no dia a dia.</p></div></div>
      <div className="box hero"><div className="herotext"><div className="tinylabel">PORTAL DO REVENDEDOR · LORD NUTRI</div><h2>Olá, {user.name.trim().split(/\s+/)[0] || "revendedor"}! 👋</h2><p>Seu estoque, suas vendas e seus pedidos em um único lugar.</p><button type="button" className="btn gold mt" onClick={()=>setView("sales")}>＋ Registrar venda</button></div><div className="hero-side"><strong>{stock.stock}</strong><span>caixas disponíveis</span></div></div>
      <div className="grid four mt">
        <PortalMetric label="Estoque atual" value={stock.stock+" caixas"} detail="Disponíveis para venda" icon={<ShoppingBag/>}/>
        <PortalMetric label="Caixas vendidas" value={stock.soldBoxes} detail="Vendas registradas" icon={<ChartNoAxesCombined/>}/>
        <PortalMetric label="Vendas registradas" value={money(stock.grossSalesCents)} detail="Valor acumulado" icon={<Wallet/>}/>
        <PortalMetric label="Pedidos" value={shipments.length} detail="Kits do seu cadastro" icon={<ClipboardList/>} tone="blue"/>
      </div>
      <div className="section-title mtlg"><div><h2>Acesso rápido</h2><p>As ações mais usadas no portal</p></div></div>
      <div className="portal-action-grid">{([
        ["stock","Estoque","Saldo, movimentações e reposição",ShoppingBag],
        ["sales","Vendas","Registre caixas vendidas",ChartNoAxesCombined],
        ["delivery","Pedidos","Acompanhe entrega e rastreio",Truck]
      ] as const).map(([id,title,description,Icon])=><button className="portal-action" key={id} onClick={()=>setView(id)}><span className="picon"><Icon size={20}/></span><div><b>{title}</b><span>{description}</span></div></button>)}</div>
      <div className="portal-split mtlg"><div><DeliveryCards shipments={shipments.slice(0,1)}/></div><div className="box boxpad"><div className="section-title"><div><h2>Últimas vendas</h2><p>Movimentações registradas</p></div><button className="btn tiny" onClick={()=>setView("sales")}>Ver todas</button></div>{stock.sales.slice(0,3).map(s=><div className="portal-item" key={s.id}><div><b>{s.customerName||s.channel}</b><small>{s.boxes} caixa(s) · {date(s.soldAt)}</small></div><span className="amount">{money(s.totalValueCents)}</span></div>)}{!stock.sales.length&&<p className="muted">Nenhuma venda registrada.</p>}</div></div>
    </> : null}
    {view === "manual" ? <><PortalTitle title="Manual do Revendedor" text="Seu material de apoio LORD NUTRI + MIX10 PRO."/><section className="portal-card resource-card manual-resource"><img src="/brand/mix10-box.png" alt="MIX10 PRO"/><div><h2>Conheça a LORD NUTRI, o modelo de negócio e o MIX10 PRO</h2><p>Manual do Revendedor LORD NUTRI (18 páginas), com produto, atendimento, abordagem e pós-venda.</p><a className="primary-button" href={manualUrl} target="_blank" rel="noopener noreferrer">Abrir Manual do Revendedor</a><p className="fine-print">O PDF completo fica disponível abaixo para consulta dentro do portal. Apenas revendedores autorizados e o BKO podem acessá-lo.</p></div></section><MarketingFolder/><ResellerMaterials/><section className="portal-card embedded-manual"><iframe src={`${manualUrl}#view=FitH`} title="Manual do Revendedor LORD NUTRI"/></section></> : null}
    {view === "stock" && stock ? <><PortalTitle title="Estoque" text="Entradas, saídas e reposição do seu estoque."/><section className="metric-grid reseller"><Metric title="Disponível" value={`${stock.stock} caixas`}/><Metric title="Vendidas" value={`${stock.soldBoxes} caixas`}/></section><section id="reposicao" className="portal-card replenishment-card"><div className="card-title"><div><span className="section-kicker">REPOSIÇÃO</span><h2>Repor estoque pelo Asaas</h2></div><span>CEP {replenishment?.postalCode || "-"}</span></div>{replenishment ? <form className="replenishment-form" onSubmit={createReplenishment}><label>Kit<select value={replenishKit} onChange={(e)=>{setReplenishKit(e.target.value as "kit20"|"kit50"|"kit100");setReplenishShipping("economical");setReplenishInstallments(1);}}>{replenishment.kits.map((kit)=><option value={kit.id} key={kit.id}>{kit.label} · {kit.boxes} caixas · {money(kit.productTotalCents)}</option>)}</select></label><label>Frete<select value={replenishShipping} onChange={(e)=>{setReplenishShipping(e.target.value as "economical"|"express");setReplenishInstallments(1);}}>{selectedKit?.shipping.map((option)=><option value={option.id} key={option.id}>{option.label} · {money(option.priceCents)} · {option.deliveryTime}</option>)}</select></label><label>Pagamento<select value={replenishPayment} onChange={(e)=>{const value=e.target.value as "pix"|"credit";setReplenishPayment(value);setReplenishInstallments(1);}}><option value="pix">PIX</option><option value="credit">Cartão</option></select></label>{replenishPayment === "credit" ? <label>Parcelas<select value={replenishInstallments} onChange={(e)=>setReplenishInstallments(Number(e.target.value))}>{selectedShipping?.installments.map((option)=><option value={option.installments} key={option.installments}>{option.installments}x de {money(option.installmentValueCents)}{option.hasInterest?` · total ${money(option.chargedValueCents)}`:" sem juros"}</option>)}</select></label> : null}<div className="replenishment-summary"><span>Produtos <strong>{selectedKit?money(selectedKit.productTotalCents):"-"}</strong></span><span>Frete <strong>{selectedShipping?money(selectedShipping.priceCents):"-"}</strong></span><span>Total <strong>{selectedInstallment?money(selectedInstallment.chargedValueCents):"-"}</strong></span></div><button className="primary-button" disabled={creatingReplenishment}>{creatingReplenishment?"Gerando pagamento…":"Repor estoque e ir para o Asaas"}</button></form> : <p>Não foi possível carregar as opções de reposição. Atualize a página ou fale com o BKO.</p>}</section><section className="portal-card"><div className="card-title"><h2>Movimentações</h2><button className="ghost-button" onClick={loadReseller}>Atualizar saldo</button></div><div className="simple-table movements">{stock.movements.map((m)=><div key={m.id}><strong>{m.type === "entry" ? "Entrada" : m.type === "sale" ? "Venda" : m.type}</strong><span>{m.boxes} caixas</span><span>{m.notes}</span><span>{date(m.occurredAt)}</span></div>)}</div></section></> : null}
    {view === "sales" && stock ? <><PortalTitle title="Vendas" text="Informe a quantidade de caixas vendidas. O estoque é atualizado automaticamente."/><section className="portal-card split-card"><form onSubmit={registerSale} className="portal-form"><h2>Registrar venda</h2>{stock.stock > 0 ? <><label>Quantidade de caixas<div className="quantity-control"><button type="button" aria-label="Diminuir quantidade" onClick={()=>{const current=Number.parseInt(saleBoxesInput,10)||1;setSaleBoxesInput(String(Math.max(1,current-1)));}}>−</button><input required type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" name="boxes" value={saleBoxesInput} onFocus={(e)=>e.currentTarget.select()} onChange={(e)=>{const clean=e.target.value.replace(/\D/g,"");setSaleBoxesInput(clean);}} onBlur={()=>{const current=Number.parseInt(saleBoxesInput,10);setSaleBoxesInput(String(Number.isFinite(current)&&current>0?Math.min(current,stock.stock):1));}}/><button type="button" aria-label="Aumentar quantidade" onClick={()=>{const current=Number.parseInt(saleBoxesInput,10)||0;setSaleBoxesInput(String(Math.min(stock.stock,current+1)));}}>+</button></div><small>Você tem {stock.stock} caixas disponíveis. Digite a quantidade ou use + e −.</small></label><label>Valor por caixa (R$)<input required type="number" min="0" step="0.01" name="unitValue" defaultValue="109.90"/></label><label>Canal<select name="channel" defaultValue="whatsapp"><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="presencial">Presencial</option><option value="marketplace">Marketplace</option><option value="other">Outro</option></select></label><label>Cliente (opcional)<input name="customerName"/></label><label>Observações<textarea name="notes" rows={3}/></label><button className="primary-button full" disabled={savingSale}>{savingSale ? "Registrando…" : `Registrar ${Number.parseInt(saleBoxesInput,10)||0} caixa${(Number.parseInt(saleBoxesInput,10)||0)!==1?"s":""}`}</button></> : <div className="empty-stock"><strong>Seu estoque está zerado.</strong><p>Faça uma reposição para continuar registrando vendas. O pedido será gerado no Asaas e o estoque entra automaticamente após a confirmação do pagamento.</p><button type="button" className="primary-button" onClick={()=>setView("stock")}>Repor estoque</button><button type="button" className="ghost-button" onClick={loadReseller}>Atualizar saldo</button></div>}</form><div><h2>Últimas vendas</h2><div className="sale-list">{stock.sales.map((s)=><article key={s.id}><div><strong>{s.boxes} caixa{s.boxes>1?"s":""}</strong><span>{s.customerName || s.channel}</span></div><div><strong>{money(s.totalValueCents)}</strong><span>{date(s.soldAt)}</span></div></article>)}</div></div></section></> : null}
    {view === "delivery" ? <><PortalTitle title="Acompanhe seu Pedido" text="Da confirmação do pagamento até a entrega do seu estoque."/><button className="ghost-button" onClick={loadReseller}>Atualizar acompanhamento</button><DeliveryCards shipments={shipments}/></> : null}
    {view === "referrals" ? <><PortalTitle title="Indicações" text="Seus contatos e links individuais, separados dos demais revendedores e influenciadores."/>
      <section className="lord-reseller-referrals-layout"><form className="portal-card portal-form" onSubmit={createReferral}><span className="section-kicker">INDICAÇÃO INDIVIDUAL</span><h2>Gerar novo link</h2><p>Informe um contato para gerar um link exclusivo. A criação do link não significa venda nem cashback confirmado.</p><label>Nome do contato<input required name="customerName" minLength={2} maxLength={120} placeholder="Nome do cliente"/></label><label>WhatsApp com DDD<input required name="whatsapp" inputMode="tel" placeholder="11999999999"/></label><button type="submit" className="primary-button" disabled={referralBusy}>{referralBusy?"Gerando…":"Gerar link de indicação"}</button></form>
      <section className="portal-card"><div className="card-title"><div><span className="section-kicker">SEUS LINKS</span><h2>Indicações registradas</h2></div><button type="button" className="secondary-button compact" onClick={()=>void loadReferrals()}>Atualizar</button></div>{referrals.length?<div className="lord-reseller-referral-items">{referrals.map(r=><article key={r.id}><strong>{r.customerName}</strong><small>{r.clickCount} acesso(s) · criado em {date(r.createdAt)}</small><p title={r.link}>{r.link}</p><div className="crm-actions"><button className="secondary-button compact" type="button" onClick={()=>void navigator.clipboard.writeText(r.link).then(()=>setNotice("Link copiado.")).catch(()=>setNotice("Não foi possível copiar."))}>Copiar link</button><a className="secondary-button compact" href={`https://wa.me/?text=${encodeURIComponent(`Conheça a LORD NUTRI: ${r.link}`)}`} rel="noopener noreferrer" target="_blank">Compartilhar</a></div></article>)}</div>:<p>Você ainda não gerou nenhum link de indicação.</p>}</section></section></>:null}
  </section></PortalFrame>;
}

function Metric({ title, value }: { title: string; value: string }) { return <article className="metric-card"><span>{title}</span><strong>{value}</strong></article>; }
function PortalTitle({ title, text }: { title: string; text: string }) { return <section className="portal-title"><div><span className="section-kicker">LORD NUTRI</span><h1>{title}</h1><p>{text}</p></div></section>; }
function DeliveryCards({ shipments }: { shipments: Shipment[] }) {
  return <section className="delivery-list">{shipments.length ? shipments.map((p)=>{
    const progress=deliveryProgress(p.paymentStatus,p.shippingStatus);
    const pending=p.paymentStatus!=="paid"&&p.paymentStatus!=="cancelled";
    return <article className="portal-card delivery-card" key={p.id}>
      <div className="card-title"><h2>{p.kit.toUpperCase()} · {p.boxes} caixas</h2><span>{p.orderNumber}</span></div>
      <span className="status-pill">{pending?"Aguardando pagamento":progress.label}</span>
      {p.totalCents?<p className="delivery-total">Total: <strong>{money(p.totalCents)}</strong>{p.installments&&p.installments>1?` · ${p.installments}x`:""}</p>:null}
      {pending&&p.asaasInvoiceUrl?<a className="primary-button compact" href={p.asaasInvoiceUrl} target="_blank" rel="noopener noreferrer">Continuar pagamento no Asaas</a>:null}
      <ol className="delivery-steps" aria-label="Etapas da entrega">{["Separação","Em percurso","Entregue"].map((label,i)=><li key={label} className={!pending&&progress.step>=i?"complete":""} aria-current={!pending&&progress.step===i?"step":undefined}><b>{!pending&&progress.step>=i?"✓":i+1}</b><span>{label}</span></li>)}</ol>
      {p.postalEvent && <p><strong>Correios</strong> · {p.postalEvent}<br/><small>Evento em {p.postalEventAt?.replace("T"," ")} · Consulta em {p.postalCheckedAt && date(p.postalCheckedAt)}</small></p>}
      {p.carrier?<p>Transportadora: <strong>{p.carrier}</strong></p>:null}
      {p.trackingCode?<p>Rastreio: <strong>{p.trackingCode}</strong> {p.carrier?.toLowerCase().includes("correios")?<a href="https://rastreamento.correios.com.br/app/index.php" target="_blank" rel="noopener noreferrer" className="delivery-tracking-link">Consultar no site dos Correios ↗</a>:null}</p>:null}
      <small>Pedido realizado em {date(p.createdAt)}</small>
      {p.updatedAt?<small className="delivery-last-update">Última atualização registrada no CRM: {date(p.updatedAt)}</small>:<small className="delivery-last-update">Sem data de atualização da transportadora disponível.</small>}
    </article>;
  }) : <section className="portal-card"><h2>Seus pedidos aparecerão aqui</h2><p>Assim que você gerar uma compra ou reposição, poderá acompanhar pagamento e entrega nesta área.</p></section>}</section>;
}
