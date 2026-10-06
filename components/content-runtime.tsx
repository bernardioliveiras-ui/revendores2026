"use client";
import { useEffect } from "react";

type EditableMode = "text" | "brand" | "lines";

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

function editableScope(element: HTMLElement, root: HTMLElement): HTMLElement {
  const section = element.closest<HTMLElement>("section[id]");
  if (section && root.contains(section)) return section;
  const identified = element.closest<HTMLElement>("[id]");
  if (identified && identified !== root && root.contains(identified)) return identified;
  return root;
}

function scopeName(scope: HTMLElement, root: HTMLElement) {
  return scope === root ? "root" : scope.id || "root";
}

function stableKey(kind: "text" | "rich" | "image", element: HTMLElement, root: HTMLElement) {
  const scope = editableScope(element, root);
  return `${kind}:${scopeName(scope, root)}:${domPath(element, scope)}`;
}

function legacyKey(kind: "text" | "rich" | "image", element: HTMLElement, root: HTMLElement) {
  return `${kind}:${domPath(element, root)}`;
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

function isLineBreakRichText(element: HTMLElement) {
  if (!element.childElementCount) return false;
  if (!element.textContent?.trim()) return false;
  return Array.from(element.children).every((child) => child.tagName === "BR");
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

function renderLineBreakText(element: HTMLElement, value: string) {
  const fragment = document.createDocumentFragment();
  value.split(/\r?\n/).forEach((line, index) => {
    if (index) fragment.append(document.createElement("br"));
    fragment.append(document.createTextNode(line));
  });
  element.replaceChildren(fragment);
}

function selectedValue(element: HTMLElement, mode: EditableMode) {
  if (mode === "lines") return element.innerText.trim();
  return element.textContent?.trim() || "";
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
        // A identidade tipográfica é editada pelo elemento externo como um único campo.
        // Não exponha os spans internos (LORD / MIX10 / PRO) como campos separados.
        if (html.matches(".lnr-lord-name, .lnr-mix-name, .lnr-mix-name *")) continue;

        const textLeaf = isTextLeaf(html);
        const brandRichText = isBrandRichText(html);
        const lineBreakRichText = isLineBreakRichText(html);

        // REGRA DE SEGURANÇA DO LAYOUT:
        // somente folhas de texto e dois formatos ricos conhecidos são editáveis.
        // Elementos compostos (strong/span/cards/grids) nunca recebem textContent do CMS.
        if (!textLeaf && !brandRichText && !lineBreakRichText) continue;

        const mode: EditableMode = brandRichText ? "brand" : lineBreakRichText ? "lines" : "text";
        const kind = mode === "text" ? "text" : "rich";
        const key = stableKey(kind, html, root);
        const scope = editableScope(html, root);
        const blockLegacy = scopeName(scope, root) === "lord-nutri";
        const oldTextKey = legacyKey("text", html, root);
        const oldRichKey = legacyKey("rich", html, root);

        let value: unknown = overrides[key];
        // Mantém as edições 0.3.x onde a posição antiga ainda é confiável. No bloco
        // institucional LORD NUTRI, os overrides antigos são ignorados de propósito
        // para eliminar a frase incorreta já publicada e partir da copy revisada.
        if (typeof value !== "string" && !blockLegacy) {
          value = mode === "text"
            ? overrides[oldTextKey]
            : overrides[oldRichKey] ?? overrides[oldTextKey];
        }

        if (typeof value === "string") {
          if (mode === "brand") renderBrandRichText(html, value);
          else if (mode === "lines") renderLineBreakText(html, value);
          else html.textContent = value;
        }

        if (editor) {
          html.dataset.cmsKey = key;
          html.dataset.cmsLayoutSafe = "1";
          html.dataset.cmsMode = mode;
        }
      }

      for (const img of Array.from(root.querySelectorAll<HTMLImageElement>("img"))) {
        const key = stableKey("image", img, root);
        const oldKey = legacyKey("image", img, root);
        if (editor) {
          img.dataset.cmsKey = key;
          img.dataset.cmsLayoutSafe = "1";
          img.dataset.cmsMode = "image";
        }
        const imageValue = imageOverrides[key] ?? imageOverrides[oldKey];
        if (typeof imageValue === "string" && imageValue) {
          img.setAttribute("src", imageValue);
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
          const mode = (target.dataset.cmsMode || "text") as EditableMode;
          window.parent.postMessage(
            {
              type: "lordnutri-cms-select",
              key: target.dataset.cmsKey,
              kind: isImage ? "image" : "text",
              value: isImage ? target.currentSrc || target.src : selectedValue(target, mode),
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
