/* eslint-disable @next/next/no-img-element */
export function BrandLogo({ compact = false, mark = false }: { compact?: boolean; mark?: boolean }) {
  const src = "/brand/lordnutri-logo-2026.png";
  const alt = mark ? "Símbolo LORD NUTRI" : "LORD NUTRI GROUP";
  return <span className={`${compact ? "lordnutri-logo compact-logo" : "lordnutri-logo"}${mark ? " brand-mark" : ""}`}><img src={src} alt={alt} width={2048} height={2048} decoding="async" /></span>;
}
