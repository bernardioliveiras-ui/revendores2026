/* eslint-disable @next/next/no-img-element */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <span className={compact ? "lordnutri-logo compact-logo" : "lordnutri-logo"}>
    <img src="/brand/lordnutri-group.png" alt="LORD NUTRI GROUP" width={508} height={491} decoding="async" />
    <img className="lordnutri-logo-lettering" src="/brand/lordnutri-group.png" alt="" aria-hidden="true" width={508} height={491} decoding="async" />
  </span>;
}
