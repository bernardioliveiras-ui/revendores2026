"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { WelcomeVideo } from "@/components/welcome-video";
import { deliveryProgress } from "@/lib/delivery-progress";

type SessionUser = { id: string; email: string; name: string; role: "admin" | "reseller"; mustChangePassword: boolean };
type StockData = { stock: number; soldBoxes: number; grossSalesCents: number; movements: Array<{ id: string; type: string; boxes: number; notes: string; occurredAt: string }>; sales: Array<{ id: string; boxes: number; unitValueCents: number; totalValueCents: number; channel: string; customerName: string; soldAt: string }> };
type Purchase = { id: string; orderNumber: string; name: string; email: string; phone: string; cpfCnpj: string; kit: string; boxes: number; totalCents: number; paymentStatus: string; shippingStatus: string; carrier?: string | null; trackingCode?: string | null; street: string; number: string; complement: string; district: string; city: string; state: string; postalCode: string; accessReleasedAt?: string | null; userId?: string | null; createdAt: string; welcomeStatus?: string };
type AdminReseller = { id: string; name: string; email: string; phone: string; status: string; createdAt: string; stock: number; soldBoxes: number; grossSalesCents: number };
type AdminSale = { id: string; userId: string; boxes: number; unitValueCents: number; totalValueCents: number; channel: string; customerName: string; soldAt: string };
type AdminData = { metrics: { activeResellers: number; paidPurchases: number; pendingAccess: number; kitRevenueCents: number; boxesSold: number; grossSalesCents: number; aggregateStock: number; affiliateLinks: number; affiliateClicks: number }; purchases: Purchase[]; resellers: AdminReseller[]; sales: AdminSale[] };
type View = "overview" | "stock" | "sales" | "manual" | "welcome" | "delivery";
type AdminTab = "overview" | "access" | "shipping" | "sales";
type Shipment = { id: string; orderNumber: string; kit: string; boxes: number; paymentStatus: string; shippingStatus: string; carrier?: string | null; trackingCode?: string | null; createdAt: string };

const money = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (v: string) => new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

async function portalFetch(url: string, init: RequestInit = {}) {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(25000) });
    const body = await response.json().catch(() => ({ error: "O servidor não respondeu corretamente. Tente novamente." }));
    return { ok: response.ok, status: response.status, json: async () => body };
  } catch {
    return { ok: false, status: 503, json: async () => ({ error: "Não foi possível conectar. Confira sua conexão e tente novamente." }) };
  }
}

