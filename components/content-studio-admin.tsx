"use client";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { WelcomeVideo } from "@/components/welcome-video";

type DocType = "manual" | "products" | "media";
type ManualField = { id: string; text: string; [key: string]: unknown };
type ManualPage = { page: number; fields: ManualField[]; [key: string]: unknown };
type Product = { id: string; name?: string; subtitle?: string; image?: string; price?: string; anvisa?: string; [key: string]: unknown };
type ContentDraft = {
  pages?: ManualPage[];
  fieldCount?: number;
  products?: Product[];
  welcomeVideo?: { sourceUrl?: string; [key: string]: unknown };
  [key: string]: unknown;
};
type StudioDoc = { type: DocType; draft: ContentDraft; published: ContentDraft; updatedAt?: string | null; publishedAt?: string | null };
type MediaAsset = { id: string; name: string; mime_type?: string; mimeType?: string; size_bytes?: number; sizeBytes?: number; created_at?: string; url?: string; kind?: "image" | "video" };

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...(init.body instanceof FormData ? {} : { "content-type": "application/json" }), ...init.headers }, cache: "no-store" });
  const body = await response.json().catch(() => ({ error: "Resposta inválida." }));
  if (!response.ok) throw new Error(body?.error || "Falha na operação.");
  return body as T;
}

