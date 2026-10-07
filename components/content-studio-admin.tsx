"use client";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type DocType = "landing"|"manual"|"products"|"media";
type StudioDoc = {type:DocType;draft:any;published:any;updatedAt?:string|null;publishedAt?:string|null};
type PreviewDevice = "desktop"|"tablet"|"mobile";
type FreePlacement = {xPct:number;yPx:number;widthPct:number;z?:number};
type FreeElement = {id:string;kind:"text"|"image";sectionId:string;content?:string;src?:string;alt?:string;style?:Record<string,string>;placements?:Partial<Record<PreviewDevice,FreePlacement>>;groupId?:string};
type GroupSnapshot = {name:string;sectionId:string;items:Array<{kind:"text"|"image";content?:string;src?:string;alt?:string;style?:Record<string,string>;rect?:{xPct:number;yPx:number;widthPct:number}}>} ;
type EditorSelection = {
  key:string;
  kind:"text"|"image"|"free";
  itemKind?:"text"|"image";
  value?:string;
  originalValue?:string;
  mode?:string;
  sectionId?:string;
  legacyKeys?:string[];
  src?:string;
  alt?:string;
  snapshot?:Record<string,string>;
  rect?:{xPct:number;yPx:number;widthPct:number};
  freeId?:string;
  groupId?:string;
  group?:GroupSnapshot|null;
};
type TextItem = {key:string;value:string;originalValue:string;mode?:string;sectionId?:string;sectionLabel?:string;legacyKeys?:string[]};
type BuilderSection = {id:string;label:string};
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
  const freeElements=Array.isArray(value?.freeElements)?value.freeElements.map((item:any)=>structuredClone(item)):[];
  return {overrides:{...(value?.overrides||{})},fontScales,freeElements};
}

function recommendedMax(original:string){
  const length=original.trim().length;
  if(length<=30)return Math.max(36,Math.ceil(length*1.35));
  if(length<=90)return Math.ceil(length*1.45);
  return Math.ceil(length*1.65);
}

