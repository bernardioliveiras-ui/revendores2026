"use client";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type DocType = "landing"|"manual"|"products"|"media";
type StudioDoc = {type:DocType;draft:any;published:any;updatedAt?:string|null;publishedAt?:string|null};
type EditableStyle = {
  fontFamily?:string;fontSize?:string;fontWeight?:string;fontStyle?:string;color?:string;textAlign?:string;
  letterSpacing?:string;lineHeight?:string;textTransform?:string;textDecoration?:string;
};
type Selection = {key:string;kind:"text"|"image";value:string;style?:EditableStyle;mode?:string;sectionId?:string};
type BuilderSection = {id:string;label:string};
type MediaAsset = {id:string;name:string;mime_type?:string;mimeType?:string;size_bytes?:number;sizeBytes?:number;created_at?:string;url?:string};

async function api(url:string, init:RequestInit={}) {
  const r=await fetch(url,{...init,headers:{...(init.body instanceof FormData?{}:{"content-type":"application/json"}),...(init.headers||{})},cache:"no-store"});
  const b=await r.json().catch(()=>({error:"Resposta inválida."}));
  if(!r.ok) throw new Error(b.error||"Falha na operação.");
  return b;
}

function rgbToHex(value:string|undefined){
  if(!value) return "#1d211e";
  if(/^#[0-9a-f]{6}$/i.test(value)) return value;
  const m=value.match(/rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);
  if(!m) return "#1d211e";
  return `#${[m[1],m[2],m[3]].map(v=>Math.max(0,Math.min(255,Number(v))).toString(16).padStart(2,"0")).join("")}`;
}

function pxNumber(value:string|undefined,fallback=""){
  if(!value) return fallback;
  const m=value.match(/-?[\d.]+/);
  return m?.[0]||fallback;
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
  const [sections,setSections]=useState<BuilderSection[]>([]);
  const [styleClipboard,setStyleClipboard]=useState<EditableStyle|null>(null);
  const [draggingSection,setDraggingSection]=useState<string|null>(null);
  const [,forceHistoryRender]=useState(0);
  const iframeRef=useRef<HTMLIFrameElement|null>(null);
  const undoStack=useRef<any[]>([]);
  const redoStack=useRef<any[]>([]);

  const load=useCallback(async(type:DocType)=>{setBusy(true);setNotice("");try{const loaded=await api(`/api/admin/cms/${type}`);setDoc(loaded);undoStack.current=[];redoStack.current=[];forceHistoryRender(v=>v+1);if(type==="media" || type==="landing") { const m=await api("/api/admin/media"); setMedia(m.assets||[]);} }catch(e){setNotice(e instanceof Error?e.message:"Não foi possível carregar.");}finally{setBusy(false);}},[]);
  useEffect(()=>{void load(tab)},[tab,load]);
  useEffect(()=>{const handler=(event:MessageEvent)=>{if(event.origin!==window.location.origin)return;if(event.data?.type==="lordnutri-cms-select"){setSelection({key:event.data.key,kind:event.data.kind,value:event.data.value,style:event.data.style||{},mode:event.data.mode,sectionId:event.data.sectionId});}if(event.data?.type==="lordnutri-cms-ready"){setSections(Array.isArray(event.data.sections)?event.data.sections:[]);}};window.addEventListener("message",handler);return()=>window.removeEventListener("message",handler)},[]);

  useEffect(()=>{
    if(tab!=="landing"||!doc?.draft||!iframeRef.current?.contentWindow)return;
    iframeRef.current.contentWindow.postMessage({type:"lordnutri-cms-live",content:doc.draft},window.location.origin);
  },[tab,doc?.draft,previewVersion]);

  function checkpoint(){
    if(!doc||tab!=="landing")return;
    const snapshot=structuredClone(doc.draft);
    const previous=undoStack.current.at(-1);
    if(!previous||JSON.stringify(previous)!==JSON.stringify(snapshot)){
      undoStack.current.push(snapshot);
      if(undoStack.current.length>60)undoStack.current.shift();
    }
    redoStack.current=[];
    forceHistoryRender(v=>v+1);
  }
  function undo(){
    if(!doc||!undoStack.current.length)return;
    const previous=undoStack.current.pop();
    redoStack.current.push(structuredClone(doc.draft));
    setDoc({...doc,draft:previous});
    forceHistoryRender(v=>v+1);
    setNotice("Ação desfeita.");
  }
  function redo(){
    if(!doc||!redoStack.current.length)return;
    const next=redoStack.current.pop();
    undoStack.current.push(structuredClone(doc.draft));
    setDoc({...doc,draft:next});
    forceHistoryRender(v=>v+1);
    setNotice("Ação refeita.");
  }
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(tab!=="landing"||busy||!(event.ctrlKey||event.metaKey))return;if(event.key.toLowerCase()==="z"){event.preventDefault();event.shiftKey?redo():undo();}else if(event.key.toLowerCase()==="y"){event.preventDefault();redo();}};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler)});

  async function save(next=doc?.draft){if(!doc||busy)return;setBusy(true);setNotice("");try{const updated=await api(`/api/admin/cms/${tab}`,{method:"PATCH",body:JSON.stringify({draft:next})});setDoc(updated);setPreviewVersion((value)=>value+1);setNotice("Rascunho salvo. A prévia foi atualizada.");}catch(e){setNotice(e instanceof Error?e.message:"Não foi possível salvar.");}finally{setBusy(false)}}
  async function publish(){if(!doc||busy)return;setBusy(true);setNotice("");try{const updated=await api(`/api/admin/cms/${tab}`,{method:"POST",body:JSON.stringify({action:"publish"})});setDoc(updated);setPreviewVersion((value)=>value+1);setNotice("Publicado. A landing já usa essa versão.");}catch(e){setNotice(e instanceof Error?e.message:"Não foi possível publicar.");}finally{setBusy(false)}}
  function mutate(updater:(draft:any)=>any){if(!doc)return;setDoc({...doc,draft:updater(structuredClone(doc.draft))});}
  function changeSelected(value:string){if(!selection)return;mutate((draft)=>{if(selection.kind==="image"){draft.imageOverrides=draft.imageOverrides||{};draft.imageOverrides[selection.key]=value;}else{draft.overrides=draft.overrides||{};draft.overrides[selection.key]=value;}return draft;});setSelection({...selection,value});}
  function setSelectedStyle(patch:Partial<EditableStyle>,replace=false){
    if(!selection||selection.kind!=="text")return;
    mutate((draft)=>{draft.styleOverrides=draft.styleOverrides||{};const current=replace?{}:(draft.styleOverrides[selection.key]||{});const next={...current,...patch};for(const [key,value] of Object.entries(next)){if(!String(value??"").trim())delete next[key];}if(Object.keys(next).length)draft.styleOverrides[selection.key]=next;else delete draft.styleOverrides[selection.key];return draft;});
    setSelection({...selection,style:replace?{...patch}:{...(selection.style||{}),...patch}});
  }
  function resetSelectedStyle(){if(!selection||selection.kind!=="text")return;checkpoint();mutate((draft)=>{if(draft.styleOverrides)delete draft.styleOverrides[selection.key];return draft;});setSelection({...selection,style:{}});setNotice("Formatação personalizada removida. O elemento voltou ao estilo original da seção.");}
  function copySelectedStyle(){if(!selection?.style||selection.kind!=="text")return;setStyleClipboard({...selection.style});setNotice("Estilo copiado. Selecione outro texto e use Colar estilo.");}
  function pasteSelectedStyle(){if(!selection||selection.kind!=="text"||!styleClipboard)return;checkpoint();setSelectedStyle(styleClipboard,true);setNotice("Estilo aplicado ao texto selecionado.");}
  function applyPreset(type:"mix"|"lord"){
    if(!selection||selection.kind!=="text")return;
    checkpoint();
    if(type==="mix")setSelectedStyle({fontFamily:'"Arial Black", Arial, Helvetica, sans-serif',fontWeight:"900",fontStyle:"italic",letterSpacing:"-0.045em"});
    else setSelectedStyle({fontFamily:'Georgia, "Times New Roman", serif',fontWeight:"700",fontStyle:"normal",letterSpacing:"0em",color:"#f1d994"});
  }

  const manualPage=useMemo(()=>doc?.draft?.pages?.find((p:any)=>p.page===page),[doc,page]);
  const sectionOrder=useMemo(()=>{const known=sections.map(s=>s.id);const stored=Array.isArray(doc?.draft?.sectionOrder)?doc.draft.sectionOrder.filter((id:string)=>known.includes(id)):[];return [...stored,...known.filter(id=>!stored.includes(id))];},[doc?.draft?.sectionOrder,sections]);
  const sectionLabel=(id:string)=>sections.find(s=>s.id===id)?.label||id;

  function setSectionOrder(next:string[]){mutate(draft=>{draft.sectionOrder=next;return draft;});}
  function moveSection(id:string,direction:-1|1){const current=[...sectionOrder];const index=current.indexOf(id);const target=index+direction;if(index<0||target<0||target>=current.length)return;checkpoint();[current[index],current[target]]=[current[target],current[index]];setSectionOrder(current);}
  function dropSection(targetId:string){if(!draggingSection||draggingSection===targetId)return;const current=[...sectionOrder];const from=current.indexOf(draggingSection);const to=current.indexOf(targetId);if(from<0||to<0)return;checkpoint();current.splice(from,1);current.splice(to,0,draggingSection);setSectionOrder(current);setDraggingSection(null);}

  async function uploadMedia(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget;const data=new FormData(form);setBusy(true);setNotice("");try{const item=await api("/api/admin/media",{method:"POST",body:data});setMedia((cur)=>[{...item,mime_type:item.mimeType,size_bytes:item.sizeBytes},...cur]);form.reset();setNotice("Imagem enviada e pronta para uso.");}catch(err){setNotice(err instanceof Error?err.message:"Falha no upload.");}finally{setBusy(false)}}

  const currentStyle=selection?.style||{};
  return <section className="portal-card cms-studio">
    <div className="card-title"><div><span className="section-kicker">EDITOR VISUAL</span><h2>Landing, manual, produtos e mídia</h2></div><div className="cms-actions">{tab==="landing"?<><button className="secondary-button compact" disabled={!undoStack.current.length} onClick={undo} title="Ctrl/Cmd + Z">↶ Desfazer</button><button className="secondary-button compact" disabled={!redoStack.current.length} onClick={redo} title="Ctrl/Cmd + Shift + Z">↷ Refazer</button></>:null}<button className="secondary-button compact" disabled={busy||!doc} onClick={()=>void save()}>Salvar rascunho</button><button className="primary-button compact" disabled={busy||!doc} onClick={()=>void publish()}>Publicar</button></div></div>
    <div className="cms-tabs">{([['landing','Landing Page'],['manual','Manual'],['products','Produtos'],['media','Mídia']] as Array<[DocType,string]>).map(([id,label])=><button className={tab===id?"active":""} onClick={()=>{setTab(id);setSelection(null)}} key={id}>{label}</button>)}</div>
    {notice?<p className="cms-notice">{notice}</p>:null}
    {busy&&!doc?<p>Carregando…</p>:null}

    {doc&&tab==="landing"?<div className="cms-builder-shell">
      <div className="cms-builder-main">
        <div className="cms-builder-heading"><div><h3>Editor visual da landing</h3><p>Edite clicando na própria página. Digitar <strong>MIX10 PRO</strong> ou <strong>LORD NUTRI</strong> em qualquer campo aplica automaticamente a identidade da marca.</p></div><span className="cms-builder-status">Prévia ao vivo</span></div>
        <iframe ref={iframeRef} key={previewVersion} className="cms-preview" src={`/?cms_preview=draft&cms_editor=1&v=${previewVersion}`} title="Editor visual da landing page" onLoad={()=>iframeRef.current?.contentWindow?.postMessage({type:"lordnutri-cms-live",content:doc.draft},window.location.origin)}/>
      </div>
      <aside className="cms-editor-panel">
        <div className="cms-panel-block"><h3>Elemento selecionado</h3>{selection?<><code>{selection.sectionId||"root"} · {selection.key}</code>{selection.kind==="text"?<>
          <label>Texto<textarea rows={6} onFocus={checkpoint} value={(doc.draft?.overrides||{})[selection.key]??selection.value} onChange={(e)=>changeSelected(e.target.value)}/></label>
          <div className="cms-brand-quick"><span>Identidade rápida</span><button type="button" onClick={()=>applyPreset("mix")}>MIX10 PRO</button><button type="button" onClick={()=>applyPreset("lord")}>LORD NUTRI</button></div>
          <div className="cms-style-actions"><button type="button" className="secondary-button compact" onClick={copySelectedStyle}>Copiar estilo</button><button type="button" className="secondary-button compact" disabled={!styleClipboard} onClick={pasteSelectedStyle}>Colar estilo</button><button type="button" className="text-button" onClick={resetSelectedStyle}>Restaurar</button></div>
          <div className="cms-typography-grid">
            <label>Fonte<select onFocus={checkpoint} value={currentStyle.fontFamily||""} onChange={e=>setSelectedStyle({fontFamily:e.target.value})}><option value="">Original</option><option value='Inter, ui-sans-serif, system-ui, sans-serif'>Inter / Sans</option><option value='Georgia, "Times New Roman", serif'>Georgia / Serif</option><option value='Arial, Helvetica, sans-serif'>Arial</option><option value='"Arial Black", Arial, Helvetica, sans-serif'>Arial Black</option></select></label>
            <label>Tamanho<input onFocus={checkpoint} type="number" min="8" max="160" value={pxNumber(currentStyle.fontSize)} placeholder="px" onChange={e=>setSelectedStyle({fontSize:e.target.value?`${e.target.value}px`:""})}/></label>
            <label>Peso<select onFocus={checkpoint} value={currentStyle.fontWeight||""} onChange={e=>setSelectedStyle({fontWeight:e.target.value})}><option value="">Original</option>{[300,400,500,600,700,800,900].map(n=><option value={String(n)} key={n}>{n}</option>)}</select></label>
            <label>Cor<input onFocus={checkpoint} type="color" value={rgbToHex(currentStyle.color)} onChange={e=>setSelectedStyle({color:e.target.value})}/></label>
            <label>Entrelinha<input onFocus={checkpoint} type="number" step="0.05" min="0.7" max="3" value={pxNumber(currentStyle.lineHeight)} placeholder="px" onChange={e=>setSelectedStyle({lineHeight:e.target.value?`${e.target.value}px`:""})}/></label>
            <label>Espaçamento<input onFocus={checkpoint} type="number" step="0.01" min="-1" max="2" value={pxNumber(currentStyle.letterSpacing)} placeholder="px" onChange={e=>setSelectedStyle({letterSpacing:e.target.value?`${e.target.value}px`:""})}/></label>
          </div>
          <div className="cms-format-buttons"><button type="button" className={currentStyle.fontStyle==="italic"?"active":""} onClick={()=>{checkpoint();setSelectedStyle({fontStyle:currentStyle.fontStyle==="italic"?"normal":"italic"})}}><i>I</i></button>{["left","center","right"].map(align=><button type="button" className={currentStyle.textAlign===align?"active":""} onClick={()=>{checkpoint();setSelectedStyle({textAlign:align})}} key={align}>{align==="left"?"⇤":align==="center"?"↔":"⇥"}</button>)}</div>
          <small className="cms-layout-lock-note">Agora a copy e a formatação são separadas. Copiar/colar texto não perde mais a identidade de MIX10 PRO; e “Copiar estilo” replica a tipografia para qualquer outro texto.</small>
        </>:<><label>URL da imagem<input onFocus={checkpoint} value={(doc.draft?.imageOverrides||{})[selection.key]??selection.value} onChange={(e)=>changeSelected(e.target.value)}/></label><div className="cms-media-picker">{media.slice(0,12).map((m)=><button key={m.id} type="button" onClick={()=>{checkpoint();changeSelected(m.url||`/api/media/${m.id}`)}}><img src={m.url||`/api/media/${m.id}`} alt={m.name}/><span>{m.name}</span></button>)}</div></>}</>:<p>Clique em um texto ou imagem na prévia.</p>}</div>
        <div className="cms-panel-block"><div className="cms-section-manager-head"><h3>Seções / slides</h3><span>arraste ou use ↑ ↓</span></div><div className="cms-section-list">{sectionOrder.map((id,index)=><div draggable onDragStart={()=>setDraggingSection(id)} onDragOver={e=>e.preventDefault()} onDrop={()=>dropSection(id)} className="cms-section-row" key={id}><span className="cms-drag-handle">⋮⋮</span><strong>{sectionLabel(id)}</strong><div><button type="button" disabled={index===0} onClick={()=>moveSection(id,-1)}>↑</button><button type="button" disabled={index===sectionOrder.length-1} onClick={()=>moveSection(id,1)}>↓</button></div></div>)}</div></div>
        <button className="secondary-button" type="button" onClick={()=>void save()}>Salvar sem publicar</button>
      </aside>
    </div>:null}

    {doc&&tab==="manual"?<div className="cms-manual-editor"><div className="cms-manual-toolbar"><label>Página<select value={page} onChange={e=>setPage(Number(e.target.value))}>{(doc.draft?.pages||[]).map((p:any)=><option value={p.page} key={p.page}>Página {p.page}</option>)}</select></label><span>{doc.draft?.fieldCount||0} campos de texto · 22 páginas</span></div><div className="cms-manual-fields">{(manualPage?.fields||[]).map((field:any)=><label key={field.id}><span>{field.id}</span><textarea rows={Math.max(2,Math.min(5,Math.ceil(String(field.text).length/60)))} value={field.text} onChange={e=>mutate((draft)=>{const p=draft.pages.find((x:any)=>x.page===page);const f=p.fields.find((x:any)=>x.id===field.id);f.text=e.target.value;return draft;})}/></label>)}</div><p className="fine-print">O texto publicado passa a ser a fonte do manual no Portal do Revendedor. O PDF-base original continua preservado em <code>private/manual</code>.</p></div>:null}

    {doc&&tab==="products"?<div className="cms-product-grid">{(doc.draft?.products||[]).map((product:any,index:number)=><article key={product.id}><img src={product.image} alt=""/><label>Nome<input value={product.name||""} onChange={e=>mutate((d)=>{d.products[index].name=e.target.value;return d})}/></label><label>Descrição<input value={product.subtitle||""} onChange={e=>mutate((d)=>{d.products[index].subtitle=e.target.value;return d})}/></label>{product.price!==undefined?<label>Preço exibido<input value={product.price||""} onChange={e=>mutate((d)=>{d.products[index].price=e.target.value;return d})}/></label>:null}<label>Imagem<input value={product.image||""} onChange={e=>mutate((d)=>{d.products[index].image=e.target.value;return d})}/></label>{product.anvisa!==undefined?<label>Processo ANVISA<input value={product.anvisa||""} readOnly/><small>Bloqueado para preservar exatamente 2535115572620267.</small></label>:null}</article>)}</div>:null}

    {doc&&tab==="media"?<div><form className="cms-upload" onSubmit={uploadMedia}><label>Enviar nova foto<input name="file" type="file" accept="image/*" required/></label><button className="primary-button" disabled={busy}>Enviar imagem</button></form><div className="cms-media-grid">{media.map((m)=><article key={m.id}><img src={m.url||`/api/media/${m.id}`} alt={m.name}/><strong>{m.name}</strong><code>{m.url||`/api/media/${m.id}`}</code></article>)}</div></div>:null}
  </section>
}
