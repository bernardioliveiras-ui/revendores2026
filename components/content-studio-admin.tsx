"use client";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type DocType = "landing"|"manual"|"products"|"media";
type StudioDoc = {type:DocType;draft:any;published:any;updatedAt?:string|null;publishedAt?:string|null};
type PreviewDevice = "desktop"|"tablet"|"mobile";
type TextSelection = {key:string;kind:"text";value:string;originalValue:string;mode?:string;sectionId?:string;legacyKeys?:string[]};
type TextItem = {key:string;value:string;originalValue:string;mode?:string;sectionId?:string;sectionLabel?:string;legacyKeys?:string[]};
type MediaAsset = {id:string;name:string;mime_type?:string;mimeType?:string;size_bytes?:number;sizeBytes?:number;created_at?:string;url?:string};

async function api(url:string, init:RequestInit={}) {
  const response=await fetch(url,{...init,headers:{...(init.body instanceof FormData?{}:{"content-type":"application/json"}),...(init.headers||{})},cache:"no-store"});
  const body=await response.json().catch(()=>({error:"Resposta inválida."}));
  if(!response.ok) throw new Error(body.error||"Falha na operação.");
  return body;
}

function landingDraft(value:any){
  const fontScales:Record<string,number>={};
  for(const [key,raw] of Object.entries(value?.fontScales||{})){
    const numeric=typeof raw==="number"?raw:Number(raw);
    if(!/^(text|rich):/.test(key)||!Number.isFinite(numeric))continue;
    const safe=Math.min(1.4,Math.max(.8,Math.round(numeric*20)/20));
    if(Math.abs(safe-1)>.001)fontScales[key]=safe;
  }
  return {overrides:{...(value?.overrides||{})},fontScales};
}

function recommendedMax(original:string){
  const length=original.trim().length;
  if(length<=30)return Math.max(36,Math.ceil(length*1.35));
  if(length<=90)return Math.ceil(length*1.45);
  return Math.ceil(length*1.65);
}