export function ContentStudioAdmin() {
  const [tab, setTab] = useState<DocType>("manual");
  const [doc, setDoc] = useState<StudioDoc | null>(null);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [media, setMedia] = useState<MediaAsset[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function load() {
      const loaded = await api<StudioDoc>(`/api/admin/cms/${tab}`, { signal });
      if (signal.aborted) return null;
      if (loaded.type !== tab) throw new Error("Resposta de conteúdo inválida.");
      const assets = tab === "media" ? (await api<{ assets?: MediaAsset[] }>("/api/admin/media", { signal })).assets || [] : null;
      return { loaded, assets };
    }
    void load().then(result => {
      if (signal.aborted || !result) return;
      setDoc(result.loaded);
      if (result.assets) setMedia(result.assets);
    }).catch(error => {
      if (!signal.aborted) setNotice(error instanceof Error ? error.message : "Não foi possível carregar.");
    }).finally(() => {
      if (!signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [tab]);

  async function save() {
    if (!doc || doc.type !== tab || busy) return;
    setBusy(true); setNotice("");
    try {
      const updated = await api<StudioDoc>(`/api/admin/cms/${tab}`, { method: "PATCH", body: JSON.stringify({ draft: doc.draft }) });
      if (updated.type !== tab) throw new Error("Resposta de conteúdo inválida.");
      setDoc(updated); setNotice("Rascunho salvo.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }
  async function publish() {
    if (!doc || doc.type !== tab || busy) return;
    setBusy(true); setNotice("");
    try {
      await api<StudioDoc>(`/api/admin/cms/${tab}`, { method: "PATCH", body: JSON.stringify({ draft: doc.draft }) });
      const updated = await api<StudioDoc>(`/api/admin/cms/${tab}`, { method: "POST", body: JSON.stringify({ action: "publish" }) });
      if (updated.type !== tab) throw new Error("Resposta de conteúdo inválida.");
      setDoc(updated); setNotice("Conteúdo publicado.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível publicar."); }
    finally { setBusy(false); }
  }
  function mutate(updater: (draft: ContentDraft) => ContentDraft) {
    setDoc(current => current?.type === tab ? { ...current, draft: updater(structuredClone(current.draft)) } : current);
  }
  async function uploadMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !doc || doc.type !== "media" || tab !== "media") return;
    const form = event.currentTarget; const data = new FormData(form);
    setBusy(true); setNotice("");
    try {
      const item = await api<MediaAsset>("/api/admin/media", { method: "POST", body: data });
      setMedia(current => [{ ...item, mime_type: item.mimeType, size_bytes: item.sizeBytes }, ...current]);
      if (String(item.mimeType || "").startsWith("video/")) {
        mutate(draft => { draft.welcomeVideo = { ...draft.welcomeVideo, sourceUrl: item.url }; return draft; });
        setNotice("Vídeo enviado e selecionado para a aba Boas Vindas. Clique em Publicar para liberar aos revendedores.");
      } else setNotice("Imagem enviada e pronta para uso.");
      form.reset();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Falha no upload."); }
    finally { setBusy(false); }
  }
  const manualPage = useMemo(() => doc?.type === "manual" ? doc.draft.pages?.find(item => item.page === page) : undefined, [doc, page]);
  const canSave = Boolean(doc && doc.type === tab && !busy);

  return <section className="portal-card cms-studio">
    <div className="card-title"><div><span className="section-kicker">CONTEÚDO AUXILIAR</span><h2>Manual, produtos e mídia</h2></div><div className="cms-actions"><button className="secondary-button compact" disabled={!canSave} onClick={()=>void save()}>Salvar rascunho</button><button className="primary-button compact" disabled={!canSave} onClick={()=>void publish()}>Publicar</button></div></div>
    <div className="cms-tabs">{([['manual','Manual'],['products','Produtos'],['media','Mídia']] as Array<[DocType,string]>).map(([id,label])=><button className={tab===id?"active":""} disabled={busy} onClick={()=>{if(id===tab)return;setBusy(true);setNotice("");setDoc(null);setTab(id);}} key={id}>{label}</button>)}</div>
    {notice?<p className="cms-notice">{notice}</p>:null}
    {busy&&!doc?<p>Carregando…</p>:null}

    {doc&&doc.type===tab&&tab==="manual"?<div className="cms-manual-editor"><div className="cms-manual-toolbar"><label>Página<select value={page} onChange={(event:ChangeEvent<HTMLSelectElement>)=>setPage(Number(event.target.value))}>{(doc.draft?.pages||[]).map((item)=><option value={item.page} key={item.page}>Página {item.page}</option>)}</select></label><span>{doc.draft?.fieldCount||0} campos de texto · 18 páginas</span></div><div className="cms-manual-fields">{(manualPage?.fields||[]).map((field)=><label key={field.id}><span>{field.id}</span><textarea rows={Math.max(2,Math.min(5,Math.ceil(String(field.text).length/60)))} value={field.text} onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>mutate(draft=>{const currentPage=draft.pages?.find((item)=>item.page===page);const currentField=currentPage?.fields.find((item)=>item.id===field.id);if(currentField)currentField.text=event.target.value;return draft;})}/></label>)}</div><p className="fine-print">O texto publicado passa a ser a fonte do manual no Portal do Revendedor. O PDF-base original continua preservado em <code>private/manual</code>.</p></div>:null}

    {doc&&doc.type===tab&&tab==="products"?<div className="cms-product-grid">{(doc.draft?.products||[]).map((product,index)=><article key={product.id}><img src={product.image} alt=""/><label>Nome<input value={product.name||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products![index].name=event.target.value;return draft})}/></label><label>Descrição<input value={product.subtitle||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products![index].subtitle=event.target.value;return draft})}/></label>{product.price!==undefined?<label>Preço exibido<input value={product.price||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products![index].price=event.target.value;return draft})}/></label>:null}<label>Imagem<input value={product.image||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products![index].image=event.target.value;return draft})}/></label>{product.anvisa!==undefined?<label>Processo ANVISA<input value={product.anvisa||""} readOnly/><small>Bloqueado para preservar exatamente 25351155726202677.</small></label>:null}</article>)}</div>:null}

    {doc&&doc.type===tab&&tab==="media"?<div className="cms-media-workspace">
      <section className="cms-welcome-video-config">
        <div><span className="section-kicker">PORTAL DO REVENDEDOR</span><h3>Vídeo da aba Boas Vindas</h3><p>Cole um link do YouTube, Vimeo ou MP4. Para vídeo curto, você também pode enviar MP4/WebM de até 12 MB. A alteração só entra para os revendedores quando você clicar em <strong>Publicar</strong>.</p></div>
        <label>Link do vídeo<input value={String(doc.draft?.welcomeVideo?.sourceUrl||"")} placeholder="https://youtu.be/... ou https://.../video.mp4" onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.welcomeVideo={...(draft.welcomeVideo||{}),sourceUrl:event.target.value};return draft;})}/></label>
        <div className="cms-welcome-video-preview"><WelcomeVideo sourceUrl={String(doc.draft?.welcomeVideo?.sourceUrl||"")}/></div>
        <div className="cms-element-actions"><button type="button" onClick={()=>mutate(draft=>{draft.welcomeVideo={...(draft.welcomeVideo||{}),sourceUrl:""};return draft;})}>Remover vídeo</button></div>
      </section>
      <form className="cms-upload" onSubmit={uploadMedia}><label>Enviar imagem ou vídeo<input name="file" type="file" accept="image/*,video/mp4,video/webm,video/ogg" required/></label><button className="primary-button" disabled={busy}>Enviar mídia</button></form>
      <div className="cms-media-grid">{media.map(item=>{const url=item.url||`/api/media/${item.id}`;const isVideo=String(item.mime_type||item.mimeType||"").startsWith("video/");return <article key={item.id}>{isVideo?<video src={url} controls preload="metadata"/>:<img src={url} alt={item.name}/>}<strong>{item.name}</strong><code>{url}</code>{isVideo?<button type="button" className="secondary-button compact" onClick={()=>mutate(draft=>{draft.welcomeVideo={...(draft.welcomeVideo||{}),sourceUrl:url};return draft;})}>Usar em Boas Vindas</button>:null}</article>})}</div>
    </div>:null}
  </section>;
}
