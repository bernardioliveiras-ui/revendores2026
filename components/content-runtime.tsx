"use client";
import { useEffect } from "react";

type EditableMode = "text" | "brand" | "lines";
type LandingContent = { overrides?: Record<string, string> };
type EditableEntry = {
  element: HTMLElement;
  key: string;
  legacyTextKey: string;
  legacyRichKey: string;
  mode: EditableMode;
  scope: string;
  originalValue: string;
};

const sectionLabels: Record<string, string> = {
  header: "Cabeçalho",
  inicio: "Abertura",
  "lord-nutri": "LORD NUTRI",
  mix10pro: "MIX10 PRO",
  avaliacoes: "Avaliações Google",
  modelo: "Como começar",
  simulador: "Simulador",
  kits: "Kits",
  duvidas: "Dúvidas",
  checkout: "Checkout",
  footer: "Rodapé",
  root: "Geral",
};

function domPath(el: Element, root: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== root) {
    const currentNode: Element = node;
    const parentElement: HTMLElement | null = currentNode.parentElement;
    if (!parentElement) break;
    const siblings: Element[] = Array.from(parentElement.children) as Element[];
    const sameTag = siblings.filter((child) => child.tagName === currentNode.tagName);
    parts.unshift(`${currentNode.tagName.toLowerCase()}:nth-of-type(${sameTag.indexOf(currentNode) + 1})`);
    node = parentElement;
  }
  return parts.join(">");
}

function editableScope(element: HTMLElement, root: HTMLElement): HTMLElement {
  const section = element.closest<HTMLElement>("section[id]");
  if (section && root.contains(section)) return section;
  const proof = element.closest<HTMLElement>(".lnr-proof-section");
  if (proof && root.contains(proof)) return proof;
  const header = element.closest<HTMLElement>(".lnr-header");
  if (header && root.contains(header)) return header;
  const footer = element.closest<HTMLElement>(".lnr-footer");
  if (footer && root.contains(footer)) return footer;
  return root;
}

function scopeName(scope: HTMLElement, root: HTMLElement) {
  if (scope === root) return "root";
  if (scope.classList.contains("lnr-header")) return "header";
  if (scope.classList.contains("lnr-footer")) return "footer";
  if (scope.classList.contains("lnr-proof-section")) return "avaliacoes";
  return scope.id || "root";
}

function stableKey(mode: EditableMode, element: HTMLElement, root: HTMLElement) {
  if (element.dataset.cmsExplicitKey) return element.dataset.cmsExplicitKey;
  const scope = editableScope(element, root);
  const scopeId = scopeName(scope, root);
  const kind = mode === "text" ? "text" : "rich";
  // Keep the 0.5.x key contract for existing copy overrides. Groups are now
  // identity only; they are never movable or duplicable in TEXT-SAFE.
  const namedGroup = element.closest<HTMLElement>("[data-cms-group]");
  if (namedGroup && scope.contains(namedGroup)) {
    const groupName = (namedGroup.dataset.cmsGroup || "group").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
    return `${kind}:${scopeId}:group:${groupName}:${domPath(element, namedGroup) || "self"}`;
  }
  return `${kind}:${scopeId}:${domPath(element, scope)}`;
}


function legacyKey(kind: "text" | "rich", element: HTMLElement, root: HTMLElement) {
  return `${kind}:${domPath(element, root)}`;
}

function isProtected(element: Element) {
  return Boolean(element.closest('[data-cms-text-protected="1"],script,style,svg,noscript'));
}

/**
 * Wrap only direct text nodes that live beside structural children (strong/span/etc.).
 * The wrapper inherits all typography and lets us edit the words without replacing
 * the parent element, its classes, grid/flex position or functional children.
 */
