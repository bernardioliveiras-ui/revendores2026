"use client";

import { FileImage, FileVideo } from "lucide-react";

/** Assets already published in /public. No sample files or generated links. */
const materials = [
  { title: "Folder digital MIX10 PRO", kind: "IMAGEM", path: "/materiais/folder-mix10pro.png", description: "Folder de divulgação do produto." },
  { title: "Imagem do produto MIX10 PRO", kind: "IMAGEM", path: "/checkout-mix10/produto.webp", description: "Imagem do produto para consulta e compartilhamento." },
  { title: "Apresentação da fórmula", kind: "IMAGEM", path: "/checkout-mix10/formula.webp", description: "Imagem informativa publicada no site." },
  { title: "Vídeo do produto", kind: "VÍDEO", path: "/checkout-mix10/video-produto.mp4", description: "Vídeo de apresentação do MIX10 PRO." },
] as const;

export function InfluencerMaterialLibrary() {
  return <section className="lord-material-library" aria-label="Materiais disponíveis para influenciadores">
    <div className="lord-material-library-header"><h2>Materiais disponíveis</h2><p>Arquivos reais publicados no site. Confira o conteúdo antes de compartilhar.</p></div>
    <div className="lord-material-grid">{materials.map(item=><article key={item.path} className="lord-material-tile">
      <div className="lord-material-icon">{item.kind==="VÍDEO"?<FileVideo size={24}/>:<FileImage size={24}/>}</div>
      <div className="lord-material-copy"><small>{item.kind}</small><h3>{item.title}</h3><p>{item.description}</p>
        <div className="lord-material-actions"><a href={item.path} target="_blank" rel="noopener noreferrer">Visualizar</a><a href={item.path} download>Baixar</a><button type="button" onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`Material LORD NUTRI: ${location.origin}${item.path}`)}`,"_blank","noopener,noreferrer")}>WhatsApp</button></div>
      </div>
    </article>)}</div>
  </section>;
}
