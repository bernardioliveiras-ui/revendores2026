"use client";
import { useEffect } from "react";

type EditableMode = "text" | "brand" | "lines";
type StyleKey = "fontFamily" | "fontSize" | "fontWeight" | "fontStyle" | "color" | "textAlign" | "letterSpacing" | "lineHeight" | "textTransform" | "textDecoration";
type EditableStyle = Partial<Record<StyleKey, string>>;
type LandingContent = {
  overrides?: Record<string, string>;
  imageOverrides?: Record<string, string>;
  styleOverrides?: Record<string, EditableStyle>;
  sectionOrder?: string[];
};

type EditableEntry = {
  element: HTMLElement;
  key: string;
  oldTextKey: string;
  oldRichKey: string;
  mode: EditableMode;
  scope: string;
  originalValue: string;
};

type ImageEntry = {
  element: HTMLImageElement;
  key: string;
  oldKey: string;
  originalSrc: string;
  originalSrcset: string | null;
};

const styleKeys: StyleKey[] = [
  "fontFamily", "fontSize", "fontWeight", "fontStyle", "color", "textAlign",
  "letterSpacing", "lineHeight", "textTransform", "textDecoration",
];

const sectionLabels: Record<string, string> = {
  inicio: "Abertura",
  "lord-nutri": "LORD NUTRI",
  mix10pro: "MIX10 PRO",
  avaliacoes: "Avaliações Google",
  modelo: "Como começar",
  simulador: "Simulador",
  kits: "Kits",
  duvidas: "Dúvidas",
  checkout: "Checkout",
};

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