function wrapDirectTextNodes(root: HTMLElement) {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
  for (const element of elements) {
    if (isProtected(element)) continue;
    if (element.dataset.cmsExplicitKey) continue;
    if (["SCRIPT", "STYLE", "SVG", "PATH", "INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(element.tagName)) continue;
    if (element.matches(".lnr-lord-name,.lnr-mix-name,.lnr-mix-name *")) continue;
    const textNodes = Array.from(element.childNodes).filter(
      (node): node is Text => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
    );
    for (const node of textNodes) {
      const span = document.createElement("span");
      span.dataset.cmsTextSegment = "1";
      span.textContent = node.textContent || "";
      node.replaceWith(span);
    }
  }
}

function isBrandNode(element: Element) {
  return element.classList.contains("lnr-lord-name") || element.classList.contains("lnr-mix-name");
}

function isSafeRichText(element: HTMLElement) {
  if (!element.textContent?.trim() || !element.childElementCount) return false;
  return Array.from(element.children).every((child) =>
    child.tagName === "BR" || isBrandNode(child) || (child instanceof HTMLElement && child.dataset.cmsTextSegment === "1"),
  );
}

function classifyTextElement(element: HTMLElement): EditableMode | null {
  if (isProtected(element)) return null;
  if (["SCRIPT", "STYLE", "SVG", "PATH", "INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(element.tagName)) return null;
  if (element.matches(".lnr-lord-name,.lnr-mix-name,.lnr-mix-name *")) return null;
  if (!element.textContent?.trim()) return null;
  if (isSafeRichText(element)) {
    return Array.from(element.children).some((child) => child.tagName === "BR") ? "lines" : "brand";
  }
  if (element.childElementCount === 0) return "text";
  return null;
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
    } else if (normalized === "MIX10 PRO") {
      const wrapper = document.createElement("span");
      wrapper.className = "lnr-mix-name";
      const mix = document.createElement("span");
      mix.textContent = "MIX10";
      const pro = document.createElement("span");
      pro.textContent = "PRO";
      wrapper.append(mix, document.createTextNode(" "), pro);
      fragment.append(wrapper);
    } else {
      fragment.append(document.createTextNode(part));
    }
  }
}

function renderBrandText(element: HTMLElement, value: string) {
  const fragment = document.createDocumentFragment();
  appendBrandTokens(fragment, value);
  element.replaceChildren(fragment);
}

function renderLineText(element: HTMLElement, value: string) {
  const fragment = document.createDocumentFragment();
  value.split(/\r?\n/).forEach((line, index) => {
    if (index) fragment.append(document.createElement("br"));
    appendBrandTokens(fragment, line);
  });
  element.replaceChildren(fragment);
}

function renderText(element: HTMLElement, value: string, mode: EditableMode) {
  if (element.dataset.cmsEditing === "1") return;
  if (mode === "lines") renderLineText(element, value);
  else renderBrandText(element, value);
}

function selectedValue(element: HTMLElement, mode: EditableMode) {
  return mode === "lines" ? element.innerText.trim() : (element.textContent?.trim() || "");
}

function collectEntries(root: HTMLElement, editor: boolean) {
  wrapDirectTextNodes(root);
  const candidates: EditableEntry[] = [];
  for (const element of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const mode = classifyTextElement(element);
    if (!mode) continue;
    candidates.push({
      element,
      key: stableKey(mode, element, root),
      legacyTextKey: legacyKey("text", element, root),
      legacyRichKey: legacyKey("rich", element, root),
      mode,
      scope: scopeName(editableScope(element, root), root),
      originalValue: selectedValue(element, mode),
    });
  }

  // If a safe rich parent is editable, its temporary segment children must not
  // also be separate fields. This gives one clean field for a paragraph/title.
  const selected = candidates.filter((candidate) => !candidates.some((parent) =>
    parent !== candidate && parent.element.contains(candidate.element) && parent.mode !== "text",
  ));

  if (editor) {
    for (const entry of selected) {
      entry.element.dataset.cmsKey = entry.key;
      entry.element.dataset.cmsMode = entry.mode;
      entry.element.dataset.cmsTextEditable = "1";
    }
  }
  return selected;
}

function postSelection(entry: EditableEntry) {
  window.parent.postMessage({
    type: "lordnutri-cms-select",
    key: entry.key,
    kind: "text",
    value: selectedValue(entry.element, entry.mode),
    originalValue: entry.originalValue,
    mode: entry.mode,
    sectionId: entry.scope,
    legacyKeys: [entry.legacyTextKey, entry.legacyRichKey],
  }, window.location.origin);
}

function selectEntry(root: HTMLElement, entry: EditableEntry, scroll = false) {
  root.querySelectorAll(".cms-selected").forEach((node) => node.classList.remove("cms-selected"));
  entry.element.classList.add("cms-selected");
  if (scroll) entry.element.scrollIntoView({ behavior: "smooth", block: "center" });
  postSelection(entry);
}

export function ContentRuntime() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lnr-page");
    if (!root) return;
    const url = new URL(window.location.href);
    const preview = url.searchParams.get("cms_preview") === "draft";
    const editor = url.searchParams.get("cms_editor") === "1";
    let cleanup = () => {};

    const run = async () => {
      const [response, productResponse] = await Promise.all([
        fetch(`/api/public/cms/landing${preview ? "?preview=draft" : ""}`, { cache: "no-store" }),
        fetch(`/api/public/cms/products${preview ? "?preview=draft" : ""}`, { cache: "no-store" }),
      ]);
      const body = await response.json().catch(() => ({ content: null }));
      const productBody = await productResponse.json().catch(() => ({ content: null }));
      const initialContent = (body?.content || {}) as LandingContent;
      const products = productBody?.content?.products || [];

      // Dynamic product values are applied before text fields are indexed, so the
      // editor never points to a node that is later replaced by this runtime.
      const mix = products.find((item: any) => item.id === "mix10pro");
      if (mix) {
        for (const anvisa of Array.from(root.querySelectorAll(".lnr-anvisa strong"))) anvisa.textContent = "ANVISA nº 2535115572620267";
        for (const productImg of Array.from(root.querySelectorAll<HTMLImageElement>(".lnr-product-visual img"))) if (mix.image) productImg.src = mix.image;
      }
      for (const kitId of ["kit20", "kit50"]) {
        const item = products.find((entry: any) => entry.id === kitId);
        if (!item) continue;
        for (const card of Array.from(root.querySelectorAll(".lnr-kit"))) {
          if (card.querySelector("h3")?.textContent?.toLowerCase() !== kitId) continue;
          const price = card.querySelector(".lnr-price");
          if (price && item.price) price.textContent = item.price;
        }
      }

      const entries = collectEntries(root, editor);
      const byKey = new Map(entries.map((entry) => [entry.key, entry]));
      let currentContent = initialContent;

      const applyContent = (content: LandingContent) => {
        currentContent = content;
        const overrides = content.overrides || {};
        for (const entry of entries) {
          let value: unknown = overrides[entry.key];
          if (typeof value !== "string") {
            value = entry.mode === "text"
              ? overrides[entry.legacyTextKey]
              : overrides[entry.legacyRichKey] ?? overrides[entry.legacyTextKey];
          }
          renderText(entry.element, typeof value === "string" ? value : entry.originalValue, entry.mode);
        }
      };
      applyContent(initialContent);

      if (!editor) return;

      window.parent.postMessage({
        type: "lordnutri-cms-ready",
        texts: entries.map((entry) => ({
          key: entry.key,
          value: selectedValue(entry.element, entry.mode),
          originalValue: entry.originalValue,
          sectionId: entry.scope,
          sectionLabel: sectionLabels[entry.scope] || entry.scope,
          mode: entry.mode,
          legacyKeys: [entry.legacyTextKey, entry.legacyRichKey],
        })),
      }, window.location.origin);

      const clickHandler: EventListener = (event) => {
        const mouse = event as MouseEvent;
        const origin = mouse.target;
        if (!(origin instanceof Element)) return;
        const target = origin.closest<HTMLElement>('[data-cms-text-editable="1"]');
        if (!target || !root.contains(target)) return;
        const entry = byKey.get(target.dataset.cmsKey || "");
        if (!entry) return;
        mouse.preventDefault();
        mouse.stopPropagation();
        selectEntry(root, entry);
      };

      const doubleClickHandler: EventListener = (event) => {
        const mouse = event as MouseEvent;
        const origin = mouse.target;
        if (!(origin instanceof Element)) return;
        const target = origin.closest<HTMLElement>('[data-cms-text-editable="1"]');
        if (!target || !root.contains(target)) return;
        const entry = byKey.get(target.dataset.cmsKey || "");
        if (!entry) return;
        mouse.preventDefault();
        mouse.stopPropagation();
        selectEntry(root, entry);
        target.dataset.cmsEditing = "1";
        target.contentEditable = "true";
        target.spellcheck = true;
        target.classList.add("cms-inline-editing");
        target.focus();

        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(false);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        const finish = () => {
          target.contentEditable = "false";
          target.classList.remove("cms-inline-editing");
          delete target.dataset.cmsEditing;
          const value = selectedValue(target, entry.mode);
          window.parent.postMessage({ type: "lordnutri-cms-inline-change", key: entry.key, value }, window.location.origin);
        };
        const keydown = (keyboard: KeyboardEvent) => {
          if (keyboard.key === "Escape") { keyboard.preventDefault(); target.blur(); }
          if (keyboard.key === "Enter" && entry.mode !== "lines" && !keyboard.shiftKey) { keyboard.preventDefault(); target.blur(); }
          if ((keyboard.ctrlKey || keyboard.metaKey) && keyboard.key === "Enter") { keyboard.preventDefault(); target.blur(); }
        };
        const paste = (pasteEvent: ClipboardEvent) => {
          pasteEvent.preventDefault();
          const text = pasteEvent.clipboardData?.getData("text/plain") || "";
          document.execCommand("insertText", false, text);
        };
        target.addEventListener("keydown", keydown);
        target.addEventListener("paste", paste);
        target.addEventListener("blur", () => {
          target.removeEventListener("keydown", keydown);
          target.removeEventListener("paste", paste);
          finish();
        }, { once: true });
      };

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === "lordnutri-cms-live") {
          applyContent((event.data.content || {}) as LandingContent);
          return;
        }
        if (event.data?.type === "lordnutri-cms-focus-text") {
          const entry = byKey.get(String(event.data.key || ""));
          if (entry) selectEntry(root, entry, true);
        }
      };

      root.addEventListener("click", clickHandler, true);
      root.addEventListener("dblclick", doubleClickHandler, true);
      window.addEventListener("message", messageHandler);
      cleanup = () => {
        root.removeEventListener("click", clickHandler, true);
        root.removeEventListener("dblclick", doubleClickHandler, true);
        window.removeEventListener("message", messageHandler);
      };
    };

    void run();
    return () => cleanup();
  }, []);
  return null;
}
