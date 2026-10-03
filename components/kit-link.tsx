"use client";
import type { KitId } from "@/lib/kits";
export function KitLink({ kit, children, className }: { kit: KitId; children: React.ReactNode; className: string }) {
  return <a href={`/?kit=${kit}#checkout`} className={className} onClick={(event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set("kit", kit);
    url.hash = "checkout";
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new CustomEvent("lordnutri:select-kit", { detail: kit }));
    document.getElementById("checkout")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }}>{children}</a>;
}