function appendBrandTokens(fragment: DocumentFragment, value: string) {
  const parts = value.split(/(LORD\s*NUTRI|MIX10\s*PRO)/gi);
  for (const part of parts) {
    if (!part) continue;
    const normalized = part.replace(/\s+/g, " ").trim().toUpperCase();
    if (normalized === "LORD NUTRI") {
      const span = document.createElement("span");
      span.className = "lnr-lord-name";
      span.textContent = "LORD NUTRI";
      fragment.append(span);
      continue;
    }
    if (normalized === "MIX10 PRO") {
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
}

function renderBrandRichText(element: HTMLElement, value: string) {
  const fragment = document.createDocumentFragment();
  appendBrandTokens(fragment, value);
  element.replaceChildren(fragment);
}

function renderLineBreakText(element: HTMLElement, value: string) {
  const fragment = document.createDocumentFragment();
  value.split(/\r?\n/).forEach((line, index) => {
    if (index) fragment.append(document.createElement("br"));
    appendBrandTokens(fragment, line);
  });
  element.replaceChildren(fragment);
}

function renderText(element: HTMLElement, value: string, mode: EditableMode) {
  // A identidade visual da marca funciona em QUALQUER campo editável. Assim,
  // copiar/colar "MIX10 PRO" ou "LORD NUTRI" para outra seção preserva o visual.
  if (mode === "lines") renderLineBreakText(element, value);
  else renderBrandRichText(element, value);
}

function selectedValue(element: HTMLElement, mode: EditableMode) {
  if (mode === "lines") return element.innerText.trim();
  return element.textContent?.trim() || "";
}

function captureStyle(element: HTMLElement): EditableStyle {
  const computed = window.getComputedStyle(element);
  return {
    fontFamily: computed.fontFamily,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    fontStyle: computed.fontStyle,
    color: computed.color,
    textAlign: computed.textAlign,
    letterSpacing: computed.letterSpacing,
    lineHeight: computed.lineHeight,
    textTransform: computed.textTransform,
    textDecoration: computed.textDecorationLine,
  };
}

function applyEditableStyle(element: HTMLElement, style: EditableStyle | undefined) {
  for (const key of styleKeys) element.style[key] = "";
  if (!style) return;
  for (const key of styleKeys) {
    const value = style[key];
    if (typeof value === "string" && value.trim()) element.style[key] = value;
  }
}

function builderBlocks(root: HTMLElement) {
  return Array.from(root.children).flatMap((child) => {
    if (!(child instanceof HTMLElement)) return [];
    if (child.matches("section[id]")) return [{ id: child.id, element: child }];
    if (child.classList.contains("lnr-proof-section")) return [{ id: "avaliacoes", element: child }];
    return [];
  });
}

function applySectionOrder(root: HTMLElement, order: string[] | undefined) {
  if (!Array.isArray(order) || !order.length) return;
  const blocks = builderBlocks(root);
  const byId = new Map(blocks.map((item) => [item.id, item.element]));
  const normalized = [...order.filter((id) => byId.has(id)), ...blocks.map((item) => item.id).filter((id) => !order.includes(id))];
  const footer = Array.from(root.children).find((item) => item instanceof HTMLElement && item.tagName === "FOOTER") || null;
  for (const id of normalized) {
    const element = byId.get(id);
    if (element) root.insertBefore(element, footer);
  }
}

export function ContentRuntime() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lnr-page");
    if (!root) return;
    const url = new URL(window.location.href);
    const preview = url.searchParams.get("cms_preview") === "draft";
    const editor = url.searchParams.get("cms_editor") === "1";
    let cleanupClicks = () => {};
    let cleanupMessages = () => {};

    const run = async () => {
      const [response, productResponse] = await Promise.all([
        fetch(`/api/public/cms/landing${preview ? "?preview=draft" : ""}`, { cache: "no-store" }),
        fetch(`/api/public/cms/products${preview ? "?preview=draft" : ""}`, { cache: "no-store" }),
      ]);
      const body = await response.json().catch(() => ({ content: null }));
      const productBody = await productResponse.json().catch(() => ({ content: null }));
      const initialContent = (body?.content || {}) as LandingContent;
      const products = productBody?.content?.products || [];
      const entries: EditableEntry[] = [];
      const imageEntries: ImageEntry[] = [];

      const elements = Array.from(root.querySelectorAll<HTMLElement>("*"));
      for (const html of elements) {
        if (["SCRIPT", "STYLE", "SVG", "PATH", "INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(html.tagName)) continue;
        // A identidade tipográfica é editada pelo elemento externo como um único campo.
        // Não exponha os spans internos (LORD / MIX10 / PRO) como campos separados.
        if (html.matches(".lnr-lord-name, .lnr-mix-name, .lnr-mix-name *")) continue;

        const textLeaf = isTextLeaf(html);
        const brandRichText = isBrandRichText(html);
        const lineBreakRichText = isLineBreakRichText(html);
        if (!textLeaf && !brandRichText && !lineBreakRichText) continue;

        const mode: EditableMode = brandRichText ? "brand" : lineBreakRichText ? "lines" : "text";
        const kind = mode === "text" ? "text" : "rich";
        const key = stableKey(kind, html, root);
        const scope = editableScope(html, root);
        const entry: EditableEntry = {
          element: html,
          key,
          oldTextKey: legacyKey("text", html, root),
          oldRichKey: legacyKey("rich", html, root),
          mode,
          scope: scopeName(scope, root),
          originalValue: selectedValue(html, mode),
        };
        entries.push(entry);
        if (editor) {
          html.dataset.cmsKey = key;
          html.dataset.cmsLayoutSafe = "1";
          html.dataset.cmsMode = mode;
        }
      }

      for (const img of Array.from(root.querySelectorAll<HTMLImageElement>("img"))) {
        const entry: ImageEntry = {
          element: img,
          key: stableKey("image", img, root),
          oldKey: legacyKey("image", img, root),
          originalSrc: img.getAttribute("src") || "",
          originalSrcset: img.getAttribute("srcset"),
        };
        imageEntries.push(entry);
        if (editor) {
          img.dataset.cmsKey = entry.key;
          img.dataset.cmsLayoutSafe = "1";
          img.dataset.cmsMode = "image";
        }
      }

      const applyContent = (content: LandingContent) => {
        const overrides = content.overrides || {};
        const imageOverrides = content.imageOverrides || {};
        const styleOverrides = content.styleOverrides || {};
        applySectionOrder(root, content.sectionOrder);

        for (const entry of entries) {
          const blockLegacy = entry.scope === "lord-nutri";
          let value: unknown = overrides[entry.key];
          if (typeof value !== "string" && !blockLegacy) {
            value = entry.mode === "text"
              ? overrides[entry.oldTextKey]
              : overrides[entry.oldRichKey] ?? overrides[entry.oldTextKey];
          }
          renderText(entry.element, typeof value === "string" ? value : entry.originalValue, entry.mode);
          applyEditableStyle(entry.element, styleOverrides[entry.key]);
        }

        for (const entry of imageEntries) {
          const value = imageOverrides[entry.key] ?? imageOverrides[entry.oldKey];
          if (typeof value === "string" && value) {
            entry.element.setAttribute("src", value);
            entry.element.removeAttribute("srcset");
          } else {
            entry.element.setAttribute("src", entry.originalSrc);
            if (entry.originalSrcset) entry.element.setAttribute("srcset", entry.originalSrcset);
            else entry.element.removeAttribute("srcset");
          }
        }
      };

      applyContent(initialContent);

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
        const blocks = builderBlocks(root);
        window.parent.postMessage({
          type: "lordnutri-cms-ready",
          sections: blocks.map((item) => ({ id: item.id, label: sectionLabels[item.id] || item.id })),
        }, window.location.origin);

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
          const section = target.closest<HTMLElement>("section[id]");
          window.parent.postMessage(
            {
              type: "lordnutri-cms-select",
              key: target.dataset.cmsKey,
              kind: isImage ? "image" : "text",
              mode,
              sectionId: section?.id || "root",
              value: isImage ? target.currentSrc || target.src : selectedValue(target, mode),
              style: isImage ? undefined : captureStyle(target),
            },
            window.location.origin,
          );
        };
        root.addEventListener("click", handler, true);
        cleanupClicks = () => root.removeEventListener("click", handler, true);

        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type !== "lordnutri-cms-live") return;
          applyContent((event.data.content || {}) as LandingContent);
        };
        window.addEventListener("message", messageHandler);
        cleanupMessages = () => window.removeEventListener("message", messageHandler);
      }
    };

    void run();
    return () => {
      cleanupClicks();
      cleanupMessages();
    };
  }, []);
  return null;
}
