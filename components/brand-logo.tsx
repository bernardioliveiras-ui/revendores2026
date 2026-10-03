/* eslint-disable @next/next/no-img-element */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <span className={`brand-logo${compact ? " brand-logo--compact" : ""}`}>
    <img src="/brand/lord-nutri-transparent-v022.png" alt="LORD NUTRI GROUP" width={508} height={491} decoding="async" />
  </span>;
}
