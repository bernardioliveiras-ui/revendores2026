import { BrandLogo } from "@/components/brand-logo";
/* eslint-disable @next/next/no-img-element */
export function WelcomeVideo({ embedUrl = "", videoUrl = "" }: { embedUrl?: string; videoUrl?: string }) {
  const safeEmbed = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//.test(embedUrl) ? embedUrl : "";
  const safeVideo = /^(https:\/\/|\/(?!\/))/.test(videoUrl) ? videoUrl : "";
  return <div className="welcome-video">{safeEmbed ? <iframe src={safeEmbed} title="Boas-vindas da LORD NUTRI" allow="fullscreen; picture-in-picture" allowFullScreen /> : safeVideo ? <video controls playsInline preload="metadata"><source src={safeVideo} type="video/mp4" /></video> : <div className="video-pending"><BrandLogo /><p>Boas-vindas à LORD NUTRI</p><span>Conheça o programa e escolha seu ponto de partida abaixo.</span></div>}</div>;
}
