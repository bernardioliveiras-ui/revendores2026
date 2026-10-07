"use client";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type DocType = "landing"|"manual"|"products"|"media";
type StudioDoc = {type:DocType;draft:any;published:any;updatedAt?:string|null;publishedAt?:string|null};
type EditableStyle = {
  fontFamily?:string;fontSize?:string;fontWeight?:string;fontStyle?:string;color?:string;textAlign?:string;
  letterSpacing?:string;lineHeight?:string;textTransform?:string;textDecoration?:string;
};
type EditableLayout = {
  width?:string;maxWidth?:string;minWidth?:string;height?:string;maxHeight?:string;
  marginTop?:string;marginRight?:string;marginBottom?:string;marginLeft?:string;
  paddingTop?:string;paddingRight?:string;paddingBottom?:string;paddingLeft?:string;
  borderRadius?:string;opacity?:string;objectFit?:string;objectPosition?:string;backgroundColor?:string;
  borderColor?:string;borderWidth?:string;borderStyle?:string;position?:string;left?:string;top?:string;right?:string;bottom?:string;
  zIndex?:string;order?:string;flexBasis?:string;gridColumn?:string;gridRow?:string;alignSelf?:string;justifySelf?:string;
};
type Selection = {
  key:string;kind:"text"|"image"|"group";value:string;style?:EditableStyle;mode?:string;sectionId?:string;
  cloneId?:string;groupCloneId?:string;customId?:string;sourceKey?:string;previousKey?:string;nextKey?:string;
};
type BuilderSection = {id:string;label:string;sourceId?:string;duplicateAllowed?:boolean};
type SectionInstance = {id:string;sourceId:string;hidden?:boolean;label?:string};
type ElementClone = {id:string;sourceKey:string;sectionId:string;kind:"text"|"image";mode?:string};
type ElementPlacement = {key:string;targetKey?:string;targetSectionId?:string;position:"before"|"after"|"append"|"prepend"};
type GroupClone = {id:string;sourceGroupKey:string;sectionId:string};
type CustomBlock = {id:string;sectionId:string;kind:"heading"|"text"|"button"|"image";content?:string;href?:string;src?:string};
type MediaAsset = {id:string;name:string;mime_type?:string;mimeType?:string;size_bytes?:number;sizeBytes?:number;created_at?:string;url?:string};
type PreviewDevice = "desktop"|"tablet"|"mobile";

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

function uniqueId(prefix:string){
  const clean=prefix.toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"")||"item";
  return `${clean}-copy-${Date.now().toString(36)}`;
}

function copyScopedMaps(draft:any, fromScope:string, toScope:string){
  for(const mapName of ["overrides","imageOverrides","styleOverrides","layoutOverrides","responsiveLayoutOverrides"]){
    const source=draft?.[mapName]||{};
    draft[mapName]=draft[mapName]||{};
    for(const [key,value] of Object.entries(source)){
      const marker=`:${fromScope}:`;
      if(!key.includes(marker)) continue;
      draft[mapName][key.replace(marker,`:${toScope}:`)]=structuredClone(value);
    }
  }
}

