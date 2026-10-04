/* eslint-disable @next/next/no-img-element */
export function BrandLogo({ compact = false, mark = false }: { compact?: boolean; mark?: boolean }) {
  const src = mark ? "/brand/lordnutri-mark.png" : "/brand/lordnutri-logo-gold-v3-web.webp";
  const alt = mark ? "Símbolo LORD NUTRI" : "LORD NUTRI GROUP";
  return <span className={`${compact ? "lordnutri-logo compact-logo" : "lordnutri-logo"}${mark ? " brand-mark" : ""}`}><img src={src} alt={alt} decoding="async" /></span>;
}