export function PortalClient({ embedUrl = "", videoUrl = "", manualUrl = "/manual/MANUAL-DO-REVENDEDOR-LORDNUTRI-MIX10PRO.pdf" }: { embedUrl?: string; videoUrl?: string; manualUrl?: string }) {
  const saleInFlight = useRef(false);
  const adminSaleInFlight = useRef(false);
  const [savingSale, setSavingSale] = useState(false);
  const [savingAdminSale, setSavingAdminSale] = useState(false);
  const [saleBoxesInput, setSaleBoxesInput] = useState("1");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("welcome");
  const [stock, setStock] = useState<StockData | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [adminTab, setAdminTab] = useState<AdminTab>("overview");
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [notice, setNotice] = useState("");
  const [credentials, setCredentials] = useState<{ email: string; password: string; phone: string } | null>(null);
  const [adminSaleUserId, setAdminSaleUserId] = useState("");
  const [adminSaleBoxesInput, setAdminSaleBoxesInput] = useState("1");

  const loadReseller = useCallback(async () => {
    const [a, b] = await Promise.all([portalFetch("/api/stock", { cache: "no-store" }), portalFetch("/api/my-purchases", { cache: "no-store" })]);
    if (a.status === 401 || b.status === 401) { location.href = "/entrar"; return; }
    const sa = await a.json(); const rb = await b.json();
    if (a.ok) {
      setStock(sa);
      setSaleBoxesInput((current) => {
        const parsed = Number.parseInt(current, 10);
        if (!Number.isFinite(parsed) || parsed < 1) return "1";
        return String(Math.min(parsed, Math.max(sa.stock, 1)));
      });
    } else setNotice(sa.error || "Não foi possível carregar o estoque.");
    if (b.ok) setShipments(rb.purchases || []); else setNotice(rb.error || "Não foi possível carregar os pedidos.");
  }, []);

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

  async function releaseAccess(p: Purchase, action: "release" | "reset-password" = "release") {
    setNotice("");
    const r = await portalFetch("/api/admin/access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purchaseId: p.id, action }) });
    const b = await r.json(); if (!r.ok) { setNotice(b.error || "Não foi possível liberar."); return; }
    if (b.password) setCredentials({ email: b.email, password: b.password, phone: p.phone });
    setNotice(action === "release" ? "Acesso criado. Copie e envie pelo WhatsApp." : "Nova senha provisória gerada."); await loadAdmin();
  }

  async function approvePayment(p: Purchase) {
    if (!window.confirm(`Confirmar manualmente o pagamento de ${p.orderNumber}? Faça isso somente após conferir o recebimento.`)) return;
    setNotice("");
    const r = await portalFetch("/api/admin/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ purchaseId: p.id, status: "paid" }) });
    const b = await r.json(); if (!r.ok) { setNotice(b.error || "Não foi possível aprovar."); return; }
    if (b.password) setCredentials({ email: b.email, password: b.password, phone: p.phone });
    setNotice("Pagamento confirmado, acesso e estoque atualizados."); await loadAdmin();
  }

  async function welcome(p: Purchase) {
    const r = await portalFetch("/api/admin/welcome", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purchaseId: p.id }) });
    const b = await r.json();
    setNotice(r.ok ? "Boas-vindas encaminhadas à automação de e-mail e WhatsApp." : b.reason === "not_configured" ? "Configure a automação de boas-vindas. O acesso pode ser enviado manualmente pelo BKO." : b.reason === "manual_access_required" ? "Gere uma nova senha para preparar o envio das boas-vindas." : b.error || "Não foi possível enviar.");
    await loadAdmin();
  }

  async function shipping(p: Purchase, status: "separating" | "shipped" | "delivered") {
    let carrier = "", trackingCode = "";
    if (status === "shipped") { carrier = window.prompt("Transportadora (opcional):", p.carrier || "") || ""; trackingCode = window.prompt("Código de rastreio (opcional):", p.trackingCode || "") || ""; }
    const r = await portalFetch("/api/admin/shipping", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ purchaseId: p.id, status, carrier, trackingCode }) });
    const b = await r.json(); if (!r.ok) { setNotice(b.error || "Não foi possível atualizar."); return; }
    setNotice("Expedição atualizada."); await loadAdmin();
  }

  const whatsappHref = useMemo(() => {
    if (!credentials) return "#";
    const rawPhone = credentials.phone.replace(/\D/g, ""); const phone = rawPhone.length <= 11 ? `55${rawPhone}` : rawPhone;
    const text = `Olá! Seu acesso ao portal LORD NUTRI foi liberado.\n\nE-mail: ${credentials.email}\nSenha provisória: ${credentials.password}\nPortal: ${location.origin}/entrar\n\nNo primeiro acesso você deverá criar uma nova senha.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [credentials]);

  if (loading) return <main className="portal-loading">Carregando LORD NUTRI…</main>;
  if (!user) return <main className="portal-loading"><div><p role="alert">{notice || "Não foi possível carregar o portal."}</p><button className="primary-button" onClick={() => location.reload()}>Tentar novamente</button><p><Link href="/entrar">Voltar ao acesso</Link></p></div></main>;

  if (user.role === "admin") {
    const activeReseller = admin?.resellers.find((item) => item.id === adminSaleUserId);
    const resellerName = (id: string) => admin?.resellers.find((item) => item.id === id)?.name || "Revendedor";
    return <main className="portal-shell"><PortalHeader user={user} onLogout={logout}/><div className="portal-body admin-only">
      <section className="portal-title"><div><span className="section-kicker">BKO LORD NUTRI</span><h1>Central de operação</h1><p>Pagamentos, acessos, expedição, vendas e métricas gerais.</p></div><button className="ghost-button" onClick={loadAdmin}>Atualizar</button></section>
      <nav className="bko-tabs" aria-label="Áreas do BKO">{([ ["overview","Visão geral"], ["access","Acessos"], ["shipping","Expedição"], ["sales","Vendas"] ] as Array<[AdminTab,string]>).map(([id,label]) => <button key={id} className={adminTab===id?"active":""} onClick={()=>{setAdminTab(id);setCredentials(null);}}>{label}</button>)}</nav>
      {notice ? <div className="portal-notice">{notice}</div> : null}
      {credentials ? <section className="credential-card"><div><span>Acesso pronto para envio</span><strong>{credentials.email}</strong><code>{credentials.password}</code></div><div><button onClick={()=>navigator.clipboard.writeText(`E-mail: ${credentials.email}\nSenha provisória: ${credentials.password}`)} className="secondary-button">Copiar acesso</button><a className="primary-button" href={whatsappHref} target="_blank">Abrir WhatsApp</a><button className="text-button" onClick={()=>setCredentials(null)}>Fechar</button></div></section> : null}
      {admin ? <>
        {adminTab === "overview" ? <><section className="metric-grid"><Metric title="Revendedores ativos" value={String(admin.metrics.activeResellers)}/><Metric title="Compras pagas" value={String(admin.metrics.paidPurchases)}/><Metric title="Aguardando acesso" value={String(admin.metrics.pendingAccess)}/><Metric title="Receita de kits" value={money(admin.metrics.kitRevenueCents)}/><Metric title="Caixas vendidas" value={String(admin.metrics.boxesSold)}/><Metric title="Estoque em mãos" value={String(admin.metrics.aggregateStock)}/></section><section className="portal-card"><div className="card-title"><h2>Revendedores</h2><span>{admin.resellers.length}</span></div><div className="simple-table admin-reseller-table">{admin.resellers.map((r)=><div key={r.id}><strong>{r.name}</strong><span>{r.email}</span><span>Estoque: {r.stock}</span><span>Vendidas: {r.soldBoxes}</span></div>)}</div></section></> : null}
        {adminTab === "access" || adminTab === "shipping" ? <section className="portal-card"><div className="card-title"><h2>{adminTab === "access" ? "Acessos dos revendedores" : "Compras e expedição"}</h2><span>{admin.purchases.length} registros</span></div><div className="admin-purchase-list">{admin.purchases.map((p)=><article key={p.id} className="purchase-row"><div><span className="status-pill">{p.paymentStatus === "paid" ? "Pagamento confirmado" : p.paymentStatus}</span><h3>{p.name} · {p.kit.toUpperCase()}</h3><p>{p.email} · {p.phone} · {p.city}/{p.state}</p><small>{p.orderNumber} · {money(p.totalCents)} · {date(p.createdAt)}</small></div><div className="purchase-actions">{adminTab === "access" && p.paymentStatus === "paid" && !p.accessReleasedAt ? <button className="primary-button compact" onClick={()=>releaseAccess(p)}>Liberar acesso</button> : adminTab === "access" && p.accessReleasedAt ? <button className="secondary-button compact" onClick={()=>releaseAccess(p,"reset-password")}>Gerar nova senha</button> : null}{adminTab === "shipping" && p.paymentStatus === "paid" ? <><button className={p.shippingStatus === "separating" ? "status-action active" : "status-action"} onClick={()=>shipping(p,"separating")}>Em separação</button><button className={p.shippingStatus === "shipped" ? "status-action active" : "status-action"} onClick={()=>shipping(p,"shipped")}>Em percurso</button><button className={p.shippingStatus === "delivered" ? "status-action active" : "status-action"} onClick={()=>shipping(p,"delivered")}>Entregue</button></> : null}{adminTab === "access" && p.paymentStatus !== "paid" && p.paymentStatus !== "cancelled" ? <button className="secondary-button compact" onClick={()=>approvePayment(p)}>Confirmar pagamento manual</button> : null}{adminTab === "access" && p.paymentStatus === "paid" ? <><small>Boas-vindas: {p.welcomeStatus === "sent" ? "enviadas" : "pendentes"}</small><button className="secondary-button compact" onClick={()=>welcome(p)}>Enviar boas-vindas</button></> : null}</div></article>)}</div></section> : null}
        {adminTab === "sales" ? <section className="portal-card split-card bko-sales-card"><form onSubmit={registerAdminSale} className="portal-form"><h2>Registrar venda pelo BKO</h2><p className="portal-form-help">Use esta área quando o BKO precisar lançar a quantidade vendida em nome do revendedor.</p><label>Revendedor<select required name="userId" value={adminSaleUserId} onChange={(e)=>{setAdminSaleUserId(e.target.value);setAdminSaleBoxesInput("1");}}><option value="">Selecione</option>{admin.resellers.filter((r)=>r.status==="active").map((r)=><option key={r.id} value={r.id}>{r.name} · estoque {r.stock}</option>)}</select></label><label>Quantidade de caixas<div className="quantity-control"><button type="button" aria-label="Diminuir quantidade" onClick={()=>{const current=Number.parseInt(adminSaleBoxesInput,10)||1;setAdminSaleBoxesInput(String(Math.max(1,current-1)));}}>−</button><input required type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" name="boxes" value={adminSaleBoxesInput} onFocus={(e)=>e.currentTarget.select()} onChange={(e)=>{const clean=e.target.value.replace(/\D/g,"");setAdminSaleBoxesInput(clean);}} onBlur={()=>{const current=Number.parseInt(adminSaleBoxesInput,10);const max=Math.max(activeReseller?.stock||1,1);setAdminSaleBoxesInput(String(Number.isFinite(current)&&current>0?Math.min(current,max):1));}}/><button type="button" aria-label="Aumentar quantidade" onClick={()=>{const current=Number.parseInt(adminSaleBoxesInput,10)||0;const max=Math.max(activeReseller?.stock||1,1);setAdminSaleBoxesInput(String(Math.min(max,current+1)));}}>+</button></div><small>Disponível: {activeReseller?.stock || 0} caixas. Você pode digitar a quantidade diretamente.</small></label><label>Valor por caixa (R$)<input required type="number" min="0" step="0.01" name="unitValue" defaultValue="109.90"/></label><label>Canal<select name="channel" defaultValue="bko"><option value="bko">Lançamento BKO</option><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="presencial">Presencial</option><option value="marketplace">Marketplace</option><option value="other">Outro</option></select></label><label>Cliente (opcional)<input name="customerName"/></label><label>Observações<textarea name="notes" rows={3}/></label><button className="primary-button full" disabled={savingAdminSale || !activeReseller || activeReseller.stock < 1}>{savingAdminSale ? "Registrando…" : "Registrar venda"}</button></form><div><h2>Últimas vendas</h2><div className="sale-list">{admin.sales.slice(0,30).map((s)=><article key={s.id}><div><strong>{s.boxes} caixa{s.boxes>1?"s":""}</strong><span>{resellerName(s.userId)} · {s.customerName || s.channel}</span></div><div><strong>{money(s.totalValueCents)}</strong><span>{date(s.soldAt)}</span></div></article>)}</div></div></section> : null}
      </> : <section className="portal-card portal-retry-card"><h2>BKO temporariamente indisponível</h2><p>{notice || "A conexão com o banco não respondeu. Tente recarregar os dados."}</p><button type="button" className="primary-button" onClick={loadAdmin}>Tentar novamente</button></section>}
    </div></main>;
  }

  return <main className="portal-shell"><PortalHeader user={user} onLogout={logout}/><div className="portal-layout"><aside className="portal-sidebar"><div className="side-brand"><span>LORD NUTRI</span><strong>MIX10 PRO</strong></div><nav aria-label="Áreas do revendedor">{([ ["welcome","Boas-vindas"], ["manual","Manual do revendedor"], ["overview","Visão geral"], ["delivery","Acompanhe seu pedido"], ["stock","Estoque"], ["sales","Vendas"] ] as Array<[View,string]>).map(([id,label])=><button key={id} onClick={()=>setView(id)} aria-current={view===id?"page":undefined} className={view===id?"active":""}>{label}</button>)}</nav></aside><section className="portal-content">
    {notice ? <div className="portal-notice">{notice}</div> : null}
    {view === "overview" && stock ? <><section className="portal-title"><div><span className="section-kicker">Olá, {user.name}</span><h1>Visão geral</h1><p>Acompanhe sua operação sem complicação.</p></div></section><section className="metric-grid reseller"><Metric title="Estoque atual" value={`${stock.stock} caixas`}/><Metric title="Caixas vendidas" value={String(stock.soldBoxes)}/><Metric title="Vendas registradas" value={money(stock.grossSalesCents)}/><Metric title="Pedidos" value={String(shipments.length)}/><Metric title="Em percurso" value={String(shipments.filter((p)=>p.shippingStatus==="shipped").length)}/></section><DeliveryCards shipments={shipments}/></> : null}
    {view === "stock" && stock ? <><PortalTitle title="Estoque" text="Entradas e saídas do seu estoque."/><section className="metric-grid reseller"><Metric title="Disponível" value={`${stock.stock} caixas`}/><Metric title="Vendidas" value={`${stock.soldBoxes} caixas`}/></section><section className="portal-card"><div className="card-title"><h2>Movimentações</h2></div><div className="simple-table movements">{stock.movements.map((m)=><div key={m.id}><strong>{m.type === "entry" ? "Entrada" : m.type === "sale" ? "Venda" : m.type}</strong><span>{m.boxes} caixas</span><span>{m.notes}</span><span>{date(m.occurredAt)}</span></div>)}</div></section></> : null}
    {view === "sales" && stock ? <><PortalTitle title="Vendas" text="Informe a quantidade de caixas vendidas. O estoque é atualizado automaticamente."/><section className="portal-card split-card"><form onSubmit={registerSale} className="portal-form"><h2>Registrar venda</h2>{stock.stock > 0 ? <><label>Quantidade de caixas<div className="quantity-control"><button type="button" aria-label="Diminuir quantidade" onClick={()=>{const current=Number.parseInt(saleBoxesInput,10)||1;setSaleBoxesInput(String(Math.max(1,current-1)));}}>−</button><input required type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" name="boxes" value={saleBoxesInput} onFocus={(e)=>e.currentTarget.select()} onChange={(e)=>{const clean=e.target.value.replace(/\D/g,"");setSaleBoxesInput(clean);}} onBlur={()=>{const current=Number.parseInt(saleBoxesInput,10);setSaleBoxesInput(String(Number.isFinite(current)&&current>0?Math.min(current,stock.stock):1));}}/><button type="button" aria-label="Aumentar quantidade" onClick={()=>{const current=Number.parseInt(saleBoxesInput,10)||0;setSaleBoxesInput(String(Math.min(stock.stock,current+1)));}}>+</button></div><small>Você tem {stock.stock} caixas disponíveis. Digite a quantidade ou use + e −.</small></label><label>Valor por caixa (R$)<input required type="number" min="0" step="0.01" name="unitValue" defaultValue="109.90"/></label><label>Canal<select name="channel" defaultValue="whatsapp"><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="presencial">Presencial</option><option value="marketplace">Marketplace</option><option value="other">Outro</option></select></label><label>Cliente (opcional)<input name="customerName"/></label><label>Observações<textarea name="notes" rows={3}/></label><button className="primary-button full" disabled={savingSale}>{savingSale ? "Registrando…" : `Registrar ${Number.parseInt(saleBoxesInput,10)||0} caixa${(Number.parseInt(saleBoxesInput,10)||0)!==1?"s":""}`}</button></> : <div className="empty-stock"><strong>Seu estoque está zerado.</strong><p>Se você já possui uma compra paga, clique em atualizar. O sistema agora também recupera automaticamente entradas de estoque que ficaram pendentes em versões anteriores.</p><button type="button" className="secondary-button" onClick={loadReseller}>Recarregar estoque</button></div>}</form><div><h2>Últimas vendas</h2><div className="sale-list">{stock.sales.map((s)=><article key={s.id}><div><strong>{s.boxes} caixa{s.boxes>1?"s":""}</strong><span>{s.customerName || s.channel}</span></div><div><strong>{money(s.totalValueCents)}</strong><span>{date(s.soldAt)}</span></div></article>)}</div></div></section></> : null}
    {view === "manual" ? <><PortalTitle title="Manual do Revendedor" text="Seu material de apoio LORD NUTRI + MIX10 PRO."/><section className="portal-card resource-card"><h2>Conheça a LORD NUTRI, o modelo de negócio e o MIX10 PRO</h2><p>O manual atualizado reúne operação de revenda, produto, abordagem, atendimento, boas práticas e pós-venda.</p><a className="primary-button" href={manualUrl} target="_blank" rel="noopener noreferrer">Abrir Manual do Revendedor</a><p className="fine-print">Abra ou salve o PDF para consultar quando precisar.</p></section></> : null}
    {view === "welcome" ? <><PortalTitle title="Boas-vindas" text={`Olá, ${user.name}. Comece sua jornada com a LORD NUTRI.`}/><section className="portal-card welcome-intro"><span className="section-kicker">SEU PRIMEIRO PASSO</span><h2>Conheça o produto. Prepare suas vendas.</h2><p>Consulte o manual do revendedor e acompanhe seu pedido. Quando as caixas chegarem, organize seu estoque e registre suas vendas.</p><button className="primary-button" onClick={()=>setView("manual")}>Abrir manual do revendedor</button></section><div className="welcome-shortcuts"><button onClick={()=>setView("overview")}><span>01</span><strong>Visão geral</strong><small>Consulte os números da sua operação.</small></button><button onClick={()=>setView("delivery")}><span>02</span><strong>Acompanhe seu pedido</strong><small>Veja o andamento da sua entrega.</small></button><button onClick={()=>setView("stock")}><span>03</span><strong>Estoque</strong><small>Acompanhe entradas e saídas.</small></button></div>{embedUrl||videoUrl?<WelcomeVideo embedUrl={embedUrl} videoUrl={videoUrl}/>:null}</> : null}
    {view === "delivery" ? <><PortalTitle title="Acompanhe seu pedido" text="Da confirmação do pagamento até a entrega do seu estoque."/><button className="ghost-button" onClick={loadReseller}>Atualizar acompanhamento</button><DeliveryCards shipments={shipments}/></> : null}
  </section></div></main>;
}

function PortalHeader({ user, onLogout }: { user: SessionUser; onLogout: () => void }) { return <header className="portal-header"><Link href="/painel" className="portal-logo"><BrandLogo compact /></Link><div><span>{user.role === "admin" ? "BKO" : user.name}</span><button onClick={onLogout}>Sair</button></div></header>; }
function Metric({ title, value }: { title: string; value: string }) { return <article className="metric-card"><span>{title}</span><strong>{value}</strong></article>; }
function PortalTitle({ title, text }: { title: string; text: string }) { return <section className="portal-title"><div><span className="section-kicker">LORD NUTRI</span><h1>{title}</h1><p>{text}</p></div></section>; }
function DeliveryCards({ shipments }: { shipments: Shipment[] }) { return <section className="delivery-list">{shipments.length ? shipments.map((p)=>{ const progress=deliveryProgress(p.paymentStatus,p.shippingStatus); return <article className="portal-card" key={p.id}><div className="card-title"><h2>{p.kit.toUpperCase()} · {p.boxes} caixas</h2><span>{p.orderNumber}</span></div><span className="status-pill">{progress.label}</span><ol className="delivery-steps" aria-label="Etapas da entrega">{["Separação","Em percurso","Entregue"].map((label,i)=><li key={label} className={progress.step>=i?"complete":""} aria-current={progress.step===i?"step":undefined}><b>{progress.step>=i?"✓":i+1}</b><span>{label}</span></li>)}</ol>{p.carrier?<p>Transportadora: <strong>{p.carrier}</strong></p>:null}{p.trackingCode?<p>Rastreio: <strong>{p.trackingCode}</strong></p>:null}<small>Pedido realizado em {date(p.createdAt)}</small></article>; }) : <section className="portal-card"><h2>Seus pedidos aparecerão aqui</h2><p>Assim que o pedido estiver vinculado ao seu acesso, você poderá acompanhar a entrega.</p></section>}</section>; }
