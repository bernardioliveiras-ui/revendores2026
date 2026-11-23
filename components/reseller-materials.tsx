"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Material = {id:string;title:string;file_name:string;mime_type:string;size_bytes:number;created_at:string};
type ManualInfo = {title:string;file_name:string;updated_at:string};

export function ResellerMaterials({admin=false}:{admin?:boolean}) {
  const [items,setItems]=useState<Material[]>([]);
  const [manualInfo,setManualInfo]=useState<ManualInfo|null>(null);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [editingId,setEditingId]=useState<string|null>(null);

  const load=useCallback(async()=>{
    try {
      const [res,manualRes]=await Promise.all([
        fetch("/api/reseller/materials",{cache:"no-store"}),
        admin?fetch("/api/admin/reseller-materials",{cache:"no-store"}):Promise.resolve(null),
      ]);
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Não foi possível carregar os materiais.");
      setItems(data.materials||[]);
      if(manualRes){
        const manual=await manualRes.json();
        if(!manualRes.ok)throw new Error(manual.error||"Não foi possível consultar o manual.");
        setManualInfo(manual.manual||null);
      }
      setMessage("");
    }catch(error){setMessage(error instanceof Error?error.message:"Erro ao carregar os materiais.");}
    finally{setLoading(false);}
  },[admin]);
  useEffect(()=>{void load();},[load]);

  async function upload(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;setBusy(true);setMessage("");
    const form=event.currentTarget;
    try{
      const response=await fetch("/api/admin/reseller-materials",{method:"POST",body:new FormData(form)});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Falha ao publicar.");
      form.reset();await load();setMessage("Material publicado para os revendedores.");
    }catch(error){setMessage(error instanceof Error?error.message:"Falha ao publicar.");}
    finally{setBusy(false);}
  }

  async function replaceManual(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;setBusy(true);setMessage("");
    const form=event.currentTarget;
    const data=new FormData(form);
    data.set("kind", "manual");
    try{
      const response=await fetch("/api/admin/reseller-materials",{method:"PUT",body:data});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Não foi possível substituir o manual.");
      form.reset();await load();
      setMessage("Manual atualizado. O link dos revendedores continua o mesmo.");
    }catch(error){setMessage(error instanceof Error?error.message:"Não foi possível substituir o manual.");}
    finally{setBusy(false);}
  }

  async function updateMaterial(event:FormEvent<HTMLFormElement>,id:string){
    event.preventDefault();if(busy)return;setBusy(true);setMessage("");
    const data=new FormData(event.currentTarget);
    data.set("id",id);
    try{
      const response=await fetch("/api/admin/reseller-materials",{method:"PUT",body:data});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Não foi possível atualizar.");
      setEditingId(null);await load();setMessage("Material atualizado no mesmo link.");
    }catch(error){setMessage(error instanceof Error?error.message:"Não foi possível atualizar.");}
    finally{setBusy(false);}
  }

  async function remove(id:string,title:string){
    if(busy||!window.confirm(`Excluir o material “${title}”?`))return;
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/admin/reseller-materials",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({id})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Falha ao remover.");
      await load();setMessage("Material removido.");
    }catch(error){setMessage(error instanceof Error?error.message:"Falha ao remover.");}
    finally{setBusy(false);}
  }

  return <section className="portal-card bko-material-editor">
    <div className="card-title"><div><h2>Materiais de divulgação</h2><p>Banners, vídeos e PDFs atualizados para baixar.</p></div><button type="button" className="ghost-button" onClick={()=>void load()}>Atualizar</button></div>
    {admin?<div className="bko-material-admin">
      <form className="portal-form bko-manual-replacement" onSubmit={replaceManual}>
        <h3>Substituir Manual do Revendedor</h3>
        <p>Envie uma nova versão do PDF principal. O revendedor abrirá o novo arquivo pelo link atual, sem precisar mudar nada no portal.</p>
        {manualInfo?<small>Publicado: {manualInfo.file_name} · atualizado em {new Date(manualInfo.updated_at).toLocaleString("pt-BR")}</small>:<small>O manual original do projeto está publicado.</small>}
        <label>Título do manual<input name="title" defaultValue={manualInfo?.title||"Manual do Revendedor LORD NUTRI"} required maxLength={180}/></label>
        <label>Novo PDF<input type="file" name="file" accept="application/pdf,.pdf" required/></label>
        <div className="bko-material-actions"><button className="primary-button compact" disabled={busy}>{busy?"Salvando…":"Substituir PDF principal"}</button><a className="secondary-button compact" href="/api/reseller/manual?edition=material" target="_blank" rel="noopener noreferrer">Abrir PDF atual</a></div>
      </form>
      <form className="portal-form" onSubmit={upload}>
        <h3>Adicionar novo material</h3>
        <label>Título<input name="title" required maxLength={180} placeholder="Ex.: Banner campanha de novembro"/></label>
        <label>Arquivo<input type="file" name="file" required accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf"/></label>
        <small>Imagens, vídeos MP4/WebM e PDFs de até 20 MB.</small>
        <button className="primary-button compact" disabled={busy}>{busy?"Enviando…":"Publicar material"}</button>
      </form>
    </div>:null}
    {message?<p role="status" className="portal-notice">{message}</p>:null}
    {loading?<p>Carregando materiais…</p>:items.length===0?<p>Nenhum material adicional publicado. Consulte também o folder e o manual acima.</p>:
      <div className="bko-material-list">{items.map(item=><article key={item.id} className="bko-material-row">
        <div className="bko-material-detail"><strong>{item.title}</strong><p>{item.file_name} · {(item.size_bytes/1024/1024).toFixed(1)} MB</p></div>
        <div className="bko-material-actions">
          {item.mime_type==="application/pdf"?<a className="secondary-button compact" href={`/api/reseller/materials/${item.id}`} target="_blank" rel="noopener noreferrer">Visualizar PDF</a>:null}
          <a className="secondary-button compact" href={`/api/reseller/materials/${item.id}`} download>Baixar</a>
          {admin?<button type="button" className="secondary-button compact" disabled={busy} onClick={()=>setEditingId(editingId===item.id?null:item.id)}>{editingId===item.id?"Fechar edição":"Substituir arquivo"}</button>:null}
          {admin?<button type="button" className="secondary-button compact" disabled={busy} onClick={()=>void remove(item.id,item.title)}>Excluir</button>:null}
        </div>
        {admin&&editingId===item.id?<form className="portal-form bko-material-edit" onSubmit={event=>updateMaterial(event,item.id)}>
          <label>Título<input name="title" defaultValue={item.title} required maxLength={180}/></label>
          <label>Arquivo novo (opcional se deseja apenas renomear)<input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf"/></label>
          <button className="primary-button compact" disabled={busy}>{busy?"Salvando…":"Salvar alterações"}</button>
        </form>:null}
      </article>)}</div>}
  </section>;
}
