"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type DocType = "landing"|"manual"|"products"|"media";
type StudioDoc = {type:DocType;draft:any;published:any;updatedAt?:string|null;publishedAt?:string|null};
type Selection = {key:string;kind:"text"|"image";value:string};

type MediaAsset = {id:string;name:string;mime_type?:string;mimeType?:string;size_bytes?:number;sizeBytes?:number;created_at?:string;url?:string};

async function api(url:string, init:RequestInit={}) {
  const r=await fetch(url,{...init,headers:{...(init.body instanceof FormData?{}:{"content-type":"application/json"}),...(init.headers||{})},cache:"no-store"});
  const b=await r.json().catch(()=>({error:"Resposta inválida."}));
  if(!r.ok) throw new Error(b.error||"Falha na operação.");
  return b;
}

export function ContentStudioAdmin() {
  const [tab,setTab]=useState<DocType>("landing");
  const [doc,setDoc]=useState<StudioDoc|null>(null);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [selection,setSelection]=useState<Selection|null>(null);
  const [page,setPage]=useState(1);
  const [media,setMedia]=useState<MediaAsset[]>([]);
  const [previewVersion,setPreviewVersion]=useState(0);

  const load=useCallback(async(type:DocType)=>{setBusy(true);setNotice("");try{setDoc(await api(`/api/admin/cms/${type}`)); if(type==="media" || type==="landing") { const m=await api("/api/admin/media"); setMedia(m.assets||[]);} }catch(e){setNotice(e instanceof Error?e.message:"Não foi possível carregar.");}finally{setBusy(false);}},[]);
  useEffect(()=>{void load(tab)},[tab,load]);
  useEffect(()=>{const handler=(event:MessageEvent)=>{if(event.origin!==window.location.origin||event.data?.type!=="lordnutri-cms-select")return;setSelection({key:event.data.key,kind:event.data.kind,value:event.data.value});};window.addEventListener("message",handler);return()=>window.removeEventListener("message",handler)},[]);

  async function save(next=doc?.draft){if(!doc||busy)return;setBusy(true);setNotice("");try{const updated=await api(`/api/admin/cms/${tab}`,{method:"PATCH",body:JSON.stringify({draft:next})});setDoc(updated);setPreviewVersion((value)=>value+1);setNotice("Rascunho salvo. A prévia foi atualizada sem alterar o layout.");}catch(e){setNotice(e instanceof Error?e.message:"Não foi possível salvar.");}finally{setBusy(false)}}
  async function publish(){if(!doc||busy)return;setBusy(true);setNotice("");try{const updated=await api(`/api/admin/cms/${tab}`,{method:"POST",body:JSON.stringify({action:"publish"})});setDoc(updated);setPreviewVersion((value)=>value+1);setNotice("Publicado. O conteúdo já está disponível no portal/site.");}catch(e){setNotice(e instanceof Error?e.message:"Não foi possível publicar.");}finally{setBusy(false)}}
  function mutate(updater:(draft:any)=>any){if(!doc)return;setDoc({...doc,draft:updater(structuredClone(doc.draft))});}
  function changeSelected(value:string){if(!selection)return; mutate((draft)=>{if(selection.kind==="image"){draft.imageOverrides=draft.imageOverrides||{};draft.imageOverrides[selection.key]=value;}else{draft.overrides=draft.overrides||{};draft.overrides[selection.key]=value;}return draft;});setSelection({...selection,value});}

  const manualPage=useMemo(()=>doc?.draft?.pages?.find((p:any)=>p.page===page),[doc,page]);

  async function uploadMedia(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget;const data=new FormData(form);setBusy(true);setNotice("");try{const item=await api("/api/admin/media",{method:"POST",body:data});setMedia((cur)=>[{...item,mime_type:item.mimeType,size_bytes:item.sizeBytes},...cur]);form.reset();setNotice("Imagem enviada e pronta para uso.");}catch(err){setNotice(err instanceof Error?err.message:"Falha no upload.");}finally{setBusy(false)}}

  return <section className="portal-card cms-studio">
    <div className="card-title"><div><span className="section-kicker">ESTÚDIO DE CONTEÚDO</span><h2>LP, manual, produtos e mídia</h2></div><div className="cms-actions"><button className="secondary-button compact" disabled={busy||!doc} onClick={()=>void save()}>Salvar rascunho</button><button className="primary-button compact" disabled={busy||!doc} onClick={()=>void publish()}>Publicar</button></div></div>
    <div className="cms-tabs">{([['landing','Landing Page'],['manual','Manual'],['products','Produtos'],['media','Mídia']] as Array<[DocType,string]>).map(([id,label])=><button className={tab===id?"active":""} onClick={()=>{setTab(id);setSelection(null)}} key={id}>{label}</button>)}</div>
    {notice?<p className="cms-notice">{notice}</p>:null}
    {busy&&!doc?<p>Carregando…</p>:null}

    {doc&&tab==="landing"?<div className="cms-landing-layout">
      <div><h3>Prévia editável</h3><p><strong>Layout travado:</strong> clique apenas nos textos destacados ou nas fotos. O painel salva valores de conteúdo; classes, HTML, grids, ícones, cores e espaçamentos não são gravados pelo editor.</p><iframe key={previewVersion} className="cms-preview" src={`/?cms_preview=draft&cms_editor=1&v=${previewVersion}`} title="Prévia editável da landing page"/></div>
      <aside className="cms-editor-panel"><h3>Elemento selecionado</h3>{selection?<><code>{selection.key}</code>{selection.kind==="text"?<><label>Texto<textarea rows={8} value={(doc.draft?.overrides||{})[selection.key]??selection.value} onChange={(e)=>changeSelected(e.target.value)}/></label><small className="cms-layout-lock-note">Layout protegido: este campo altera somente o texto. Elementos compostos que poderiam quebrar a seção ficam bloqueados para edição.</small></>:<><label>URL da imagem<input value={(doc.draft?.imageOverrides||{})[selection.key]??selection.value} onChange={(e)=>changeSelected(e.target.value)}/></label><div className="cms-media-picker">{media.slice(0,12).map((m)=><button key={m.id} type="button" onClick={()=>changeSelected(m.url||`/api/media/${m.id}`)}><img src={m.url||`/api/media/${m.id}`} alt={m.name}/><span>{m.name}</span></button>)}</div></>}</>:<p>Clique em um texto ou imagem na prévia para editar.</p>}<button className="secondary-button" type="button" onClick={()=>void save()}>Salvar sem publicar</button></aside>
    </div>:null}

    {doc&&tab==="manual"?<div className="cms-manual-editor"><div className="cms-manual-toolbar"><label>Página<select value={page} onChange={e=>setPage(Number(e.target.value))}>{(doc.draft?.pages||[]).map((p:any)=><option value={p.page} key={p.page}>Página {p.page}</option>)}</select></label><span>{doc.draft?.fieldCount||0} campos de texto · 22 páginas</span></div><div className="cms-manual-fields">{(manualPage?.fields||[]).map((field:any)=><label key={field.id}><span>{field.id}</span><textarea rows={Math.max(2,Math.min(5,Math.ceil(String(field.text).length/60)))} value={field.text} onChange={e=>mutate((draft)=>{const p=draft.pages.find((x:any)=>x.page===page);const f=p.fields.find((x:any)=>x.id===field.id);f.text=e.target.value;return draft;})}/></label>)}</div><p className="fine-print">O texto publicado passa a ser a fonte do manual no Portal do Revendedor. O PDF-base original continua preservado em <code>private/manual</code>.</p></div>:null}

    {doc&&tab==="products"?<div className="cms-product-grid">{(doc.draft?.products||[]).map((product:any,index:number)=><article key={product.id}><img src={product.image} alt=""/><label>Nome<input value={product.name||""} onChange={e=>mutate((d)=>{d.products[index].name=e.target.value;return d})}/></label><label>Descrição<input value={product.subtitle||""} onChange={e=>mutate((d)=>{d.products[index].subtitle=e.target.value;return d})}/></label>{product.price!==undefined?<label>Preço exibido<input value={product.price||""} onChange={e=>mutate((d)=>{d.products[index].price=e.target.value;return d})}/></label>:null}<label>Imagem<input value={product.image||""} onChange={e=>mutate((d)=>{d.products[index].image=e.target.value;return d})}/></label>{product.anvisa!==undefined?<label>Processo ANVISA<input value={product.anvisa||""} readOnly/><small>Bloqueado para preservar exatamente 2535115572620267.</small></label>:null}</article>)}</div>:null}

    {doc&&tab==="media"?<div><form className="cms-upload" onSubmit={uploadMedia}><label>Enviar nova foto<input name="file" type="file" accept="image/*" required/></label><button className="primary-button" disabled={busy}>Enviar imagem</button></form><div className="cms-media-grid">{media.map((m)=><article key={m.id}><img src={m.url||`/api/media/${m.id}`} alt={m.name}/><strong>{m.name}</strong><code>{m.url||`/api/media/${m.id}`}</code></article>)}</div></div>:null}
  </section>
}
