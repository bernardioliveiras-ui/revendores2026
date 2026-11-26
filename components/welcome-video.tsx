function normalizedEmbed(input: string) {
  const value = input.trim();
  if (!value) return "";
  try {
    const url = new URL(value, "https://revendedores.mix10pro.com.br");
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return /^[A-Za-z0-9_-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/embed/")) return `https://www.youtube-nocookie.com${url.pathname}${url.search}`;
      const id = url.searchParams.get("v") || url.pathname.match(/^\/shorts\/([^/]+)/)?.[1] || "";
      return /^[A-Za-z0-9_-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part)) || "";
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
    if (host === "player.vimeo.com" && url.pathname.startsWith("/video/")) return value;
  } catch {
    return "";
  }
  return "";
}

function normalizedVideo(input: string) {
  const value = input.trim();
  if (!value) return "";
  if (/^\/(?!\/)/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

export function WelcomeVideo({ sourceUrl = "", embedUrl = "", videoUrl = "" }: { sourceUrl?: string; embedUrl?: string; videoUrl?: string }) {
  const candidate = sourceUrl || embedUrl || videoUrl;
  const safeEmbed = normalizedEmbed(candidate) || normalizedEmbed(embedUrl);
  const safeVideo = safeEmbed ? "" : normalizedVideo(candidate) || normalizedVideo(videoUrl);
  return <div className="welcome-video">{safeEmbed ? <iframe src={safeEmbed} title="Boas-vindas da LORD NUTRI" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : safeVideo ? <video controls playsInline preload="metadata"><source src={safeVideo} /></video> : <div className="video-pending"><img src="/brand/lordnutri-logo-2026.png" alt="LORD NUTRI GROUP" /><p>Boas-vindas à LORD NUTRI</p><span>O vídeo de boas-vindas pode ser configurado no BKO em Conteúdo → Mídia.</span></div>}</div>;
}
