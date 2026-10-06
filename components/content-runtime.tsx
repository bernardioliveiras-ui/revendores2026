"use client";
import { useEffect } from "react";

function domPath(el: Element, root: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== root) {
    const currentNode: Element = node;
    const parentElement: HTMLElement | null = currentNode.parentElement;
    if (!parentElement) break;
    const siblings: Element[] = Array.from(parentElement.children).filter(
      (child): child is Element => child.tagName === currentNode.tagName,
    );
    const index = siblings.indexOf(currentNode) + 1;
    parts.unshift(`${currentNode.tagName.toLowerCase()}:nth-of-type(${index})`);
    node = parentElement;
  }
  return parts.join(">");
}

export function ContentRuntime() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lnr-page");
    if (!root) return;
    const url = new URL(window.location.href);
    const preview = url.searchParams.get("cms_preview") === "draft";
    const editor = url.searchParams.get("cms_editor") === "1";
    let cleanupClicks = () => {};

    const run = async () => {
      const [response, productResponse] = await Promise.all([
        fetch(`/api/public/cms/landing${preview ? "?preview=draft" : ""}`, { cache: "no-store" }),
        fetch(`/api/public/cms/products${preview ? "?preview=draft" : ""}`, { cache: "no-store" }),
      ]);
      const body = await response.json().catch(() => ({ content: null }));
      const productBody = await productResponse.json().catch(() => ({ content: null }));
      const content = body?.content || {};
      const overrides = content.overrides || {};
      const imageOverrides = content.imageOverrides || {};
      const products = productBody?.content?.products || [];

      const elements = Array.from(root.querySelectorAll("*"));
      for (const el of elements) {
        const html = el as HTMLElement;
        if (["SCRIPT","STYLE","SVG","PATH","INPUT","TEXTAREA","SELECT","OPTION"].includes(el.tagName)) continue;
        const ownTextNodes = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
        if (!ownTextNodes.length) continue;
        const key = `text:${domPath(el, root)}`;
        html.dataset.cmsKey = key;
        if (typeof overrides[key] === "string") {
          const textNode = ownTextNodes[0];
          textNode.textContent = overrides[key];
        }
      }
      for (const img of Array.from(root.querySelectorAll("img"))) {
        const key = `image:${domPath(img, root)}`;
        (img as HTMLElement).dataset.cmsKey = key;
        if (typeof imageOverrides[key] === "string" && imageOverrides[key]) img.setAttribute("src", imageOverrides[key]);
      }


      const mix = products.find((item: any) => item.id === "mix10pro");
      if (mix) {
        const anvisa = root.querySelector(".lnr-anvisa strong");
        if (anvisa) anvisa.textContent = `ANVISA nº 2535115572620267`;
        const productImg = root.querySelector(".lnr-product-visual img") as HTMLImageElement | null;
        if (productImg && mix.image) productImg.src = mix.image;
      }
      for (const kitId of ["kit20","kit50"]) {
        const item = products.find((x: any) => x.id === kitId);
        if (!item) continue;
        const card = Array.from(root.querySelectorAll(".lnr-kit")).find((node) => node.querySelector("h3")?.textContent?.toLowerCase() === kitId);
        if (card) {
          const price = card.querySelector(".lnr-price");
          if (price && item.price) price.textContent = item.price;
        }
      }

      if (editor) {
        const handler: EventListener = (event) => {
          const mouseEvent = event as MouseEvent;
          const target = (mouseEvent.target as HTMLElement | null)?.closest?.("[data-cms-key]") as HTMLElement | null;
          if (!target || !root.contains(target)) return;
          mouseEvent.preventDefault();
          mouseEvent.stopPropagation();
          root.querySelectorAll(".cms-selected").forEach((x) => x.classList.remove("cms-selected"));
          target.classList.add("cms-selected");
          const isImage = target.tagName === "IMG";
          window.parent.postMessage(
            {
              type: "lordnutri-cms-select",
              key: target.dataset.cmsKey,
              kind: isImage ? "image" : "text",
              value: isImage
                ? (target as HTMLImageElement).src
                : target.textContent?.trim() || "",
            },
            window.location.origin,
          );
        };
        root.addEventListener("click", handler, true);
        cleanupClicks = () => root.removeEventListener("click", handler, true);
      }
    };
    void run();
    return () => cleanupClicks();
  }, []);
  return null;
}
