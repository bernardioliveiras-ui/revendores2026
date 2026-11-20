"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Material = {id:string;title:string;file_name:string;mime_type:string;size_bytes:number;created_at:string};
export function ResellerMaterials({admin=false}:{admin?:boolean}) {
  const [items,setItems]=useState<Material[]>([]);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{
    try {const r=await fetch("/api/reseller/materials",{cache:"no-store"});const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Não foi possível carregar os materiais.");
      setItems(data.materials||[]);setMessage("");
    } catch(e){setMessage(e instanceof Error?e.message:"Erro ao carregar os materiais.");}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);
  async function upload(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy)return; setBusy(true);setMessage("");
    const form=event.currentTarget;const data=new FormData(form);
    try {const r=await fetch("/api/admin/reseller-materials",{method:"POST",body:data});const body=await r.json();
      if(!r.ok) throw new Error(body.error||"Falha ao enviar.");
      form.reset();await load();setMessage("Material publicado para os revendedores.");
    } catch(e){setMessage(e instanceof Error?e.message:"Falha ao enviar.");}
    finally{setBusy(false);}
  }
  async function remove(id:string,title:string){
    if(busy||!window.confirm(`Excluir o material “${title}”?`))return;
    setBusy(true);setMessage("");
    try {const r=await fetch("/api/admin/reseller-materials",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({id})});const body=await r.json();
      if(!r.ok)throw new Error(body.error||"Falha ao remover.");await load();setMessage("Material removido.");
    }catch(e){setMessage(e instanceof Error?e.message:"Falha ao remover.");}finally{setBusy(false);}
  }
  return <section className="portal-card"><div className="card-title"><div><h2>Materiais de divulgação</h2><p>Banners, vídeos e PDFs atualizados para baixar.</p></div><button type="button" className="ghost-button" onClick={()=>void load()}>Atualizar</button></div>
    {admin?<form className="portal-form" onSubmit={upload} style={{marginBottom:20}}><h3>Adicionar novo material</h3><label>Título<input name="title" required maxLength={180} placeholder="Ex.: Banner campanha de novembro"/></label><label>Arquivo<input type="file" name="file" required accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf"/></label><small>Imagens, vídeos MP4/WebM e PDF de até 20 MB. Vídeos maiores precisam ser compactados.</small><button className="primary-button" disabled={busy}>{busy?"Enviando…":"Publicar material"}</button></form>:null}
    {message?<p role="status">{message}</p>:null}
    {loading?<p>Carregando materiais…</p>:items.length===0?<p>Nenhum material adicional publicado. Consulte também o folder e o manual acima.</p>:<div className="simple-table">{items.map(item=><div key={item.id} style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",padding:"12px 0"}}><div style={{flex:"1 1 220px"}}><strong>{item.title}</strong><p style={{overflowWrap:"anywhere"}}>{item.file_name} · {(item.size_bytes/1024/1024).toFixed(1)} MB</p></div><a className="primary-button compact" href={`/api/reseller/materials/${item.id}`} download>Baixar</a>{admin?<button className="secondary-button compact" disabled={busy} onClick={()=>void remove(item.id,item.title)}>Excluir</button>:null}</div>)}</div>}
  </section>;
}
