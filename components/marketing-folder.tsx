"use client";

import { useState } from "react";

// Imagem pública propositalmente: o destinatário do WhatsApp precisa abri-la sem conta.
// Não registra cliques como vendas nem como envios confirmados.
const FOLDER_PATH = "/materiais/folder-mix10pro.png";

export function MarketingFolder() {
  const [notice, setNotice] = useState("");

  async function share() {
    const url = new URL(FOLDER_PATH, window.location.origin).toString();
    const message = `Conheça o MIX10 PRO! Veja nosso folder digital: ${url}`;
    // No celular compatível, disponibiliza a imagem real para escolher o WhatsApp.
    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(FOLDER_PATH, { cache: "force-cache" });
        if (!response.ok) throw new Error("FOLDER_UNAVAILABLE");
        const image = new File([await response.blob()], "folder-mix10pro.png", { type: "image/png" });
        if (navigator.canShare({ files: [image] })) {
          await navigator.share({ files: [image], title: "Folder digital MIX10 PRO", text: "Conheça o MIX10 PRO!" });
          setNotice("Compartilhamento preparado no aplicativo escolhido. O envio depende da confirmação nele.");
          return;
        }
      } catch (error) {
        // Cancelar a folha de compartilhamento não deve disparar outra janela.
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setNotice("WhatsApp aberto com o link do folder. Confirme o envio na conversa.");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(FOLDER_PATH, window.location.origin).toString());
      setNotice("Link do folder copiado.");
    } catch { setNotice("Não foi possível copiar. Use o botão de baixar ou abrir a imagem."); }
  }

  return <section className="portal-card marketing-folder" aria-label="Folder digital MIX10 PRO">
    <div className="marketing-folder-preview"><img src={FOLDER_PATH} alt="Folder digital MIX10 PRO com apresentação dos 10 ativos da fórmula" loading="lazy" /></div>
    <div className="marketing-folder-info">
      <span className="section-kicker">MATERIAL DE DIVULGAÇÃO</span>
      <h2>Folder digital MIX10 PRO</h2>
      <p>Imagem pronta para apresentar o produto aos interessados. Você pode visualizar, baixar ou compartilhar pelo WhatsApp.</p>
      <div className="marketing-folder-actions">
        <button type="button" className="primary-button compact" onClick={()=>void share()}>Compartilhar no WhatsApp</button>
        <a className="secondary-button compact" href={FOLDER_PATH} download="folder-mix10pro.png">Baixar imagem</a>
        <a className="secondary-button compact" href={FOLDER_PATH} target="_blank" rel="noopener noreferrer">Abrir folder</a>
        <button type="button" className="secondary-button compact" onClick={()=>void copy()}>Copiar link</button>
      </div>
      <p className="fine-print">No celular compatível você pode escolher o WhatsApp para enviar a imagem. No computador, abre uma mensagem com o link público. Compartilhar não confirma envio nem compra.</p>
      {notice ? <p role="status" className="portal-notice">{notice}</p> : null}
    </div>
  </section>;
}