function uniqueFreeId(){
  if(typeof crypto!=="undefined"&&"randomUUID" in crypto)return `free-${crypto.randomUUID().slice(0,18)}`;
  return `free-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

function defaultPlacements(kind:"text"|"image"):Record<PreviewDevice,FreePlacement>{
  return {
    desktop:{xPct:8,yPx:90,widthPct:kind==="image"?30:42,z:30},
    tablet:{xPct:8,yPx:90,widthPct:kind==="image"?38:55,z:30},
    mobile:{xPct:6,yPx:80,widthPct:kind==="image"?54:88,z:30},
  };
}

function placementsFromRect(rect:EditorSelection["rect"],kind:"text"|"image"){
  const fallback=defaultPlacements(kind);
  if(!rect)return fallback;
  const x=Math.max(-20,Math.min(110,rect.xPct+2));
  const y=Math.max(-200,rect.yPx+18);
  const width=Math.max(5,Math.min(130,rect.widthPct));
  return {
    desktop:{xPct:x,yPx:y,widthPct:width,z:31},
    tablet:{xPct:x,yPx:y,widthPct:Math.min(92,Math.max(width,kind==="image"?30:40)),z:31},
    mobile:{xPct:Math.min(88,Math.max(4,x)),yPx:y,widthPct:Math.min(94,Math.max(width,kind==="image"?44:70)),z:31},
  } satisfies Record<PreviewDevice,FreePlacement>;
}

export function ContentStudioAdmin() {
  const [tab,setTab]=useState<DocType>("landing");
  const [doc,setDoc]=useState<StudioDoc|null>(null);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [selection,setSelection]=useState<EditorSelection|null>(null);
  const [texts,setTexts]=useState<TextItem[]>([]);
  const [sections,setSections]=useState<BuilderSection[]>([]);
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
    if(type==="landing"){setTexts([]);setSections([]);}
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
      if(undoStack.current.length>100)undoStack.current.shift();
    }
    redoStack.current=[];
    forceHistoryRender(value=>value+1);
  }

  function checkpoint(){
    if(tab!=="landing"||!doc)return;
    remember(doc.draft);
  }

  function patchFreeElement(id:string,patch:Partial<FreeElement>,message?:string,withCheckpoint=true){
    setDoc(current=>{
      if(!current||current.type!=="landing")return current;
      if(withCheckpoint)remember(current.draft);
      const next=landingDraft(current.draft);
      const index=next.freeElements.findIndex((item:FreeElement)=>item.id===id);
      if(index<0)return current;
      next.freeElements[index]={...next.freeElements[index],...structuredClone(patch)};
      return {...current,draft:next};
    });
    if(message)setNotice(message);
  }

  useEffect(()=>{
    const handler=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin)return;
      if(event.data?.type==="lordnutri-cms-select"){
        setSelection({
          key:String(event.data.key||""),
          kind:event.data.kind==="image"?"image":"text",
          value:typeof event.data.value==="string"?event.data.value:undefined,
          originalValue:typeof event.data.originalValue==="string"?event.data.originalValue:undefined,
          mode:event.data.mode,
          sectionId:event.data.sectionId,
          legacyKeys:Array.isArray(event.data.legacyKeys)?event.data.legacyKeys:[],
          src:typeof event.data.src==="string"?event.data.src:undefined,
          alt:typeof event.data.alt==="string"?event.data.alt:undefined,
          snapshot:event.data.snapshot&&typeof event.data.snapshot==="object"?event.data.snapshot:undefined,
          rect:event.data.rect&&typeof event.data.rect==="object"?event.data.rect:undefined,
          group:event.data.group&&typeof event.data.group==="object"?event.data.group:null,
        });
        return;
      }
      if(event.data?.type==="lordnutri-cms-free-select"){
        const id=String(event.data.id||"");
        if(!id)return;
        setSelection({key:`free:${id}`,kind:"free",itemKind:event.data.itemKind==="image"?"image":"text",freeId:id,sectionId:String(event.data.sectionId||"inicio"),groupId:typeof event.data.groupId==="string"?event.data.groupId:undefined});
        return;
      }
      if(event.data?.type==="lordnutri-cms-ready"){
        setTexts(Array.isArray(event.data.texts)?event.data.texts:[]);
        setSections(Array.isArray(event.data.sections)?event.data.sections:[]);
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
        setSelection(current=>current?.kind==="text"&&current.key===key?{...current,value}:current);
        return;
      }
      if(event.data?.type==="lordnutri-cms-free-patch"){
        const id=String(event.data.id||"");
        const patch=event.data.patch&&typeof event.data.patch==="object"?event.data.patch:{};
        if(id)patchFreeElement(id,patch,"Elemento atualizado.",true);
        return;
      }
      if(event.data?.type==="lordnutri-cms-free-placement"){
        const id=String(event.data.id||"");
        const device=event.data.device as PreviewDevice;
        const placement=event.data.placement as FreePlacement;
        if(!id||!["desktop","tablet","mobile"].includes(device)||!placement)return;
        setDoc(current=>{
          if(!current||current.type!=="landing")return current;
          remember(current.draft);
          const next=landingDraft(current.draft);
          const item=next.freeElements.find((entry:FreeElement)=>entry.id===id);
          if(!item)return current;
          item.placements={...(item.placements||{}),[device]:placement};
          return {...current,draft:next};
        });
        setNotice(`Posição salva para ${device==="desktop"?"desktop":device==="tablet"?"tablet":"celular"}.`);
        return;
      }
      if(event.data?.type==="lordnutri-cms-free-placement-batch"){
        const device=event.data.device as PreviewDevice;
        const items=Array.isArray(event.data.items)?event.data.items:[];
        if(!["desktop","tablet","mobile"].includes(device)||!items.length)return;
        setDoc(current=>{
          if(!current||current.type!=="landing")return current;
          remember(current.draft);
          const next=landingDraft(current.draft);
          for(const raw of items){
            const id=String(raw?.id||"");
            const placement=raw?.placement as FreePlacement;
            const item=next.freeElements.find((entry:FreeElement)=>entry.id===id);
            if(item&&placement)item.placements={...(item.placements||{}),[device]:placement};
          }
          return {...current,draft:next};
        });
        setNotice("Conjunto movido como uma unidade.");
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
      if(tab!=="landing"||busy)return;
      const target=event.target;
      if(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||(target instanceof HTMLElement&&target.isContentEditable))return;
      if(event.ctrlKey||event.metaKey){
        if(event.key.toLowerCase()==="z"){event.preventDefault();event.shiftKey?redo():undo();}
        else if(event.key.toLowerCase()==="y"){event.preventDefault();redo();}
        else if(event.key.toLowerCase()==="d"&&selection){event.preventDefault();duplicateSelection();}
        return;
      }
      if((event.key==="Delete"||event.key==="Backspace")&&selection?.kind==="free"){event.preventDefault();deleteSelectedFree();}
      if(selection?.kind==="free"&&selectedFree&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)){
        event.preventDefault();
        const step=event.shiftKey?10:2;
        const placement=selectedFree.placements?.[previewDevice]||defaultPlacements(selectedFree.kind)[previewDevice];
        checkpoint();
        if(event.key==="ArrowLeft")updatePlacement({xPct:placement.xPct-step/4},false);
        if(event.key==="ArrowRight")updatePlacement({xPct:placement.xPct+step/4},false);
        if(event.key==="ArrowUp")updatePlacement({yPx:placement.yPx-step},false);
        if(event.key==="ArrowDown")updatePlacement({yPx:placement.yPx+step},false);
      }
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
    setNotice("Alteração desfeita.");
  }
  function redo(){
    if(!doc||tab!=="landing"||!redoStack.current.length)return;
    const next=redoStack.current.pop();
    undoStack.current.push(structuredClone(doc.draft));
    setDoc({...doc,draft:next});
    forceHistoryRender(value=>value+1);
    setNotice("Alteração refeita.");
  }

  async function save(next=doc?.draft){
    if(!doc||busy)return;
    setBusy(true);setNotice("");
    try{
      const payload=tab==="landing"?landingDraft(next):next;
      const updated=await api(`/api/admin/cms/${tab}`,{method:"PATCH",body:JSON.stringify({draft:payload})});
      setDoc(updated);setPreviewVersion(value=>value+1);setNotice("Rascunho salvo.");
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
      setDoc(updated);setPreviewVersion(value=>value+1);setNotice("Publicado. Os elementos livres foram aplicados sem reescrever o HTML-base da landing.");
    }catch(error){setNotice(error instanceof Error?error.message:"Não foi possível publicar.");}
    finally{setBusy(false);}
  }

  function mutate(updater:(draft:any)=>any){if(!doc)return;setDoc({...doc,draft:updater(structuredClone(doc.draft))});}

  function changeSelectedText(value:string){
    if(!selection||selection.kind!=="text"||!doc)return;
    const original=selection.originalValue||"";
    const next=landingDraft(doc.draft);
    if(value===original){
      delete next.overrides[selection.key];
      for(const legacyKey of selection.legacyKeys||[])delete next.overrides[legacyKey];
    }else next.overrides[selection.key]=value;
    setDoc({...doc,draft:next});
    setSelection({...selection,value});
  }

  function setSelectedFontScale(scale:number){
    if(!selection||selection.kind!=="text"||!doc)return;
    checkpoint();
    const next=landingDraft(doc.draft);
    const safe=Math.min(1.4,Math.max(.8,Math.round(scale*20)/20));
    if(Math.abs(safe-1)<.001)delete next.fontScales[selection.key];
    else next.fontScales[selection.key]=safe;
    setDoc({...doc,draft:next});
    setNotice(`Tamanho do texto-base: ${Math.round(safe*100)}%.`);
  }

  function restoreSelectedText(){
    if(!selection||selection.kind!=="text"||!doc)return;
    checkpoint();
    const next=landingDraft(doc.draft);
    delete next.overrides[selection.key];
    delete next.fontScales[selection.key];
    for(const legacyKey of selection.legacyKeys||[])delete next.overrides[legacyKey];
    setDoc({...doc,draft:next});
    setSelection({...selection,value:selection.originalValue||""});
    setNotice("Texto-base restaurado.");
  }

  function focusText(item:TextItem){
    const legacyValue=(item.legacyKeys||[]).map(key=>doc?.draft?.overrides?.[key]).find(value=>typeof value==="string");
    const value=doc?.draft?.overrides?.[item.key]??legacyValue??item.value??item.originalValue;
    setSelection({key:item.key,kind:"text",value,originalValue:item.originalValue,mode:item.mode,sectionId:item.sectionId,legacyKeys:item.legacyKeys});
    iframeRef.current?.contentWindow?.postMessage({type:"lordnutri-cms-focus-text",key:item.key},window.location.origin);
  }

  function focusFree(item:FreeElement){
    setSelection({key:`free:${item.id}`,kind:"free",itemKind:item.kind,freeId:item.id,sectionId:item.sectionId,groupId:item.groupId});
    iframeRef.current?.contentWindow?.postMessage({type:"lordnutri-cms-focus-free",id:item.id},window.location.origin);
  }

  function addFree(kind:"text"|"image"){
    if(!doc)return;
    checkpoint();
    const id=uniqueFreeId();
    const sectionId=selection?.sectionId&&selection.sectionId!=="root"?selection.sectionId:"inicio";
    const item:FreeElement=kind==="text"?{
      id,kind,sectionId,content:"Novo texto",style:{fontFamily:"Arial, Helvetica, sans-serif",fontSize:"32px",fontWeight:"800",color:"#f5f2e9",lineHeight:"1.1",textAlign:"left"},placements:defaultPlacements(kind),
    }:{
      id,kind,sectionId,src:"/brand/mix10-box-transparent-v3-web.webp",alt:"",style:{objectFit:"contain",objectPosition:"center",opacity:"1"},placements:defaultPlacements(kind),
    };
    const next=landingDraft(doc.draft);next.freeElements.push(item);setDoc({...doc,draft:next});
    setSelection({key:`free:${id}`,kind:"free",itemKind:kind,freeId:id,sectionId});
    setNotice(kind==="text"?"Novo texto adicionado. Arraste pelo ✥.":"Nova imagem adicionada. Troque a URL ou arraste pelo ✥.");
    requestAnimationFrame(()=>iframeRef.current?.contentWindow?.postMessage({type:"lordnutri-cms-focus-free",id},window.location.origin));
  }

  function duplicateSelection(){
    if(!doc||!selection)return;
    checkpoint();
    const next=landingDraft(doc.draft);
    let first:FreeElement|null=null;
    if(selection.kind==="free"&&selection.freeId){
      const source=next.freeElements.find((entry:FreeElement)=>entry.id===selection.freeId);
      if(source?.groupId){
        const groupMembers=(next.freeElements as FreeElement[]).filter(entry=>entry.groupId===source.groupId);
        const newGroupId=`group-${uniqueFreeId().replace(/^free-/,"")}`;
        for(const member of groupMembers){
          const copy=structuredClone(member);
          copy.id=uniqueFreeId();copy.groupId=newGroupId;copy.placements={};
          for(const device of ["desktop","tablet","mobile"] as PreviewDevice[]){
            const placement=member.placements?.[device]||defaultPlacements(member.kind)[device];
            copy.placements[device]={...placement,xPct:placement.xPct+2,yPx:placement.yPx+18,z:(placement.z||30)+1};
          }
          next.freeElements.push(copy);if(!first)first=copy;
        }
      }else if(source){
        const copy=structuredClone(source);copy.id=uniqueFreeId();copy.placements={};
        for(const device of ["desktop","tablet","mobile"] as PreviewDevice[]){
          const placement=source.placements?.[device]||defaultPlacements(source.kind)[device];
          copy.placements[device]={...placement,xPct:placement.xPct+2,yPx:placement.yPx+18,z:(placement.z||30)+1};
        }
        next.freeElements.push(copy);first=copy;
      }
    }else{
      const id=uniqueFreeId();
      if(selection.kind==="text")first={id,kind:"text",sectionId:selection.sectionId||"inicio",content:selection.value||selection.originalValue||"Texto duplicado",style:{...(selection.snapshot||{})},placements:placementsFromRect(selection.rect,"text")};
      else if(selection.kind==="image")first={id,kind:"image",sectionId:selection.sectionId||"inicio",src:selection.src||"/brand/mix10-box-transparent-v3-web.webp",alt:selection.alt||"",style:{...(selection.snapshot||{})},placements:placementsFromRect(selection.rect,"image")};
      if(first)next.freeElements.push(first);
    }
    if(!first)return;
    setDoc({...doc,draft:next});
    setSelection({key:`free:${first.id}`,kind:"free",itemKind:first.kind,freeId:first.id,sectionId:first.sectionId,groupId:first.groupId});
    setNotice(first.groupId?"Conjunto duplicado como camadas agrupadas.":"Elemento duplicado como camada livre. Agora você pode arrastar e redimensionar sem mexer no original.");
    requestAnimationFrame(()=>iframeRef.current?.contentWindow?.postMessage({type:"lordnutri-cms-focus-free",id:first!.id},window.location.origin));
  }

  function duplicateSelectedGroup(){
    if(!doc||!selection?.group?.items?.length)return;
    checkpoint();
    const next=landingDraft(doc.draft);
    const groupId=`group-${uniqueFreeId().replace(/^free-/,"")}`;
    let first:FreeElement|null=null;
    for(const source of selection.group.items){
      const id=uniqueFreeId();
      const item:FreeElement=source.kind==="image"
        ? {id,kind:"image",sectionId:selection.group.sectionId,src:source.src||"/brand/mix10-box-transparent-v3-web.webp",alt:source.alt||"",style:{...(source.style||{})},placements:placementsFromRect(source.rect,"image"),groupId}
        : {id,kind:"text",sectionId:selection.group.sectionId,content:source.content||"Texto",style:{...(source.style||{})},placements:placementsFromRect(source.rect,"text"),groupId};
      next.freeElements.push(item);if(!first)first=item;
    }
    if(!first)return;
    setDoc({...doc,draft:next});
    setSelection({key:`free:${first.id}`,kind:"free",itemKind:first.kind,freeId:first.id,sectionId:first.sectionId,groupId});
    setNotice(`Conjunto “${selection.group.name}” duplicado. Arrastar qualquer item do grupo move todos juntos.`);
    requestAnimationFrame(()=>iframeRef.current?.contentWindow?.postMessage({type:"lordnutri-cms-focus-free",id:first!.id},window.location.origin));
  }

  function deleteSelectedFree(){
    if(!doc||selection?.kind!=="free"||!selection.freeId)return;
    checkpoint();
    const next=landingDraft(doc.draft);next.freeElements=next.freeElements.filter((item:FreeElement)=>item.id!==selection.freeId);setDoc({...doc,draft:next});
    setSelection(null);setNotice("Elemento livre excluído.");
  }

  function deleteSelectedGroup(){
    if(!doc||!selectedFree?.groupId)return;
    checkpoint();
    const groupId=selectedFree.groupId;
    const next=landingDraft(doc.draft);next.freeElements=next.freeElements.filter((item:FreeElement)=>item.groupId!==groupId);setDoc({...doc,draft:next});
    setSelection(null);setNotice("Conjunto livre excluído.");
  }

  function updateSelectedFree(patch:Partial<FreeElement>,withCheckpoint=false){
    if(selection?.kind!=="free"||!selection.freeId)return;
    patchFreeElement(selection.freeId,patch,undefined,withCheckpoint);
    if(patch.sectionId)setSelection({...selection,sectionId:patch.sectionId});
  }

  function updatePlacement(patch:Partial<FreePlacement>,withCheckpoint=false){
    if(!selectedFree||selection?.kind!=="free")return;
    if(withCheckpoint)checkpoint();
    const current=selectedFree.placements?.[previewDevice]||defaultPlacements(selectedFree.kind)[previewDevice];
    updateSelectedFree({placements:{...(selectedFree.placements||{}),[previewDevice]:{...current,...patch}}},false);
  }

  function changeFreeFont(delta:number){
    if(!selectedFree||selectedFree.kind!=="text")return;
    checkpoint();
    const current=parseFloat(selectedFree.style?.fontSize||"32")||32;
    const next=Math.max(10,Math.min(140,current+delta));
    updateSelectedFree({style:{...(selectedFree.style||{}),fontSize:`${next}px`}},false);
    setNotice(`Fonte do elemento livre: ${next}px.`);
  }

  function layerFree(delta:number){
    if(!selectedFree)return;
    const placement=selectedFree.placements?.[previewDevice]||defaultPlacements(selectedFree.kind)[previewDevice];
    updatePlacement({z:Math.max(1,Math.min(999,(placement.z||30)+delta))},true);
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
    for(const item of filteredTexts){const label=item.sectionLabel||item.sectionId||"Geral";const group=map.get(label)||[];group.push(item);map.set(label,group);}
    return Array.from(map.entries());
  },[filteredTexts]);

  async function uploadMedia(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;const data=new FormData(form);setBusy(true);setNotice("");
    try{const item=await api("/api/admin/media",{method:"POST",body:data});setMedia(current=>[{...item,mime_type:item.mimeType,size_bytes:item.sizeBytes},...current]);form.reset();setNotice("Imagem enviada e pronta para uso.");}
    catch(error){setNotice(error instanceof Error?error.message:"Falha no upload.");}
    finally{setBusy(false);}
  }

  const selectedFree:FreeElement|undefined=selection?.kind==="free"&&selection.freeId?(doc?.draft?.freeElements||[]).find((item:FreeElement)=>item.id===selection.freeId):undefined;
  const selectedOriginal=selection?.kind==="text"?(selection.originalValue||""):"";
  const selectedLimit=selection?.kind==="text"?recommendedMax(selectedOriginal):0;
  const selectedTooLong=Boolean(selection?.kind==="text"&&(selection.value||"").length>selectedLimit);
  const selectedFontScale=selection?.kind==="text"?Number(doc?.draft?.fontScales?.[selection.key]||1):1;
  const selectedPlacement=selectedFree?(selectedFree.placements?.[previewDevice]||defaultPlacements(selectedFree.kind)[previewDevice]):null;

  return <section className="portal-card cms-studio">
    <div className="card-title"><div><span className="section-kicker">EDITOR DE CONTEÚDO</span><h2>Landing, manual, produtos e mídia</h2></div><div className="cms-actions">{tab==="landing"?<><button className="secondary-button compact" disabled={!undoStack.current.length||busy} onClick={undo} title="Ctrl/Cmd + Z">↶ Desfazer</button><button className="secondary-button compact" disabled={!redoStack.current.length||busy} onClick={redo} title="Ctrl/Cmd + Shift + Z">↷ Refazer</button></>:null}<button className="secondary-button compact" disabled={busy||!doc} onClick={()=>void save()}>Salvar rascunho</button><button className="primary-button compact" disabled={busy||!doc} onClick={()=>void publish()}>Publicar</button></div></div>
    <div className="cms-tabs">{([['landing','Landing Page'],['manual','Manual'],['products','Produtos'],['media','Mídia']] as Array<[DocType,string]>).map(([id,label])=><button className={tab===id?"active":""} onClick={()=>setTab(id)} key={id}>{label}</button>)}</div>
    {notice?<p className="cms-notice">{notice}</p>:null}
    {busy&&!doc?<p>Carregando…</p>:null}

    {doc&&tab==="landing"?<div className="cms-builder-shell cms-free-canvas-shell">
      <div className="cms-builder-main">
        <div className="cms-builder-heading"><div><h3>Free Canvas</h3><p>Edite a copy original normalmente. Quando quiser liberdade, <strong>duplique um texto ou imagem</strong> e ele vira uma camada independente: arraste, redimensione, duplique e exclua sem reescrever o HTML-base da landing.</p></div><span className="cms-builder-status">FREE CANVAS · 0.7.0</span></div>
        <div className="cms-canvas-toolbar" aria-label="Ferramentas do canvas"><span>Canvas:</span>{([['desktop','Desktop'],['tablet','Tablet'],['mobile','Celular']] as Array<[PreviewDevice,string]>).map(([id,label])=><button type="button" key={id} className={previewDevice===id?"active":""} onClick={()=>setPreviewDevice(id)}>{label}</button>)}<i className="cms-toolbar-separator"/><button type="button" onClick={()=>addFree("text")}>＋ Texto</button><button type="button" onClick={()=>addFree("image")}>＋ Imagem</button><button type="button" disabled={!selection} onClick={duplicateSelection}>⧉ Duplicar</button></div>
        <div className={`cms-canvas-frame device-${previewDevice}`}><iframe ref={iframeRef} key={previewVersion} className="cms-preview" src={`/?cms_preview=draft&cms_editor=1&cms_device=${previewDevice}&v=${previewVersion}`} title="Free Canvas da landing page" onLoad={()=>iframeRef.current?.contentWindow?.postMessage({type:"lordnutri-cms-live",content:landingDraft(doc.draft)},window.location.origin)}/></div>
      </div>

      <aside className="cms-editor-panel cms-free-canvas-panel">
        <div className="cms-panel-block cms-safe-lock"><div className="cms-section-manager-head"><h3>Como funciona</h3><span>base + camadas</span></div><p>O layout original continua intacto. <strong>Textos e imagens duplicados viram camadas livres</strong>, então você pode fazer composição tipo Canva sem desmontar checkout, grids ou responsividade da página original.</p><small>Arraste pelo botão ✥ que aparece no elemento. Redimensione pelo ↘. A posição é guardada separadamente para desktop, tablet e celular.</small></div>

        <div className="cms-panel-block"><div className="cms-section-manager-head"><h3>Elemento selecionado</h3><span>{selection?.sectionId||"clique na LP"}</span></div>
          {!selection?<p>Clique em um texto ou imagem. Para mover livremente, clique em <strong>Duplicar</strong> — o original permanece seguro.</p>:null}
          {selection?.kind==="text"?<>
            <label>Conteúdo<textarea rows={Math.max(3,Math.min(10,Math.ceil((selection.value||"").length/46)))} value={selection.value||""} onFocus={checkpoint} onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>changeSelectedText(event.target.value)} /></label>
            <div className={`cms-copy-meter${selectedTooLong?" is-warning":""}`}><span>{(selection.value||"").length} caracteres</span><span>referência: ~{selectedLimit}</span></div>
            <div className="cms-safe-type-size"><div><strong>Tamanho do texto-base</strong><small>{Math.round(selectedFontScale*100)}% do original</small></div><div className="cms-safe-size-buttons"><button type="button" disabled={selectedFontScale<=.8} onClick={()=>setSelectedFontScale(selectedFontScale-.05)}>A−</button><button type="button" onClick={()=>setSelectedFontScale(1)} disabled={Math.abs(selectedFontScale-1)<.001}>100%</button><button type="button" disabled={selectedFontScale>=1.4} onClick={()=>setSelectedFontScale(selectedFontScale+.05)}>A+</button></div></div>
            <div className="cms-element-actions"><button type="button" onClick={duplicateSelection}>⧉ Duplicar como camada livre</button>{selection.group?.items?.length?<button type="button" onClick={duplicateSelectedGroup}>▦ Duplicar conjunto</button>:null}<button type="button" onClick={restoreSelectedText}>Restaurar original</button></div>
          </>:null}
          {selection?.kind==="image"?<><div className="cms-selected-image-preview">{selection.src?<img src={selection.src} alt=""/>:null}</div><code>{selection.src||"imagem"}</code><div className="cms-element-actions"><button type="button" onClick={duplicateSelection}>⧉ Duplicar imagem como camada livre</button>{selection.group?.items?.length?<button type="button" onClick={duplicateSelectedGroup}>▦ Duplicar conjunto</button>:null}</div><small className="cms-layout-lock-note">A imagem original não é movida. A cópia é livre e pode ser reposicionada.</small></>:null}
          {selection?.kind==="free"&&selectedFree?<>
            <div className="cms-free-badge">CAMADA LIVRE · {selectedFree.kind==="text"?"TEXTO":"IMAGEM"}</div>
            {selectedFree.kind==="text"?<label>Conteúdo<textarea rows={4} value={selectedFree.content||""} onFocus={checkpoint} onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>updateSelectedFree({content:event.target.value},false)}/></label>:<><label>URL da imagem<input value={selectedFree.src||""} onFocus={checkpoint} onChange={(event:ChangeEvent<HTMLInputElement>)=>updateSelectedFree({src:event.target.value},false)}/></label><label>Texto alternativo<input value={selectedFree.alt||""} onFocus={checkpoint} onChange={(event:ChangeEvent<HTMLInputElement>)=>updateSelectedFree({alt:event.target.value},false)}/></label></>}
            <label>Seção<select value={selectedFree.sectionId} onFocus={checkpoint} onChange={(event:ChangeEvent<HTMLSelectElement>)=>updateSelectedFree({sectionId:event.target.value},false)}>{sections.filter(item=>item.id!=="root").map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            {selectedFree.kind==="text"?<div className="cms-safe-type-size"><div><strong>Tamanho da fonte</strong><small>{selectedFree.style?.fontSize||"herdado"}</small></div><div className="cms-safe-size-buttons"><button type="button" onClick={()=>changeFreeFont(-2)}>A−</button><button type="button" onClick={()=>changeFreeFont(2)}>A+</button></div></div>:null}
            {selectedPlacement?<div className="cms-free-position-grid"><label>X (%)<input type="number" step="1" value={Math.round(selectedPlacement.xPct*10)/10} onFocus={checkpoint} onChange={(event:ChangeEvent<HTMLInputElement>)=>updatePlacement({xPct:Number(event.target.value)},false)}/></label><label>Y (px)<input type="number" step="1" value={Math.round(selectedPlacement.yPx)} onFocus={checkpoint} onChange={(event:ChangeEvent<HTMLInputElement>)=>updatePlacement({yPx:Number(event.target.value)},false)}/></label><label>Largura (%)<input type="number" min="3" max="140" step="1" value={Math.round(selectedPlacement.widthPct*10)/10} onFocus={checkpoint} onChange={(event:ChangeEvent<HTMLInputElement>)=>updatePlacement({widthPct:Number(event.target.value)},false)}/></label><label>Camada<input type="number" min="1" max="999" value={selectedPlacement.z||30} onFocus={checkpoint} onChange={(event:ChangeEvent<HTMLInputElement>)=>updatePlacement({z:Number(event.target.value)},false)}/></label></div>:null}
            <div className="cms-element-actions"><button type="button" onClick={duplicateSelection}>⧉ Duplicar</button><button type="button" onClick={()=>layerFree(1)}>Trazer à frente</button><button type="button" onClick={()=>layerFree(-1)}>Mandar atrás</button><button type="button" className="danger" onClick={deleteSelectedFree}>Excluir</button>{selectedFree.groupId?<button type="button" className="danger" onClick={deleteSelectedGroup}>Excluir conjunto</button>:null}</div>
            <small className="cms-layout-lock-note">Você está ajustando <strong>{previewDevice}</strong>. Troque para celular/tablet no topo para criar posições independentes por breakpoint.</small>
          </>:null}
        </div>

        <div className="cms-panel-block"><div className="cms-section-manager-head"><h3>Camadas livres</h3><span>{(doc.draft?.freeElements||[]).length}</span></div><div className="cms-free-layer-list">{(doc.draft?.freeElements||[]).length?(doc.draft.freeElements as FreeElement[]).map((item,index)=><button type="button" className={selection?.freeId===item.id?"active":""} onClick={()=>focusFree(item)} key={item.id}><b>{index+1}</b><span>{item.kind==="text"?(item.content||"Novo texto").slice(0,52):"Imagem"}</span><small>{item.groupId?"▦ ":""}{sections.find(section=>section.id===item.sectionId)?.label||item.sectionId}</small></button>):<p>Nenhuma camada livre ainda. Duplique algo da LP ou use ＋ Texto / ＋ Imagem.</p>}</div></div>

        <details className="cms-panel-block cms-builder-details"><summary>Textos originais da página ({texts.length})</summary><label>Buscar texto<input value={search} onChange={(event:ChangeEvent<HTMLInputElement>)=>setSearch(event.target.value)} placeholder="Ex.: MIX10, kit, revenda…" /></label><div className="cms-text-groups">{groupedTexts.map(([label,items])=><details key={label} open={Boolean(search)}><summary>{label}<span>{items.length}</span></summary><div>{items.map(item=>{const legacyValue=(item.legacyKeys||[]).map(key=>doc.draft?.overrides?.[key]).find(value=>typeof value==="string");const current=String(doc.draft?.overrides?.[item.key]??legacyValue??item.value??item.originalValue);return <button type="button" key={item.key} className={selection?.key===item.key?"active":""} onClick={()=>focusText(item)}><span>{current.slice(0,110)}{current.length>110?"…":""}</span></button>})}</div></details>)}</div></details>
        <button className="secondary-button" type="button" onClick={()=>void save()}>Salvar sem publicar</button>
      </aside>
    </div>:null}

    {doc&&tab==="manual"?<div className="cms-manual-editor"><div className="cms-manual-toolbar"><label>Página<select value={page} onChange={(event:ChangeEvent<HTMLSelectElement>)=>setPage(Number(event.target.value))}>{(doc.draft?.pages||[]).map((item:any)=><option value={item.page} key={item.page}>Página {item.page}</option>)}</select></label><span>{doc.draft?.fieldCount||0} campos de texto · 22 páginas</span></div><div className="cms-manual-fields">{(manualPage?.fields||[]).map((field:any)=><label key={field.id}><span>{field.id}</span><textarea rows={Math.max(2,Math.min(5,Math.ceil(String(field.text).length/60)))} value={field.text} onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>mutate(draft=>{const currentPage=draft.pages.find((item:any)=>item.page===page);const currentField=currentPage.fields.find((item:any)=>item.id===field.id);currentField.text=event.target.value;return draft;})}/></label>)}</div><p className="fine-print">O texto publicado passa a ser a fonte do manual no Portal do Revendedor. O PDF-base original continua preservado em <code>private/manual</code>.</p></div>:null}

    {doc&&tab==="products"?<div className="cms-product-grid">{(doc.draft?.products||[]).map((product:any,index:number)=><article key={product.id}><img src={product.image} alt=""/><label>Nome<input value={product.name||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products[index].name=event.target.value;return draft})}/></label><label>Descrição<input value={product.subtitle||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products[index].subtitle=event.target.value;return draft})}/></label>{product.price!==undefined?<label>Preço exibido<input value={product.price||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products[index].price=event.target.value;return draft})}/></label>:null}<label>Imagem<input value={product.image||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>mutate(draft=>{draft.products[index].image=event.target.value;return draft})}/></label>{product.anvisa!==undefined?<label>Processo ANVISA<input value={product.anvisa||""} readOnly/><small>Bloqueado para preservar exatamente 2535115572620267.</small></label>:null}</article>)}</div>:null}

    {doc&&tab==="media"?<div><form className="cms-upload" onSubmit={uploadMedia}><label>Enviar nova foto<input name="file" type="file" accept="image/*" required/></label><button className="primary-button" disabled={busy}>Enviar imagem</button></form><div className="cms-media-grid">{media.map(item=><article key={item.id}><img src={item.url||`/api/media/${item.id}`} alt={item.name}/><strong>{item.name}</strong><code>{item.url||`/api/media/${item.id}`}</code></article>)}</div></div>:null}
  </section>;
}
