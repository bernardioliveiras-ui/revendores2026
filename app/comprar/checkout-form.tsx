"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Kit = "kit20" | "kit50";
const kits = [{ id: "kit20" as Kit, name: "KIT20", boxes: 20, price: "R$ 1.499,80", unit: "R$ 74,99/un." }, { id: "kit50" as Kit, name: "KIT50", boxes: 50, price: "R$ 3.495,00", unit: "R$ 69,90/un." }];

export function CheckoutForm() {
  const [kit, setKit] = useState<Kit>(() => {
    if (typeof window === "undefined") return "kit20";
    const value = new URLSearchParams(window.location.search).get("kit");
    return value === "kit50" ? "kit50" : "kit20";
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<{ invoiceUrl?: string | null; qrPayload?: string | null; qrImage?: string | null } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const form = new FormData(event.currentTarget);
    let attribution: Record<string,string> = {}; try { attribution = JSON.parse(localStorage.getItem("mix10_attribution") || "{}"); } catch {}
    try {
      const response = await fetch("/api/public/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(form.entries()), kit, ...attribution, landingPage: window.location.href }) });
      const data = await response.json() as { error?: string; payment?: { invoiceUrl?: string | null; qrPayload?: string | null; qrImage?: string | null } };
      if (!response.ok) throw new Error(data.error || "Não foi possível iniciar sua compra.");
      setPayment(data.payment ?? {});
    } catch (error) { setMessage(error instanceof Error ? error.message : "Tente novamente."); }
    finally { setLoading(false); }
  }
  if (payment) return <section className="rounded-[1.75rem] bg-white p-6 text-[#09211b] sm:p-8"><h2 className="text-2xl font-black">Cobrança criada</h2><p className="mt-2 text-sm text-[#60766f]">Finalize o pagamento no ambiente seguro do Asaas. Após a confirmação, seu acesso será criado automaticamente.</p>{payment.qrImage && <img className="mx-auto mt-6 h-56 w-56" src={`data:image/png;base64,${payment.qrImage}`} alt="QR Code Pix" />}{payment.qrPayload && <Button variant="outline" className="mt-4 w-full" onClick={() => navigator.clipboard.writeText(payment.qrPayload || "")}>Copiar Pix</Button>}{payment.invoiceUrl && <a href={payment.invoiceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#08705c] font-bold text-white">Abrir pagamento no Asaas <ArrowRight size={18} /></a>}</section>;
  return <form onSubmit={submit} className="rounded-[1.75rem] bg-white p-6 text-[#09211b] sm:p-8"><h2 className="text-2xl font-black">Dados da compra e entrega</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{kits.map(item => <button type="button" key={item.id} onClick={() => setKit(item.id)} className={`rounded-2xl border p-4 text-left ${kit === item.id ? "border-[#159477] bg-[#e5f8f2]" : "border-[#d7e2de]"}`}><span className="text-xs font-black text-[#16896f]">{item.boxes} CAIXAS · {item.unit}</span><b className="mt-2 block text-xl">{item.name}</b><strong className="mt-2 block">{item.price}</strong></button>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Nome completo"><Input name="name" required /></Field><Field label="E-mail"><Input name="email" type="email" required /></Field><Field label="WhatsApp"><Input name="phone" inputMode="tel" required /></Field><Field label="CPF ou CNPJ"><Input name="cpfCnpj" required /></Field><Field label="CEP"><Input name="postalCode" required /></Field><Field label="Endereço"><Input name="street" required /></Field><Field label="Número"><Input name="number" required /></Field><Field label="Complemento"><Input name="complement" /></Field><Field label="Bairro"><Input name="district" required /></Field><Field label="Cidade"><Input name="city" required /></Field><Field label="UF"><Input name="state" maxLength={2} required /></Field><Field label="Pagamento"><NativeSelect name="billingType" className="h-10 w-full"><NativeSelectOption value="UNDEFINED">Escolher no Asaas</NativeSelectOption><NativeSelectOption value="PIX">Pix</NativeSelectOption></NativeSelect></Field></div><label className="mt-5 flex items-start gap-3 text-xs leading-5 text-[#60766f]"><input type="checkbox" required className="mt-1 h-4 w-4 accent-[#08705c]" /><span>Concordo com os <a href="/termos-de-uso" target="_blank" className="font-bold text-[#08705c]">Termos</a> e a <a href="/politica-de-privacidade" target="_blank" className="font-bold text-[#08705c]">Política de Privacidade</a>.</span></label>{message && <p className="mt-4 rounded-xl bg-[#fff0ee] p-3 text-sm text-[#9f3e31]">{message}</p>}<Button className="mt-5 h-12 w-full rounded-xl bg-[#08705c] hover:bg-[#065d4d]" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : <>Ir para pagamento <ArrowRight /></>}</Button></form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-bold">{label}{children}</label>; }