export function ContentStudioAdmin() {
  const [tab,setTab]=useState<DocType>("landing");
  const [doc,setDoc]=useState<StudioDoc|null>(null);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [selection,setSelection]=useState<TextSelection|null>(null);
  const [texts,setTexts]=useState<TextItem[]>([]);
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(1);
  const [media,setMedia]=useState<MediaAsset[]>([]);
  const [previewVersion,setPreviewVersion]=useState(0);
  const [previewDevice,setPreviewDevice]=useState<PreviewDevice>("desktop");
  const [,forceHistoryRender]=useState(0);
  const iframeRef=useRef<HTMLIFrameElement|null>(null);
  const undoStack=useRef<any[]>([]);
  const redoStack=useRef<any[]>([]);

  const load=useCallback(async(type:DocType)=>{
    setBusy(true);setNotice("");setSelection(null);
    if(type==="landing")setTexts([]);
    try{
      const loaded=await api(`/api/admin/cms/${type}`);
      if(type==="landing")loaded.draft=landingDraft(loaded.draft);
      setDoc(loaded);
      undoStack.current=[];redoStack.current=[];forceHistoryRender(value=>value+1);
      if(type==="media"){const result=await api("/api/admin/media");setMedia(result.assets||[]);}
    }catch(error){setNotice(error instanceof Error?error.message:"Não foi possível carregar.");}
    finally{setBusy(false);}
  },[]);
  useEffect(()=>{void load(tab)},[tab,load]);

  function remember(draft:any){
    const snapshot=structuredClone(draft);
    const previous=undoStack.current.at(-1);
    if(!previous||JSON.stringify(previous)!==JSON.stringify(snapshot)){
      undoStack.current.push(snapshot);
      if(undoStack.current.length>80)undoStack.current.shift();
    }
    redoStack.current=[];
    forceHistoryRender(value=>value+1);
  }

  function checkpoint(){
    if(tab!=="landing"||!doc)return;
    remember(doc.draft);
  }

  useEffect(()=>{
    const handler=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin)return;
      if(event.data?.type==="lordnutri-cms-select"){
        setSelection({
          key:String(event.data.key||""),kind:"text",value:String(event.data.value||""),
          originalValue:String(event.data.originalValue||event.data.value||""),mode:event.data.mode,
          sectionId:event.data.sectionId,legacyKeys:Array.isArray(event.data.legacyKeys)?event.data.legacyKeys:[],
        });
        return;
      }
      if(event.data?.type==="lordnutri-cms-ready"){
        setTexts(Array.isArray(event.data.texts)?event.data.texts:[]);
        return;
      }
      if(event.data?.type==="lordnutri-cms-inline-change"){
        const key=String(event.data.key||"");
        const value=String(event.data.value||"");
        if(!key)return;
        setDoc(current=>{
          if(!current||current.type!=="landing")return current;
          remember(current.draft);
          const next=landingDraft(current.draft);
          const item=texts.find(text=>text.key===key);
          if(item&&value===item.originalValue){
            delete next.overrides[key];
            for(const legacyKey of item.legacyKeys||[])delete next.overrides[legacyKey];
          }else next.overrides[key]=value;
          return {...current,draft:next};
        });
        setSelection(current=>current?.key===key?{...current,value}:current);
      }
    };
    window.addEventListener("message",handler);
    return()=>window.removeEventListener("message",handler);
  },[texts]);

  useEffect(()=>{
    if(tab!=="landing"||!doc?.draft||!iframeRef.current?.contentWindow)return;
    iframeRef.current.contentWindow.postMessage({type:"lordnutri-cms-live",content:landingDraft(doc.draft)},window.location.origin);
  },[tab,doc?.draft,previewVersion]);

  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      if(tab!=="landing"||busy||!(event.ctrlKey||event.metaKey))return;
      const target=event.target;
      if(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||(target instanceof HTMLElement&&target.isContentEditable))return;
      if(event.key.toLowerCase()==="z"){event.preventDefault();event.shiftKey?redo():undo();}
      else if(event.key.toLowerCase()==="y"){event.preventDefault();redo();}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  });

  function undo(){
    if(!doc||tab!=="landing"||!undoStack.current.length)return;
    const previous=undoStack.current.pop();
    redoStack.current.push(structuredClone(doc.draft));
    setDoc({...doc,draft:previous});
    forceHistoryRender(value=>value+1);
    setNotice("Alteração de texto desfeita.");
  }
  function redo(){
    if(!doc||tab!=="landing"||!redoStack.current.length)return;
    const next=redoStack.current.pop();
    undoStack.current.push(structuredClone(doc.draft));
    setDoc({...doc,draft:next});
    forceHistoryRender(value=>value+1);
    setNotice("Alteração de texto refeita.");
  }

  async function save(next=doc?.draft){
    if(!doc||busy)return;
    setBusy(true);setNotice("");
    try{
      const payload=tab==="landing"?landingDraft(next):next;
      const updated=await api(`/api/admin/cms/${tab}`,{method:"PATCH",body:JSON.stringify({draft:payload})});
      setDoc(updated);setPreviewVersion(value=>value+1);setNotice("Rascunho salvo. O layout e a formatação permaneceram intactos.");
    }catch(error){setNotice(error instanceof Error?error.message:"Não foi possível salvar.");}
    finally{setBusy(false);}
  }
  async function publish(){
    if(!doc||busy)return;
    setBusy(true);setNotice("");
    try{
      const payload=tab==="landing"?landingDraft(doc.draft):doc.draft;
      await api(`/api/admin/cms/${tab}`,{method:"PATCH",body:JSON.stringify({draft:payload})});
      const updated=await api(`/api/admin/cms/${tab}`,{method:"POST",body:JSON.stringify({action:"publish"})});
      setDoc(updated);setPreviewVersion(value=>value+1);setNotice("Publicado. Somente os textos foram alterados; estrutura, imagens e formatação continuam protegidas.");
    }catch(error){setNotice(error instanceof Error?error.message:"Não foi possível publicar.");}
    finally{setBusy(false);}
  }

  function mutate(updater:(draft:any)=>any){if(!doc)return;setDoc({...doc,draft:updater(structuredClone(doc.draft))});}

  function changeSelected(value:string){
    if(!selection||!doc)return;
    const next=landingDraft(doc.draft);
    if(value===selection.originalValue){
      delete next.overrides[selection.key];
      for(const legacyKey of selection.legacyKeys||[])delete next.overrides[legacyKey];
    }else next.overrides[selection.key]=value;
    setDoc({...doc,draft:next});
    setSelection({...selection,value});
  }

  function setSelectedFontScale(scale:number){
    if(!selection||!doc)return;
    checkpoint();
    const next=landingDraft(doc.draft);
    const safe=Math.min(1.4,Math.max(.8,Math.round(scale*20)/20));
    if(Math.abs(safe-1)<.001)delete next.fontScales[selection.key];
    else next.fontScales[selection.key]=safe;
    setDoc({...doc,draft:next});
    setNotice(`Tamanho do texto: ${Math.round(safe*100)}%. O restante do layout continua protegido.`);
  }

  function restoreSelected(){
    if(!selection||!doc)return;
    checkpoint();
    const next=landingDraft(doc.draft);
    delete next.overrides[selection.key];
    delete next.fontScales[selection.key];
    for(const legacyKey of selection.legacyKeys||[])delete next.overrides[legacyKey];
    setDoc({...doc,draft:next});
    setSelection({...selection,value:selection.originalValue});
    setNotice("Texto e tamanho original restaurados.");
  }

  function focusText(item:TextItem){
    const legacyValue=(item.legacyKeys||[]).map(key=>doc?.draft?.overrides?.[key]).find(value=>typeof value==="string");
    const value=doc?.draft?.overrides?.[item.key]??legacyValue??item.value??item.originalValue;
    setSelection({key:item.key,kind:"text",value,originalValue:item.originalValue,mode:item.mode,sectionId:item.sectionId,legacyKeys:item.legacyKeys});
    iframeRef.current?.contentWindow?.postMessage({type:"lordnutri-cms-focus-text",key:item.key},window.location.origin);
  }

  const manualPage=useMemo(()=>doc?.draft?.pages?.find((item:any)=>item.page===page),[doc,page]);
  const filteredTexts=useMemo(()=>{
    const query=search.trim().toLocaleLowerCase("pt-BR");
    if(!query)return texts;
    return texts.filter(item=>{
      const legacyValue=(item.legacyKeys||[]).map(key=>doc?.draft?.overrides?.[key]).find(value=>typeof value==="string");
      const current=String(doc?.draft?.overrides?.[item.key]??legacyValue??item.value??item.originalValue);
      return `${item.sectionLabel||item.sectionId||""} ${current}`.toLocaleLowerCase("pt-BR").includes(query);
    });
  },[texts,search,doc?.draft?.overrides]);
  const groupedTexts=useMemo(()=>{
    const map=new Map<string,TextItem[]>();
    for(const item of filteredTexts){
      const label=item.sectionLabel||item.sectionId||"Geral";
      const group=map.get(label)||[];group.push(item);map.set(label,group);
    }
    return Array.from(map.entries());
  },[filteredTexts]);

  async function uploadMedia(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;const data=new FormData(form);setBusy(true);setNotice("");
    try{const item=await api("/api/admin/media",{method:"POST",body:data});setMedia(current=>[{...item,mime_type:item.mimeType,size_bytes:item.sizeBytes},...current]);form.reset();setNotice("Imagem enviada e pronta para uso.");}
    catch(error){setNotice(error instanceof Error?error.message:"Falha no upload.");}
    finally{setBusy(false);}
  }

  const selectedLimit=selection?recommendedMax(selection.originalValue):0;
  const selectedTooLong=Boolean(selection&&selection.value.length>selectedLimit);
  const selectedFontScale=selection?Number(doc?.draft?.fontScales?.[selection.key]||1):1;

  return <section className="portal-card cms-studio">
    <div className="card-title"><div><span className="section-kicker">EDITOR DE CONTEÚDO</span><h2>Landing, manual, produtos e mídia</h2></div><div className="cms-actions">{tab==="landing"?<><button className="secondary-button compact" disabled={!undoStack.current.length||busy} onClick={undo} title="Ctrl/Cmd + Z">↶ Desfazer</button><button className="secondary-button compact" disabled={!redoStack.current.length||busy} onClick={redo} title="Ctrl/Cmd + Shift + Z">↷ Refazer</button></>:null}<button className="secondary-button compact" disabled={busy||!doc} onClick={()=>void save()}>Salvar rascunho</button><button className="primary-button compact" disabled={busy||!doc} onClick={()=>void publish()}>Publicar</button></div></div>
    <div className="cms-tabs">{([['landing','Landing Page'],['manual','Manual'],['products','Produtos'],['media','Mídia']] as Array<[DocType,string]>).map(([id,label])=><button className={tab===id?"active":""} onClick={()=>setTab(id)} key={id}>{label}</button>)}</div>
    {notice?<p className="cms-notice">{notice}</p>:null}
    {busy&&!doc?<p>Carregando…</p>:null}

    {doc&&tab==="landing"?<div className="cms-builder-shell cms-text-safe-shell">
      <div className="cms-builder-main">
        <div className="cms-builder-heading"><div><h3>Editor de texto seguro</h3><p>Clique em qualquer texto da prévia ou dê <strong>duplo clique</strong> para escrever direto na página. Você pode trocar a copy e ajustar o <strong>tamanho da letra dentro de uma faixa segura</strong>; fonte, cor, posição, imagens, grid e responsividade continuam definidos pelo briefing da LP.</p></div><span className="cms-builder-status">TEXT-SAFE · 0.6.1</span></div>
        <div className="cms-canvas-toolbar" aria-label="Tamanho da prévia"><span>Conferir em:</span>{([['desktop','Desktop'],['tablet','Tablet'],['mobile','Celular']] as Array<[PreviewDevice,string]>).map(([id,label])=><button type="button" key={id} className={previewDevice===id?"active":""} onClick={()=>setPreviewDevice(id)}>{label}</button>)}</div>
        <div className={`cms-canvas-frame device-${previewDevice}`}><iframe ref={iframeRef} key={previewVersion} className="cms-preview" src={`/?cms_preview=draft&cms_editor=1&cms_device=${previewDevice}&v=${previewVersion}`} title="Editor de texto da landing page" onLoad={()=>iframeRef.current?.contentWindow?.postMessage({type:"lordnutri-cms-live",content:landingDraft(doc.draft)},window.location.origin)}/></div>
      </div>

      <aside className="cms-editor-panel cms-text-safe-panel">
        <div className="cms-panel-block cms-safe-lock"><div className="cms-section-manager-head"><h3>Layout protegido</h3><span>briefing travado</span></div><p>Você pode trocar os textos e aumentar/diminuir a letra com limite seguro. <strong>Arrastar, duplicar, trocar imagens, posição, grid, cor ou família tipográfica continuam bloqueados</strong>, então a copy não desmonta a landing.</p><small>MIX10 PRO e LORD NUTRI são reconstruídos com a identidade visual da marca mesmo quando você cola texto sem formatação.</small></div>

        <div className="cms-panel-block"><div className="cms-section-manager-head"><h3>Texto selecionado</h3><span>{selection?.sectionId||"clique na LP"}</span></div>{selection?<>
          <label>Conteúdo<textarea rows={Math.max(3,Math.min(10,Math.ceil(selection.value.length/46)))} value={selection.value} onFocus={checkpoint} onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>changeSelected(event.target.value)} /></label>
          <div className={`cms-copy-meter${selectedTooLong?" is-warning":""}`}><span>{selection.value.length} caracteres</span><span>referência segura: ~{selectedLimit}</span></div>
          {selectedTooLong?<small className="cms-copy-warning">Esse texto ficou bem maior que o original. A formatação continua protegida, mas a copy pode ocupar mais linhas no celular.</small>:null}
          <div className="cms-safe-type-size"><div><strong>Tamanho da letra</strong><small>{Math.round(selectedFontScale*100)}% do tamanho original</small></div><div className="cms-safe-size-buttons"><button type="button" disabled={selectedFontScale<=.8} onClick={()=>setSelectedFontScale(selectedFontScale-.05)} aria-label="Diminuir letra">A−</button><button type="button" onClick={()=>setSelectedFontScale(1)} disabled={Math.abs(selectedFontScale-1)<.001}>100%</button><button type="button" disabled={selectedFontScale>=1.4} onClick={()=>setSelectedFontScale(selectedFontScale+.05)} aria-label="Aumentar letra">A+</button></div></div>
          <small className="cms-layout-lock-note">Faixa segura: 80% a 140%. O ajuste é proporcional ao tamanho responsivo original, então desktop, tablet e celular continuam seguindo o briefing.</small>
          <div className="cms-element-actions"><button type="button" onClick={restoreSelected}>Restaurar texto e tamanho</button></div>
          <small className="cms-layout-lock-note">Colar de Word, WhatsApp, Google Docs etc. traz apenas o texto. A formatação externa não entra na landing.</small>
        </>:<p>Clique em um título, parágrafo, número, legenda ou CTA na prévia. Imagens e estrutura não são selecionáveis.</p>}</div>

        <div className="cms-panel-block cms-text-index"><div className="cms-section-manager-head"><h3>Textos da página</h3><span>{texts.length} campos</span></div><label>Buscar texto<input value={search} onChange={(event:ChangeEvent<HTMLInputElement>)=>setSearch(event.target.value)} placeholder="Ex.: MIX10, kit, revenda…" /></label><div className="cms-text-groups">{groupedTexts.map(([label,items])=><details key={label} open={Boolean(search)}><summary>{label}<span>{items.length}</span></summary><div>{items.map(item=>{const legacyValue=(item.legacyKeys||[]).map(key=>doc.draft?.overrides?.[key]).find(value=>typeof value==="string");const current=String(doc.draft?.overrides?.[item.key]??legacyValue??item.value??item.originalValue);return <button type="button" key={item.key} className={selection?.key===item.key?"active":""} onClick={()=>focusText(item)}><span>{current.slice(0,110)}{current.length>110?"…":""}</span></button>})}</div></details>)}</div></div>
        <button className="secondary-button" type="button" onClick={()=>void save()}>Salvar sem publicar</button>
      </aside>
    </div>:null}

    {doc&&tab==="manual"?<div className="cms-manual-editor"><div className="cms-manual-toolbar"><label>Página<select value={page} onChange={(event:ChangeEvent<HTMLSelectElement>)=>setPage(Number(event.target.value))}>{(doc.draft?.pages||[]).map((item:any)=><option value={item.page} key={item.page}>Página {item.page}</option>)}</select></label><span>{doc.draft?.fieldCount||0} campos de texto · 22 páginas</span></div><div className="cms-manual-fields">{(manualPage?.fields||[]).map((field:any)=><label key={field.id}><span>{field.id}</span><textarea rows={Math.max(2,Math.min(5,Math.ceil(String(field.text).length/60)))} value={field.text} onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>mutate(draft=>{const currentPage=draft.pages.find((item:any)=>item.page===page);const currentField=currentPage.fields.find((item:any)=>item.id===field.id);currentField.text=event.target.value;return draft;})}/></label>)}</div><p className="fine-print">O texto publicado passa a ser a fonte do manual no Portal do Revendedor. O PDF-base original continua preservado em <code>private/manual</code>.</p></div>:null}

    {doc&&tab==="products"?<div className="cms-product-grid">{(doc.draft?.products||[]).map((product:any,index:number)=><article key={product.id}><img src={product.image} alt=""/><label>Nome<input value={product.name||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products[index].name=event.target.value;return draft})}/></label><label>Descrição<input value={product.subtitle||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products[index].subtitle=event.target.value;return draft})}/></label>{product.price!==undefined?<label>Preço exibido<input value={product.price||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products[index].price=event.target.value;return draft})}/></label>:null}<label>Imagem<input value={product.image||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products[index].image=event.target.value;return draft})}/></label>{product.anvisa!==undefined?<label>Processo ANVISA<input value={product.anvisa||""} readOnly/><small>Bloqueado para preservar exatamente 2535115572620267.</small></label>:null}</article>)}</div>:null}

    {doc&&tab==="media"?<div><form className="cms-upload" onSubmit={uploadMedia}><label>Enviar nova foto<input name="file" type="file" accept="image/*" required/></label><button className="primary-button" disabled={busy}>Enviar imagem</button></form><div className="cms-media-grid">{media.map(item=><article key={item.id}><img src={item.url||`/api/media/${item.id}`} alt={item.name}/><strong>{item.name}</strong><code>{item.url||`/api/media/${item.id}`}</code></article>)}</div></div>:null}
  </section>;
}
