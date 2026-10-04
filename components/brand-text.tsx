export function BrandText({ text }: { text: string }) {
  return <>{text.split(/(LORD NUTRI|MIX10 PRO)/g).map((part, index) =>
    part === "LORD NUTRI" ? <span className="lnr-lord-name" key={index}>{part}</span> :
    part === "MIX10 PRO" ? <span className="lnr-mix-name" key={index}><span>MIX10</span>{" "}<span>PRO</span></span> : part
  )}</>;
}