function removeScopedMaps(draft:any, scope:string){
  for(const mapName of ["overrides","imageOverrides","styleOverrides","layoutOverrides","responsiveLayoutOverrides"]){
    const source=draft?.[mapName];
    if(!source||typeof source!=="object") continue;
    const marker=`:${scope}:`;
    for(const key of Object.keys(source)) if(key.includes(marker)) delete source[key];
  }
  draft.hiddenElements=(draft.hiddenElements||[]).filter((key:string)=>!key.includes(`:${scope}:`));
  draft.elementClones=(draft.elementClones||[]).filter((item:ElementClone)=>item.sectionId!==scope);
  draft.groupClones=(draft.groupClones||[]).filter((item:GroupClone)=>item.sectionId!==scope);
  draft.elementPlacements=(draft.elementPlacements||[]).filter((item:ElementPlacement)=>!item.key.includes(`:${scope}:`)&&!String(item.targetKey||"").includes(`:${scope}:`)&&item.targetSectionId!==scope);
  draft.customBlocks=(draft.customBlocks||[]).filter((item:CustomBlock)=>item.sectionId!==scope);
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
  const [previewDevice,setPreviewDevice]=useState<PreviewDevice>("desktop");
  const [,forceHistoryRender]=useState(0);
  const iframeRef=useRef<HTMLIFrameElement|null>(null);
  const undoStack=useRef<any[]>([]);
  const redoStack=useRef<any[]>([]);

  const load=useCallback(async(type:DocType)=>{
    setBusy(true);setNotice("");
    try{
      const loaded=await api(`/api/admin/cms/${type}`);
      setDoc(loaded);undoStack.current=[];redoStack.current=[];forceHistoryRender(v=>v+1);
      if(type==="media" || type==="landing") { const m=await api("/api/admin/media"); setMedia(m.assets||[]); }
    }catch(e){setNotice(e instanceof Error?e.message:"Não foi possível carregar.");}
    finally{setBusy(false);}
  },[]);
  useEffect(()=>{void load(tab)},[tab,load]);

  useEffect(()=>{
    const handler=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin)return;
      if(event.data?.type==="lordnutri-cms-select"){
        setSelection({key:event.data.key,kind:event.data.kind,value:event.data.value,style:event.data.style||{},mode:event.data.mode,sectionId:event.data.sectionId,cloneId:event.data.cloneId,groupCloneId:event.data.groupCloneId,customId:event.data.customId,sourceKey:event.data.sourceKey,previousKey:event.data.previousKey,nextKey:event.data.nextKey});
      }
      if(event.data?.type==="lordnutri-cms-ready"){
        setSections(Array.isArray(event.data.sections)?event.data.sections:[]);
      }
      if(event.data?.type==="lordnutri-cms-inline-change"){
        const key=String(event.data.key||"");
        const value=String(event.data.value||"");
        if(!key)return;
        checkpoint();
        mutate((draft)=>{draft.overrides=draft.overrides||{};draft.overrides[key]=value;return draft;});
        setSelection((current)=>current?.key===key?{...current,value}:current);
      }
      if(event.data?.type==="lordnutri-cms-section-command"){
        const instanceId=String(event.data.instanceId||"");
        const action=String(event.data.action||"");
        if(action==="duplicate") duplicateSection(instanceId);
        else if(action==="toggle") toggleSection(instanceId);
        else if(action==="delete") deleteSection(instanceId);
      }
      if(event.data?.type==="lordnutri-cms-section-drop"){
        reorderSection(String(event.data.dragId||""),String(event.data.targetId||""));
      }
      if(event.data?.type==="lordnutri-cms-element-drop"){
        const position=["before","after","append","prepend"].includes(String(event.data.position))?event.data.position:"after";
        moveElement(String(event.data.dragKey||""),String(event.data.targetKey||""),position,String(event.data.targetSectionId||""));
      }
      if(event.data?.type==="lordnutri-cms-free-move"){
        offsetElement(String(event.data.key||""),Number(event.data.dx||0),Number(event.data.dy||0),previewDevice);
      }
      if(event.data?.type==="lordnutri-cms-element-command"){
        const action=String(event.data.action||"");
        if(action==="duplicate")duplicateSelectedElement();
        else if(action==="toggle")toggleSelectedElement();
        else if(action==="delete")deleteSelectedElement();
      }
    };
    window.addEventListener("message",handler);
    return()=>window.removeEventListener("message",handler);
  });

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
      if(undoStack.current.length>80)undoStack.current.shift();
    }
    redoStack.current=[];
    forceHistoryRender(v=>v+1);
  }

  async function persistLandingDraft(next:any,message="Rascunho atualizado.",reloadPreview=false){
    if(!doc)return;
    setBusy(true);setNotice("");
    try{
      const updated=await api("/api/admin/cms/landing",{method:"PATCH",body:JSON.stringify({draft:next})});
      setDoc(updated);
      if(reloadPreview)setPreviewVersion(value=>value+1);
      setNotice(message);
    }catch(e){setNotice(e instanceof Error?e.message:"Não foi possível salvar.");}
    finally{setBusy(false);}
  }

  function undo(){
    if(!doc||!undoStack.current.length)return;
    const previous=undoStack.current.pop();
    redoStack.current.push(structuredClone(doc.draft));
    setDoc({...doc,draft:previous});
    forceHistoryRender(v=>v+1);
    void persistLandingDraft(previous,"Ação desfeita.",true);
  }
  function redo(){
    if(!doc||!redoStack.current.length)return;
    const next=redoStack.current.pop();
    undoStack.current.push(structuredClone(doc.draft));
    setDoc({...doc,draft:next});
    forceHistoryRender(v=>v+1);
    void persistLandingDraft(next,"Ação refeita.",true);
  }
  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      if(tab!=="landing"||busy||!(event.ctrlKey||event.metaKey))return;
      if(event.key.toLowerCase()==="z"){event.preventDefault();event.shiftKey?redo():undo();}
      else if(event.key.toLowerCase()==="y"){event.preventDefault();redo();}
      else if(event.key.toLowerCase()==="d" && selection){event.preventDefault();duplicateSelectedElement();}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  });

  async function save(next=doc?.draft){
    if(!doc||busy)return;
    setBusy(true);setNotice("");
    try{
      const updated=await api(`/api/admin/cms/${tab}`,{method:"PATCH",body:JSON.stringify({draft:next})});
      setDoc(updated);setPreviewVersion(value=>value+1);setNotice("Rascunho salvo. A prévia foi atualizada.");
    }catch(e){setNotice(e instanceof Error?e.message:"Não foi possível salvar.");}
    finally{setBusy(false);}
  }
  async function publish(){
    if(!doc||busy)return;
    setBusy(true);setNotice("");
    try{
      await api(`/api/admin/cms/${tab}`,{method:"PATCH",body:JSON.stringify({draft:doc.draft})});
      const updated=await api(`/api/admin/cms/${tab}`,{method:"POST",body:JSON.stringify({action:"publish"})});
      setDoc(updated);setPreviewVersion(value=>value+1);setNotice("Publicado. Todas as alterações locais foram salvas e a landing já usa essa versão.");
    }catch(e){setNotice(e instanceof Error?e.message:"Não foi possível publicar.");}
    finally{setBusy(false);}
  }
  function mutate(updater:(draft:any)=>any){if(!doc)return;setDoc({...doc,draft:updater(structuredClone(doc.draft))});}
  function changeSelected(value:string){
    if(!selection)return;
    mutate((draft)=>{if(selection.kind==="image"){draft.imageOverrides=draft.imageOverrides||{};draft.imageOverrides[selection.key]=value;}else{draft.overrides=draft.overrides||{};draft.overrides[selection.key]=value;}return draft;});
    setSelection({...selection,value});
  }
  function setSelectedStyle(patch:Partial<EditableStyle>,replace=false){
    if(!selection||selection.kind!=="text")return;
    mutate((draft)=>{draft.styleOverrides=draft.styleOverrides||{};const current=replace?{}:(draft.styleOverrides[selection.key]||{});const next={...current,...patch};for(const [key,value] of Object.entries(next)){if(!String(value??"").trim())delete next[key];}if(Object.keys(next).length)draft.styleOverrides[selection.key]=next;else delete draft.styleOverrides[selection.key];return draft;});
    setSelection({...selection,style:replace?{...patch}:{...(selection.style||{}),...patch}});
  }
  function setSelectedLayout(patch:Partial<EditableLayout>,replace=false){
    if(!selection)return;
    mutate((draft)=>{
      draft.responsiveLayoutOverrides=draft.responsiveLayoutOverrides||{};
      const byDevice=draft.responsiveLayoutOverrides[selection.key]||{};
      const current=replace?{}:(byDevice[previewDevice]||{});
      const next={...current,...patch};
      for(const [key,value] of Object.entries(next)){if(!String(value??"").trim())delete next[key];}
      if(Object.keys(next).length)byDevice[previewDevice]=next;else delete byDevice[previewDevice];
      if(Object.keys(byDevice).length)draft.responsiveLayoutOverrides[selection.key]=byDevice;else delete draft.responsiveLayoutOverrides[selection.key];
      return draft;
    });
  }
  function resetSelectedLayout(){if(!selection)return;checkpoint();mutate((draft)=>{const byDevice=draft.responsiveLayoutOverrides?.[selection.key];if(byDevice){delete byDevice[previewDevice];if(!Object.keys(byDevice).length)delete draft.responsiveLayoutOverrides[selection.key];}return draft;});setNotice(`Layout de ${previewDevice} restaurado.`);}

  function resetSelectedStyle(){if(!selection||selection.kind!=="text")return;checkpoint();mutate((draft)=>{if(draft.styleOverrides)delete draft.styleOverrides[selection.key];return draft;});setSelection({...selection,style:{}});setNotice("Formatação personalizada removida.");}
  function copySelectedStyle(){if(!selection?.style||selection.kind!=="text")return;setStyleClipboard({...selection.style});setNotice("Estilo copiado. Selecione outro texto e use Colar estilo.");}
  function pasteSelectedStyle(){if(!selection||selection.kind!=="text"||!styleClipboard)return;checkpoint();setSelectedStyle(styleClipboard,true);setNotice("Estilo aplicado ao texto selecionado.");}
  function applyPreset(type:"mix"|"lord"){
    if(!selection||selection.kind!=="text")return;
    checkpoint();
    if(type==="mix")setSelectedStyle({fontFamily:'"Arial Black", Arial, Helvetica, sans-serif',fontWeight:"900",fontStyle:"italic",letterSpacing:"-0.045em"});
    else setSelectedStyle({fontFamily:'Georgia, "Times New Roman", serif',fontWeight:"700",fontStyle:"normal",letterSpacing:"0em",color:"#f1d994"});
  }

  const manualPage=useMemo(()=>doc?.draft?.pages?.find((p:any)=>p.page===page),[doc,page]);
  const sectionCatalog=useMemo(()=>new Map(sections.map(section=>[section.id,section])),[sections]);
  const sectionInstances=useMemo<SectionInstance[]>(()=>{
    const stored=Array.isArray(doc?.draft?.sectionInstances)?doc.draft.sectionInstances as SectionInstance[]:[];
    const known=sections.map(section=>section.id);
    if(stored.length){
      const valid=stored.filter(item=>item&&known.includes(item.sourceId));
      for(const sourceId of known) if(!valid.some(item=>item.id===sourceId)) valid.push({id:sourceId,sourceId});
      return valid;
    }
    const legacy=Array.isArray(doc?.draft?.sectionOrder)?doc.draft.sectionOrder.filter((id:string)=>known.includes(id)):[];
    return [...legacy,...known.filter(id=>!legacy.includes(id))].map(id=>({id,sourceId:id}));
  },[doc?.draft?.sectionInstances,doc?.draft?.sectionOrder,sections]);
  const sectionLabel=(instance:SectionInstance)=>instance.label||sectionCatalog.get(instance.sourceId)?.label||instance.sourceId;

  function structuralUpdate(mutator:(draft:any)=>void,message:string){
    if(!doc)return;
    checkpoint();
    const next=structuredClone(doc.draft||{});
    if(!Array.isArray(next.sectionInstances)||!next.sectionInstances.length) next.sectionInstances=structuredClone(sectionInstances);
    mutator(next);
    next.sectionOrder=(next.sectionInstances||[]).map((item:SectionInstance)=>item.id);
    setDoc({...doc,draft:next});
    void persistLandingDraft(next,message,true);
  }

  function reorderSection(dragId:string,targetId:string){
    if(!dragId||!targetId||dragId===targetId)return;
    structuralUpdate((draft)=>{
      const list=[...(draft.sectionInstances||[])];
      const from=list.findIndex((item:SectionInstance)=>item.id===dragId);
      const to=list.findIndex((item:SectionInstance)=>item.id===targetId);
      if(from<0||to<0)return;
      const [moved]=list.splice(from,1);list.splice(to,0,moved);draft.sectionInstances=list;
    },"Seção movida. A ordem foi salva no rascunho.");
  }
  function moveSection(id:string,direction:-1|1){
    const index=sectionInstances.findIndex(item=>item.id===id);const target=index+direction;
    if(index<0||target<0||target>=sectionInstances.length)return;
    reorderSection(id,sectionInstances[target].id);
  }
  function dropSection(targetId:string){if(!draggingSection)return;reorderSection(draggingSection,targetId);setDraggingSection(null);}
  function duplicateSection(id:string){
    const instance=sectionInstances.find(item=>item.id===id);if(!instance)return;
    const catalog=sectionCatalog.get(instance.sourceId);
    if(catalog?.duplicateAllowed===false){setNotice("Esse bloco contém funcionalidade dinâmica e não pode ser duplicado com segurança.");return;}
    structuralUpdate((draft)=>{
      const list=[...(draft.sectionInstances||[])];
      const index=list.findIndex((item:SectionInstance)=>item.id===id);
      const newId=uniqueId(instance.sourceId);
      const copy:SectionInstance={id:newId,sourceId:instance.sourceId,label:`${sectionLabel(instance)} — cópia`};
      list.splice(index+1,0,copy);draft.sectionInstances=list;
      copyScopedMaps(draft,id,newId);
      draft.elementPlacements=draft.elementPlacements||[];
      for(const placement of [...draft.elementPlacements] as ElementPlacement[]){
        const targetKey=String(placement.targetKey||"");
        if(!placement.key.includes(`:${id}:`)&&!targetKey.includes(`:${id}:`)&&placement.targetSectionId!==id)continue;
        draft.elementPlacements.push({...placement,key:placement.key.replace(`:${id}:`,`:${newId}:`),targetKey:targetKey?targetKey.replace(`:${id}:`,`:${newId}:`):undefined,targetSectionId:placement.targetSectionId===id?newId:placement.targetSectionId});
      }
      draft.customBlocks=draft.customBlocks||[];
      const customCopies=(draft.customBlocks as CustomBlock[]).filter(item=>item.sectionId===id).map(item=>({...item,id:uniqueId(item.kind),sectionId:newId}));
      draft.customBlocks.push(...customCopies);
      const originalClones=(draft.elementClones||[]).filter((item:ElementClone)=>item.sectionId===id);
      for(const item of originalClones){
        const cloneId=uniqueId(item.id);
        const sourceKey=item.sourceKey.replace(`:${id}:`,`:${newId}:`);
        draft.elementClones.push({...item,id:cloneId,sectionId:newId,sourceKey});
      }
      draft.groupClones=draft.groupClones||[];
      const originalGroups=(draft.groupClones as GroupClone[]).filter(item=>item.sectionId===id);
      for(const item of originalGroups){draft.groupClones.push({...item,id:uniqueId(item.id),sectionId:newId,sourceGroupKey:item.sourceGroupKey.replace(`:${id}:`,`:${newId}:`)});}
    },"Seção duplicada com conteúdo e estilos.");
  }
  function toggleSection(id:string){
    structuralUpdate((draft)=>{const item=(draft.sectionInstances||[]).find((entry:SectionInstance)=>entry.id===id);if(item)item.hidden=!item.hidden;},"Visibilidade da seção atualizada.");
  }
  function deleteSection(id:string){
    const instance=sectionInstances.find(item=>item.id===id);if(!instance)return;
    if(instance.id===instance.sourceId){setNotice("Seções originais são ocultadas em vez de excluídas. Use o botão de visibilidade.");return;}
    structuralUpdate((draft)=>{draft.sectionInstances=(draft.sectionInstances||[]).filter((item:SectionInstance)=>item.id!==id);removeScopedMaps(draft,id);},"Cópia da seção excluída.");
    if(selection?.sectionId===id)setSelection(null);
  }

  function duplicateSelectedElement(){
    if(!doc||!selection)return;
    if(selection.kind==="group"){
      const cloneId=uniqueId("group");
      const sectionId=selection.sectionId||"root";
      const newKey=`group:${sectionId}:clone:${cloneId}`;
      structuralUpdate((draft)=>{
        draft.groupClones=draft.groupClones||[];
        draft.groupClones.push({id:cloneId,sourceGroupKey:selection.key,sectionId} satisfies GroupClone);
        draft.elementPlacements=draft.elementPlacements||[];
        draft.elementPlacements=draft.elementPlacements.filter((item:ElementPlacement)=>item.key!==newKey);
        draft.elementPlacements.push({key:newKey,targetKey:selection.key,position:"after"});
      },"Conjunto duplicado com número, texto e formatação.");
      return;
    }
    const cloneId=uniqueId("element");
    const selectedKind: "text"|"image" = selection.kind;
    const prefix=selectedKind==="image"?"image":selection.mode==="text"?"text":"rich";
    const sectionId=selection.sectionId||"root";
    const newKey=`${prefix}:${sectionId}:clone:${cloneId}`;
    structuralUpdate((draft)=>{
      draft.elementClones=draft.elementClones||[];
      draft.elementClones.push({id:cloneId,sourceKey:selection.key,sectionId,kind:selectedKind,mode:selection.mode||selectedKind} satisfies ElementClone);
      draft.layoutOverrides=draft.layoutOverrides||{};
      draft.responsiveLayoutOverrides=draft.responsiveLayoutOverrides||{};
      if(selectedKind==="image"){
        draft.imageOverrides=draft.imageOverrides||{};
        draft.imageOverrides[newKey]=(draft.imageOverrides||{})[selection.key]??selection.value;
      }else{
        draft.overrides=draft.overrides||{};
        draft.styleOverrides=draft.styleOverrides||{};
        draft.overrides[newKey]=(draft.overrides||{})[selection.key]??selection.value;
        draft.styleOverrides[newKey]=structuredClone((draft.styleOverrides||{})[selection.key]||selection.style||{});
      }
      draft.layoutOverrides[newKey]=structuredClone((draft.layoutOverrides||{})[selection.key]||{});
      draft.responsiveLayoutOverrides[newKey]=structuredClone((draft.responsiveLayoutOverrides||{})[selection.key]||{});
      draft.elementPlacements=draft.elementPlacements||[];
      draft.elementPlacements=draft.elementPlacements.filter((item:ElementPlacement)=>item.key!==newKey);
      draft.elementPlacements.push({key:newKey,targetKey:selection.key,position:"after"});
    },"Elemento duplicado com conteúdo, estilo e posição.");
  }
  function toggleSelectedElement(){
    if(!selection)return;
    structuralUpdate((draft)=>{
      const hidden=new Set<string>(draft.hiddenElements||[]);
      if(hidden.has(selection.key))hidden.delete(selection.key);else hidden.add(selection.key);
      draft.hiddenElements=[...hidden];
    },"Visibilidade do elemento atualizada.");
  }
  function moveElement(dragKey:string,targetKey:string,position:ElementPlacement["position"],targetSectionId=""){
    if(!dragKey)return;
    if(targetKey&&dragKey===targetKey)return;
    if(!targetKey&&!targetSectionId)return;
    structuralUpdate((draft)=>{
      draft.elementPlacements=draft.elementPlacements||[];
      draft.elementPlacements=(draft.elementPlacements as ElementPlacement[]).filter(item=>item.key!==dragKey);
      draft.elementPlacements.push({key:dragKey,targetKey:targetKey||undefined,targetSectionId:targetSectionId||undefined,position});
    },"Bloco movido. A nova posição foi salva no rascunho.");
  }
  function offsetElement(key:string,dx:number,dy:number,device:PreviewDevice){
    if(!doc||!key||(!dx&&!dy))return;
    checkpoint();
    const next=structuredClone(doc.draft||{});
    next.responsiveLayoutOverrides=next.responsiveLayoutOverrides||{};
    const byDevice=next.responsiveLayoutOverrides[key]||{};
    const current={...(byDevice[device]||{})};
    const left=(Number(pxNumber(current.left,"0"))||0)+dx;
    const top=(Number(pxNumber(current.top,"0"))||0)+dy;
    current.position="relative";current.left=`${Math.round(left)}px`;current.top=`${Math.round(top)}px`;
    byDevice[device]=current;next.responsiveLayoutOverrides[key]=byDevice;
    setDoc({...doc,draft:next});
    void persistLandingDraft(next,`Posição ajustada em ${device}.`,false);
  }
  function moveSelected(direction:-1|1){
    if(!selection)return;
    const target=direction<0?selection.previousKey:selection.nextKey;if(!target)return;
    moveElement(selection.key,target,direction<0?"before":"after");
  }
  function deleteSelectedElement(){
    if(!selection?.cloneId&&!selection?.groupCloneId&&!selection?.customId)return;
    structuralUpdate((draft)=>{
      if(selection.cloneId)draft.elementClones=(draft.elementClones||[]).filter((item:ElementClone)=>item.id!==selection.cloneId);
      if(selection.groupCloneId){
        draft.groupClones=(draft.groupClones||[]).filter((item:GroupClone)=>item.id!==selection.groupCloneId);
        const marker=`:groupclone:${selection.groupCloneId}:`;
        for(const mapName of ["overrides","imageOverrides","styleOverrides","layoutOverrides","responsiveLayoutOverrides"]){for(const key of Object.keys(draft[mapName]||{}))if(key.includes(marker))delete draft[mapName][key];}
        draft.hiddenElements=(draft.hiddenElements||[]).filter((key:string)=>!key.includes(marker));
        draft.elementPlacements=(draft.elementPlacements||[]).filter((item:ElementPlacement)=>!item.key.includes(marker)&&!String(item.targetKey||"").includes(marker));
      }
      if(selection.customId)draft.customBlocks=(draft.customBlocks||[]).filter((item:CustomBlock)=>item.id!==selection.customId);
      for(const mapName of ["overrides","imageOverrides","styleOverrides","layoutOverrides","responsiveLayoutOverrides"]){if(draft[mapName])delete draft[mapName][selection.key];}
      draft.hiddenElements=(draft.hiddenElements||[]).filter((key:string)=>key!==selection.key);
      draft.elementPlacements=(draft.elementPlacements||[]).filter((item:ElementPlacement)=>item.key!==selection.key&&item.targetKey!==selection.key);
    },"Elemento excluído.");
    setSelection(null);
  }
  function addCustomBlock(kind:CustomBlock["kind"],sectionId?:string){
    const targetSection=sectionId||selection?.sectionId||sectionInstances.find(item=>!item.hidden)?.id;
    if(!targetSection||targetSection==="root"){setNotice("Selecione primeiro uma seção da landing para adicionar o bloco.");return;}
    const id=uniqueId(kind);
    const block:CustomBlock={id,sectionId:targetSection,kind};
    if(kind==="heading")block.content="Novo título";
    if(kind==="text")block.content="Novo texto. Clique duas vezes para editar diretamente na página.";
    if(kind==="button"){block.content="NOVO BOTÃO";block.href="#";}
    if(kind==="image")block.src="/brand/mix10-box-transparent-v3-web.webp";
    structuralUpdate((draft)=>{draft.customBlocks=draft.customBlocks||[];draft.customBlocks.push(block);},"Novo bloco adicionado à seção.");
  }
  function updateSelectedCustomBlock(patch:Partial<CustomBlock>){
    if(!selection?.customId)return;
    mutate((draft)=>{const block=(draft.customBlocks||[]).find((item:CustomBlock)=>item.id===selection.customId);if(block)Object.assign(block,patch);return draft;});
  }

  async function uploadMedia(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget;const data=new FormData(form);setBusy(true);setNotice("");try{const item=await api("/api/admin/media",{method:"POST",body:data});setMedia(cur=>[{...item,mime_type:item.mimeType,size_bytes:item.sizeBytes},...cur]);form.reset();setNotice("Imagem enviada e pronta para uso.");}catch(err){setNotice(err instanceof Error?err.message:"Falha no upload.");}finally{setBusy(false)}}

  const currentStyle=selection?.style||{};
  const currentLayout:EditableLayout=useMemo(()=>{
    if(!selection)return {};
    const base=(doc?.draft?.layoutOverrides||{})[selection.key]||{};
    const responsive=(doc?.draft?.responsiveLayoutOverrides||{})[selection.key]||{};
    return {...base,...(responsive.desktop||{}),...(previewDevice!=="desktop"?(responsive.tablet||{}):{}),...(previewDevice==="mobile"?(responsive.mobile||{}):{})};
  },[selection,doc?.draft?.layoutOverrides,doc?.draft?.responsiveLayoutOverrides,previewDevice]);
  const selectedCustom:CustomBlock|undefined=selection?.customId?(doc?.draft?.customBlocks||[]).find((item:CustomBlock)=>item.id===selection.customId):undefined;
  const selectedHidden=Boolean(selection&&doc?.draft?.hiddenElements?.includes(selection.key));

  return <section className="portal-card cms-studio">
    <div className="card-title"><div><span className="section-kicker">EDITOR VISUAL</span><h2>Landing, manual, produtos e mídia</h2></div><div className="cms-actions">{tab==="landing"?<><button className="secondary-button compact" disabled={!undoStack.current.length||busy} onClick={undo} title="Ctrl/Cmd + Z">↶ Desfazer</button><button className="secondary-button compact" disabled={!redoStack.current.length||busy} onClick={redo} title="Ctrl/Cmd + Shift + Z">↷ Refazer</button></>:null}<button className="secondary-button compact" disabled={busy||!doc} onClick={()=>void save()}>Salvar rascunho</button><button className="primary-button compact" disabled={busy||!doc} onClick={()=>void publish()}>Publicar</button></div></div>
    <div className="cms-tabs">{([['landing','Landing Page'],['manual','Manual'],['products','Produtos'],['media','Mídia']] as Array<[DocType,string]>).map(([id,label])=><button className={tab===id?"active":""} onClick={()=>{setTab(id);setSelection(null)}} key={id}>{label}</button>)}</div>
    {notice?<p className="cms-notice">{notice}</p>:null}
    {busy&&!doc?<p>Carregando…</p>:null}

    {doc&&tab==="landing"?<div className="cms-builder-shell">
      <div className="cms-builder-main">
        <div className="cms-builder-heading"><div><h3>LORDNUTRI Page Builder</h3><p>Clique para selecionar, <strong>duplo clique para editar</strong>. Arraste seções e elementos pelos puxadores dourados, duplique blocos, reorganize a página e use Ctrl/Cmd+Z para desfazer.</p></div><span className="cms-builder-status">Editor visual · rascunho</span></div>
        <div className="cms-canvas-toolbar" aria-label="Tamanho da prévia"><span>Visualizar:</span>{([['desktop','Desktop'],['tablet','Tablet'],['mobile','Celular']] as Array<[PreviewDevice,string]>).map(([id,label])=><button type="button" key={id} className={previewDevice===id?"active":""} onClick={()=>setPreviewDevice(id)}>{label}</button>)}</div>
        <div className={`cms-canvas-frame device-${previewDevice}`}><iframe ref={iframeRef} key={previewVersion} className="cms-preview" src={`/?cms_preview=draft&cms_editor=1&cms_device=${previewDevice}&v=${previewVersion}`} title="Editor visual da landing page" onLoad={()=>iframeRef.current?.contentWindow?.postMessage({type:"lordnutri-cms-live",content:doc.draft},window.location.origin)}/></div>
      </div>
      <aside className="cms-editor-panel">
        <div className="cms-panel-block"><div className="cms-section-manager-head"><h3>Elemento selecionado</h3><span>{previewDevice}</span></div>{selection?<><code>{selection.kind} · {selection.sectionId||"root"} · {selection.key}</code><div className="cms-element-actions"><button type="button" disabled={!selection.previousKey} onClick={()=>moveSelected(-1)}>↑ Subir</button><button type="button" disabled={!selection.nextKey} onClick={()=>moveSelected(1)}>↓ Descer</button><button type="button" onClick={duplicateSelectedElement}>⧉ Duplicar</button><button type="button" onClick={toggleSelectedElement}>{selectedHidden?"◉ Exibir":"◌ Ocultar"}</button>{selection.cloneId||selection.groupCloneId||selection.customId?<button type="button" className="danger" onClick={deleteSelectedElement}>Excluir</button>:null}</div>
          {selection.kind==="group"?<div className="cms-group-help"><strong>Conjunto / container</strong><p>Esse bloco mantém os itens internos juntos. Ex.: <b>30 + “cápsulas por caixa”</b>. Duplique o conjunto e arraste tudo de uma vez para outra área da landing.</p></div>:null}
          {selection.kind==="text"?<>
            <label>Texto<textarea rows={6} onFocus={checkpoint} value={(doc.draft?.overrides||{})[selection.key]??selection.value} onChange={e=>changeSelected(e.target.value)}/></label>
            {selectedCustom?.kind==="button"?<label>Destino do botão<input value={selectedCustom.href||""} onFocus={checkpoint} onChange={e=>updateSelectedCustomBlock({href:e.target.value})} placeholder="#kits ou https://..."/></label>:null}
            <div className="cms-brand-quick"><span>Identidade rápida</span><button type="button" onClick={()=>applyPreset("mix")}>MIX10 PRO</button><button type="button" onClick={()=>applyPreset("lord")}>LORD NUTRI</button></div>
            <div className="cms-style-actions"><button type="button" className="secondary-button compact" onClick={copySelectedStyle}>Copiar estilo</button><button type="button" className="secondary-button compact" disabled={!styleClipboard} onClick={pasteSelectedStyle}>Colar estilo</button><button type="button" className="text-button" onClick={resetSelectedStyle}>Restaurar fonte</button></div>
            <div className="cms-typography-grid">
              <label>Fonte<select onFocus={checkpoint} value={currentStyle.fontFamily||""} onChange={e=>setSelectedStyle({fontFamily:e.target.value})}><option value="">Original</option><option value='Inter, ui-sans-serif, system-ui, sans-serif'>Inter / Sans</option><option value='Georgia, "Times New Roman", serif'>Georgia / Serif</option><option value='Arial, Helvetica, sans-serif'>Arial</option><option value='"Arial Black", Arial, Helvetica, sans-serif'>Arial Black</option></select></label>
              <label>Tamanho<input onFocus={checkpoint} type="number" min="8" max="160" value={pxNumber(currentStyle.fontSize)} placeholder="px" onChange={e=>setSelectedStyle({fontSize:e.target.value?`${e.target.value}px`:""})}/></label>
              <label>Peso<select onFocus={checkpoint} value={currentStyle.fontWeight||""} onChange={e=>setSelectedStyle({fontWeight:e.target.value})}><option value="">Original</option>{[300,400,500,600,700,800,900].map(n=><option value={String(n)} key={n}>{n}</option>)}</select></label>
              <label>Cor<input onFocus={checkpoint} type="color" value={rgbToHex(currentStyle.color)} onChange={e=>setSelectedStyle({color:e.target.value})}/></label>
              <label>Entrelinha<input onFocus={checkpoint} type="number" step="0.05" min="0.7" max="3" value={pxNumber(currentStyle.lineHeight)} placeholder="px" onChange={e=>setSelectedStyle({lineHeight:e.target.value?`${e.target.value}px`:""})}/></label>
              <label>Espaçamento<input onFocus={checkpoint} type="number" step="0.01" min="-1" max="2" value={pxNumber(currentStyle.letterSpacing)} placeholder="px" onChange={e=>setSelectedStyle({letterSpacing:e.target.value?`${e.target.value}px`:""})}/></label>
            </div>
            <div className="cms-format-buttons"><button type="button" className={currentStyle.fontStyle==="italic"?"active":""} onClick={()=>{checkpoint();setSelectedStyle({fontStyle:currentStyle.fontStyle==="italic"?"normal":"italic"})}}><i>I</i></button>{["left","center","right"].map(align=><button type="button" className={currentStyle.textAlign===align?"active":""} onClick={()=>{checkpoint();setSelectedStyle({textAlign:align})}} key={align}>{align==="left"?"⇤":align==="center"?"↔":"⇥"}</button>)}</div>
          </>:null}
          {selection.kind==="image"?<><label>URL da imagem<input onFocus={checkpoint} value={(doc.draft?.imageOverrides||{})[selection.key]??selection.value} onChange={e=>changeSelected(e.target.value)}/></label><div className="cms-media-picker">{media.slice(0,12).map(m=><button key={m.id} type="button" onClick={()=>{checkpoint();changeSelected(m.url||`/api/media/${m.id}`)}}><img src={m.url||`/api/media/${m.id}`} alt={m.name}/><span>{m.name}</span></button>)}</div></>:null}
          <details className="cms-builder-details" open><summary>Posição responsiva · {previewDevice}</summary><div className="cms-layout-grid"><label>Largura<input value={currentLayout.width||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({width:e.target.value})} placeholder="auto / 100% / 320px"/></label><label>Máx. largura<input value={currentLayout.maxWidth||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({maxWidth:e.target.value})} placeholder="ex.: 720px"/></label><label>X / esquerda<input value={currentLayout.left||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({position:e.target.value?"relative":"",left:e.target.value})} placeholder="ex.: 40px"/></label><label>Y / topo<input value={currentLayout.top||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({position:e.target.value?"relative":"",top:e.target.value})} placeholder="ex.: -20px"/></label><label>Margem topo<input value={currentLayout.marginTop||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({marginTop:e.target.value})} placeholder="ex.: 24px"/></label><label>Margem baixo<input value={currentLayout.marginBottom||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({marginBottom:e.target.value})} placeholder="ex.: 24px"/></label><label>Ordem<input value={currentLayout.order||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({order:e.target.value})} placeholder="0, 1, 2..."/></label><label>Coluna grid<input value={currentLayout.gridColumn||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({gridColumn:e.target.value})} placeholder="1 / -1"/></label><label>Linha grid<input value={currentLayout.gridRow||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({gridRow:e.target.value})} placeholder="auto"/></label><label>Z-index<input value={currentLayout.zIndex||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({zIndex:e.target.value})} placeholder="1"/></label><label>Padding<input value={currentLayout.paddingTop||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({paddingTop:e.target.value,paddingBottom:e.target.value})} placeholder="ex.: 16px"/></label><label>Raio<input value={currentLayout.borderRadius||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({borderRadius:e.target.value})} placeholder="18px"/></label>{selection.kind==="image"?<><label>Altura<input value={currentLayout.height||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({height:e.target.value})} placeholder="auto"/></label><label>Opacidade<input value={currentLayout.opacity||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({opacity:e.target.value})} placeholder="0.8"/></label><label>Encaixe<select value={currentLayout.objectFit||""} onFocus={checkpoint} onChange={e=>setSelectedLayout({objectFit:e.target.value})}><option value="">Original</option><option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option></select></label></>:null}</div><button type="button" className="text-button" onClick={resetSelectedLayout}>Restaurar somente {previewDevice}</button></details>
          <small className="cms-layout-lock-note"><b>Layout travado:</b> o HTML-base e as funções ficam protegidos. <b>Responsivo real:</b> desktop, tablet e celular guardam posições separadas. Use o puxador <b>✥</b> sobre o elemento para deslocar livremente e <b>⋮⋮</b> para encaixar em outro ponto/seção.</small>
        </>:<p>Clique em um texto, imagem ou no espaço de um conjunto. Para pegar “30 + texto”, clique no 30 e depois no botão <b>▦ conjunto</b> que aparece sobre ele.</p>}</div>

        <div className="cms-panel-block"><div className="cms-section-manager-head"><h3>Adicionar bloco</h3><span>na seção selecionada</span></div><div className="cms-block-library"><button type="button" onClick={()=>addCustomBlock("heading")}>H<br/><small>Título</small></button><button type="button" onClick={()=>addCustomBlock("text")}>¶<br/><small>Texto</small></button><button type="button" onClick={()=>addCustomBlock("button")}>▣<br/><small>Botão</small></button><button type="button" onClick={()=>addCustomBlock("image")}>▧<br/><small>Imagem</small></button></div><small className="cms-layout-lock-note">Selecione qualquer elemento da seção desejada e adicione um bloco. Para conjuntos como “30 + texto”, selecione ▦ conjunto, duplique e arraste o bloco inteiro.</small></div>

        <div className="cms-panel-block"><div className="cms-section-manager-head"><h3>Camadas / seções</h3><span>arraste · duplique · oculte</span></div><div className="cms-section-list">{sectionInstances.map((instance,index)=>{const catalog=sectionCatalog.get(instance.sourceId);const isCopy=instance.id!==instance.sourceId;return <div draggable onDragStart={()=>setDraggingSection(instance.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>dropSection(instance.id)} className={`cms-section-row${instance.hidden?" is-hidden":""}`} key={instance.id}><span className="cms-drag-handle" title="Arrastar">⋮⋮</span><div className="cms-section-name"><strong>{sectionLabel(instance)}</strong><small>{isCopy?"cópia":"original"}</small></div><div className="cms-section-buttons"><button type="button" disabled={index===0} onClick={()=>moveSection(instance.id,-1)} title="Subir">↑</button><button type="button" disabled={index===sectionInstances.length-1} onClick={()=>moveSection(instance.id,1)} title="Descer">↓</button><button type="button" disabled={catalog?.duplicateAllowed===false} onClick={()=>duplicateSection(instance.id)} title="Duplicar">⧉</button><button type="button" onClick={()=>toggleSection(instance.id)} title={instance.hidden?"Exibir":"Ocultar"}>{instance.hidden?"◉":"◌"}</button>{isCopy?<button type="button" className="danger" onClick={()=>deleteSection(instance.id)} title="Excluir cópia">×</button>:null}</div></div>})}</div><small className="cms-layout-lock-note">Também dá para arrastar pelo puxador que aparece sobre cada seção dentro da própria página. Simulador e checkout não são duplicáveis porque têm lógica dinâmica.</small></div>
        <button className="secondary-button" type="button" onClick={()=>void save()}>Salvar sem publicar</button>
      </aside>
    </div>:null}

    {doc&&tab==="manual"?<div className="cms-manual-editor"><div className="cms-manual-toolbar"><label>Página<select value={page} onChange={e=>setPage(Number(e.target.value))}>{(doc.draft?.pages||[]).map((p:any)=><option value={p.page} key={p.page}>Página {p.page}</option>)}</select></label><span>{doc.draft?.fieldCount||0} campos de texto · 22 páginas</span></div><div className="cms-manual-fields">{(manualPage?.fields||[]).map((field:any)=><label key={field.id}><span>{field.id}</span><textarea rows={Math.max(2,Math.min(5,Math.ceil(String(field.text).length/60)))} value={field.text} onChange={e=>mutate(draft=>{const p=draft.pages.find((x:any)=>x.page===page);const f=p.fields.find((x:any)=>x.id===field.id);f.text=e.target.value;return draft;})}/></label>)}</div><p className="fine-print">O texto publicado passa a ser a fonte do manual no Portal do Revendedor. O PDF-base original continua preservado em <code>private/manual</code>.</p></div>:null}

    {doc&&tab==="products"?<div className="cms-product-grid">{(doc.draft?.products||[]).map((product:any,index:number)=><article key={product.id}><img src={product.image} alt=""/><label>Nome<input value={product.name||""} onChange={e=>mutate(d=>{d.products[index].name=e.target.value;return d})}/></label><label>Descrição<input value={product.subtitle||""} onChange={e=>mutate(d=>{d.products[index].subtitle=e.target.value;return d})}/></label>{product.price!==undefined?<label>Preço exibido<input value={product.price||""} onChange={e=>mutate(d=>{d.products[index].price=e.target.value;return d})}/></label>:null}<label>Imagem<input value={product.image||""} onChange={e=>mutate(d=>{d.products[index].image=e.target.value;return d})}/></label>{product.anvisa!==undefined?<label>Processo ANVISA<input value={product.anvisa||""} readOnly/><small>Bloqueado para preservar exatamente 2535115572620267.</small></label>:null}</article>)}</div>:null}

    {doc&&tab==="media"?<div><form className="cms-upload" onSubmit={uploadMedia}><label>Enviar nova foto<input name="file" type="file" accept="image/*" required/></label><button className="primary-button" disabled={busy}>Enviar imagem</button></form><div className="cms-media-grid">{media.map(m=><article key={m.id}><img src={m.url||`/api/media/${m.id}`} alt={m.name}/><strong>{m.name}</strong><code>{m.url||`/api/media/${m.id}`}</code></article>)}</div></div>:null}
  </section>;
}
