/* eslint-disable @next/next/no-img-element */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <span className={compact ? "lordnutri-logo compact-logo" : "lordnutri-logo"}><img src="/brand/lordnutri-logo.png" alt="LORD NUTRI GROUP" /></span>;
}
