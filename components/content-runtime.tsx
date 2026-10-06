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

function isTextLeaf(element: HTMLElement) {
  if (element.childElementCount > 0) return false;
  return Boolean(element.textContent?.trim());
}

function isBrandRichText(element: HTMLElement) {
  if (!element.childElementCount) return false;
  return Array.from(element.children).every((child) =>
    child.classList.contains("lnr-lord-name") || child.classList.contains("lnr-mix-name"),
  );
}

function renderBrandRichText(element: HTMLElement, value: string) {
  const fragment = document.createDocumentFragment();
  const parts = value.split(/(LORD NUTRI|MIX10 PRO)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part === "LORD NUTRI") {
      const span = document.createElement("span");
      span.className = "lnr-lord-name";
      span.textContent = part;
      fragment.append(span);
      continue;
    }
    if (part === "MIX10 PRO") {
      const wrapper = document.createElement("span");
      wrapper.className = "lnr-mix-name";
      const mix = document.createElement("span");
      mix.textContent = "MIX10";
      const pro = document.createElement("span");
      pro.textContent = "PRO";
      wrapper.append(mix, document.createTextNode(" "), pro);
      fragment.append(wrapper);
      continue;
    }
    fragment.append(document.createTextNode(part));
  }
  element.replaceChildren(fragment);
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

      const elements = Array.from(root.querySelectorAll<HTMLElement>("*"));
      for (const html of elements) {
        if (["SCRIPT", "STYLE", "SVG", "PATH", "INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(html.tagName)) continue;
        const ownTextNodes = Array.from(html.childNodes).filter(
          (node): node is Text => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
        );
        if (!ownTextNodes.length) continue;
        const path = domPath(html, root);
        const key = `text:${path}`;
        const richKey = `rich:${path}`;
        const brandRichText = isBrandRichText(html);

        // Compatibilidade com tudo o que já foi salvo no CMS 0.3.x.
        if (typeof overrides[key] === "string") ownTextNodes[0].textContent = overrides[key];

        // Para blocos compostos apenas pela identidade LORD NUTRI/MIX10 PRO, o novo
        // campo rico permite editar a frase inteira e recria somente os spans de marca.
        // O elemento externo, classes e grid permanecem intactos.
        if (brandRichText && typeof overrides[richKey] === "string") {
          renderBrandRichText(html, overrides[richKey]);
        }

        if (editor && brandRichText) {
          html.dataset.cmsKey = richKey;
          html.dataset.cmsLayoutSafe = "1";
        } else if (editor && isTextLeaf(html)) {
          html.dataset.cmsKey = key;
          html.dataset.cmsLayoutSafe = "1";
        }
      }

      for (const img of Array.from(root.querySelectorAll<HTMLImageElement>("img"))) {
        const key = `image:${domPath(img, root)}`;
        if (editor) img.dataset.cmsKey = key;
        if (typeof imageOverrides[key] === "string" && imageOverrides[key]) {
          img.setAttribute("src", imageOverrides[key]);
          img.removeAttribute("srcset");
        }
      }

      const mix = products.find((item: any) => item.id === "mix10pro");
      if (mix) {
        const anvisa = root.querySelector(".lnr-anvisa strong");
        if (anvisa) anvisa.textContent = "ANVISA nº 2535115572620267";
        const productImg = root.querySelector(".lnr-product-visual img") as HTMLImageElement | null;
        if (productImg && mix.image) productImg.src = mix.image;
      }
      for (const kitId of ["kit20", "kit50"]) {
        const item = products.find((entry: any) => entry.id === kitId);
        if (!item) continue;
        const card = Array.from(root.querySelectorAll(".lnr-kit")).find(
          (node) => node.querySelector("h3")?.textContent?.toLowerCase() === kitId,
        );
        if (card) {
          const price = card.querySelector(".lnr-price");
          if (price && item.price) price.textContent = item.price;
        }
      }

      if (editor) {
        const handler: EventListener = (event) => {
          const mouseEvent = event as MouseEvent;
          const origin = mouseEvent.target;
          if (!(origin instanceof Element)) return;
          const target = origin.closest<HTMLElement>("[data-cms-key]");
          if (!target || !root.contains(target)) return;
          mouseEvent.preventDefault();
          mouseEvent.stopPropagation();
          root.querySelectorAll(".cms-selected").forEach((item) => item.classList.remove("cms-selected"));
          target.classList.add("cms-selected");
          const isImage = target instanceof HTMLImageElement;
          window.parent.postMessage(
            {
              type: "lordnutri-cms-select",
              key: target.dataset.cmsKey,
              kind: isImage ? "image" : "text",
              value: isImage ? target.currentSrc || target.src : target.textContent?.trim() || "",
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
