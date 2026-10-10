"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {LANDING_TEXT_FIELDS,resolveLandingTexts,validateLandingTexts,type LandingTexts} from "@/lib/landing-texts";
import "@/app/landing-text-studio.css";
type Doc={texts:LandingTexts;revision:string;publishedAt:string|null};
async function request(init:RequestInit={}){
 const response=await fetch("/api/admin/landing-texts",{...init,cache:"no-store",headers:{"content-type":"application/json","x-landing-studio":"1",...init.headers}});
 const body=await response.json().catch(()=>({error:"Resposta inválida."}));
 if(!response.ok)throw Error(body.error||"Não foi possível concluir.");return body as Doc;
}
export function LandingTextStudio({onDirtyChange}:{onDirtyChange:(value:boolean)=>void}){
 const [doc,setDoc]=useState<Doc|null>(null);const [baseline,setBaseline]=useState("");const [busy,setBusy]=useState(true);const [notice,setNotice]=useState("");const [section,setSection]=useState("");const [search,setSearch]=useState("");const [device,setDevice]=useState<"pc"|"mobile">("pc");const [frameWidth,setFrameWidth]=useState(500);
 const frame=useRef<HTMLIFrameElement>(null);const viewport=useRef<HTMLDivElement>(null);const inFlight=useRef(false);const dirty=!!doc&&JSON.stringify(doc.texts)!==baseline;
 const load=useCallback(async()=>{if(inFlight.current)return;inFlight.current=true;setBusy(true);try{const saved=await request();setDoc(saved);setBaseline(JSON.stringify(saved.texts));setNotice("");}catch(error){setNotice(error instanceof Error?error.message:"Não foi possível carregar.");}finally{inFlight.current=false;setBusy(false);}},[]);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active)void load();});return()=>{active=false;};},[load]);
 useEffect(()=>{onDirtyChange(dirty||busy);return()=>onDirtyChange(false);},[dirty,busy,onDirtyChange]);
 useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(dirty||busy){event.preventDefault();event.returnValue="";}};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty,busy]);
 const send=useCallback(()=>{if(doc)frame.current?.contentWindow?.postMessage({type:"LORD_TEXTS_PREVIEW",texts:doc.texts},location.origin);},[doc]);
 useEffect(()=>{const timer=setTimeout(send,140);return()=>clearTimeout(timer);},[send]);
 useEffect(()=>{const receive=(event:MessageEvent)=>{if(event.origin===location.origin&&event.source===frame.current?.contentWindow&&event.data?.type==="LORD_TEXTS_READY")send();};window.addEventListener("message",receive);return()=>window.removeEventListener("message",receive);},[send]);
 const loaded=!!doc;
 useEffect(()=>{if(!viewport.current)return;const observer=new ResizeObserver(entries=>setFrameWidth(entries[0].contentRect.width));observer.observe(viewport.current);return()=>observer.disconnect();},[loaded]);
 async function save(publish=false){
  if(!doc||inFlight.current)return;inFlight.current=true;setBusy(true);setNotice("");
  try{const saved=await request({method:"PUT",body:JSON.stringify({texts:validateLandingTexts(doc.texts),revision:doc.revision,publish})});setDoc(saved);setBaseline(JSON.stringify(saved.texts));setNotice(publish?"Textos publicados. A LP já usa essa versão em novos acessos.":"Rascunho salvo. A LP pública continua na última publicação.");}catch(error){setNotice(error instanceof Error?error.message:"Não foi possível salvar.");}finally{inFlight.current=false;setBusy(false);}
 }
 const entries=Object.entries(LANDING_TEXT_FIELDS).filter(([,field])=>(!section||field.section===section)&&(!search||[field.label,field.text].some(text=>text.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))));
 const width=device==="pc"?1440:390;const scale=Math.min(1,Math.max(100,frameWidth)/width);
 return <section className="portal-card text-studio"><div className="card-title"><div><span className="section-kicker">STUDIO · TEXTOS DA LP</span><h2>Edite os textos com o layout protegido</h2><p>Fontes, cores, imagens, posições e espaçamentos seguem o layout atual. Confira a prévia antes de publicar.</p></div><div className="cms-actions"><button className="secondary-button compact" disabled={!doc||busy} onClick={()=>void save()}>Salvar rascunho</button><button className="primary-button compact" disabled={!doc||busy} onClick={()=>void save(true)}>Publicar textos</button></div></div>
  {notice?<p role="status" className="cms-notice">{notice}</p>:null}
  {!doc?<div><p>{busy?"Carregando textos…":"Não foi possível abrir o Studio."}</p>{!busy?<button className="secondary-button" onClick={()=>void load()}>Tentar novamente</button>:null}</div>:<>
   <p className="text-studio-state">{dirty?"Alterações ainda não salvas.":"Rascunho salvo."}{doc.publishedAt?` Última publicação: ${new Date(doc.publishedAt).toLocaleString("pt-BR")}.`:" Os textos iniciais são os do ZIP 1.8.0."}</p>
   <div className="text-studio-layout"><fieldset className="text-studio-form" disabled={busy}><legend className="sr-only">Textos da landing page</legend><div className="text-studio-filters"><label htmlFor="studio-section">Seção<select id="studio-section" value={section} onChange={e=>setSection(e.target.value)}><option value="">Todas as seções</option>{[...new Set(Object.values(LANDING_TEXT_FIELDS).map(f=>f.section))].map(name=><option key={name}>{name}</option>)}</select></label><label htmlFor="studio-search">Buscar texto<input id="studio-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Digite uma palavra do texto atual"/></label></div><p className="fine-print">{entries.length} campos encontrados. Trechos em destaque têm campos separados para manter a apresentação atual.</p>
    <div className="text-studio-fields">{entries.map(([key,field])=><article key={key}><label htmlFor={`lp-${key}`}><small>{field.section}</small><strong>{field.label}</strong></label><textarea id={`lp-${key}`} rows={field.text.length>130?4:2} maxLength={field.maxLength} value={doc.texts[key]} onChange={e=>setDoc(current=>current?{...current,texts:{...current.texts,[key]:e.target.value}}:current)}/><div><small>{doc.texts[key]?.length||0}/{field.maxLength} caracteres</small><button type="button" onClick={()=>setDoc(current=>current?{...current,texts:{...current.texts,[key]:field.text}}:current)}>Restaurar este texto</button></div></article>)}</div>
   </fieldset><aside className="text-studio-preview"><div className="text-studio-preview-controls"><strong>Prévia ao editar</strong><nav aria-label="Tamanho da prévia"><button type="button" aria-pressed={device==="pc"} onClick={()=>setDevice("pc")}>PC</button><button type="button" aria-pressed={device==="mobile"} onClick={()=>setDevice("mobile")}>Celular</button></nav></div><p className="fine-print">A prévia acompanha os textos desta tela. Pagamento e links externos ficam desativados aqui.</p><div className="text-studio-viewport" ref={viewport}><iframe title="Prévia dos textos da LP" ref={frame} src="/painel/studio/previa" onLoad={send} style={{width,height:640/scale,transform:`scale(${scale})`,transformOrigin:"top left"}}/></div></aside></div>
   <div className="cms-actions"><button className="secondary-button compact" disabled={busy} onClick={()=>{if(!dirty||confirm("Descartar as alterações desta tela e recarregar o rascunho salvo?"))void load();}}>Recarregar rascunho</button><button className="secondary-button compact" disabled={busy} onClick={()=>{if(confirm("Restaurar os textos originais do ZIP 1.8.0 neste rascunho? A publicação é feita separadamente."))setDoc(current=>current?{...current,texts:resolveLandingTexts({})}:current);}}>Restaurar textos originais</button></div>
  </>}
 </section>;
}
