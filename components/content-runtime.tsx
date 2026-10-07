"use client";
import { useEffect } from "react";

type EditableMode = "text" | "brand" | "lines";
type PreviewDevice = "desktop" | "tablet" | "mobile";
type FreePlacement = { xPct: number; yPx: number; widthPct: number; z?: number };
type FreeElement = {
  id: string;
  kind: "text" | "image";
  sectionId: string;
  content?: string;
  src?: string;
  alt?: string;
  style?: Record<string, string>;
  placements?: Partial<Record<PreviewDevice, FreePlacement>>;
  groupId?: string;
};
type LandingContent = {
  overrides?: Record<string, string>;
  fontScales?: Record<string, number>;
  freeElements?: FreeElement[];
};
type EditableEntry = {
  element: HTMLElement;
  key: string;
  legacyTextKey: string;
  legacyRichKey: string;
  mode: EditableMode;
  scope: string;
  originalValue: string;
};
type ImageEntry = {
  element: HTMLImageElement;
  key: string;
  scope: string;
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

const freeTextStyleKeys = [
  "fontFamily", "fontSize", "fontWeight", "fontStyle", "color", "textAlign",
  "letterSpacing", "lineHeight", "textTransform", "textDecoration", "opacity",
] as const;
const freeImageStyleKeys = ["opacity", "borderRadius", "objectFit", "objectPosition"] as const;

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
  const namedGroup = element.closest<HTMLElement>("[data-cms-group]");
  if (namedGroup && scope.contains(namedGroup)) {
    const groupName = (namedGroup.dataset.cmsGroup || "group").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
    return `${kind}:${scopeId}:group:${groupName}:${domPath(element, namedGroup) || "self"}`;
  }
  return `${kind}:${scopeId}:${domPath(element, scope)}`;
}

function imageKey(element: HTMLImageElement, root: HTMLElement) {
  const scope = editableScope(element, root);
  const scopeId = scopeName(scope, root);
  const namedGroup = element.closest<HTMLElement>("[data-cms-group]");
  if (namedGroup && scope.contains(namedGroup)) {
    const groupName = (namedGroup.dataset.cmsGroup || "group").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
    return `image:${scopeId}:group:${groupName}:${domPath(element, namedGroup) || "self"}`;
  }
  return `image:${scopeId}:${domPath(element, scope)}`;
}

function legacyKey(kind: "text" | "rich", element: HTMLElement, root: HTMLElement) {
  return `${kind}:${domPath(element, root)}`;
}

function isProtected(element: Element) {
  return Boolean(element.closest('[data-cms-text-protected="1"],script,style,svg,noscript,[data-cms-free-element="1"]'));
}

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

function safeFontScale(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(1.4, Math.max(.8, Math.round(numeric * 20) / 20));
}

function applyFontScale(entry: EditableEntry, rawScale: unknown) {
  const scale = safeFontScale(rawScale);
  entry.element.style.removeProperty("font-size");
  if (Math.abs(scale - 1) < .001) return;
  const base = parseFloat(window.getComputedStyle(entry.element).fontSize);
  if (!Number.isFinite(base) || base <= 0) return;
  entry.element.style.fontSize = `${Math.round(base * scale * 100) / 100}px`;
}

function collectTextEntries(root: HTMLElement, editor: boolean) {
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

function collectImageEntries(root: HTMLElement, editor: boolean) {
  const entries: ImageEntry[] = [];
  for (const image of Array.from(root.querySelectorAll<HTMLImageElement>("img"))) {
    if (image.closest('[data-cms-free-element="1"]')) continue;
    const scope = scopeName(editableScope(image, root), root);
    const entry = { element: image, key: imageKey(image, root), scope };
    entries.push(entry);
    if (editor) {
      image.dataset.cmsImageKey = entry.key;
      image.dataset.cmsImageEditable = "1";
    }
  }
  return entries;
}

function scopeElement(root: HTMLElement, id: string): HTMLElement | null {
  if (id === "header") return root.querySelector<HTMLElement>(".lnr-header");
  if (id === "footer") return root.querySelector<HTMLElement>(".lnr-footer");
  if (id === "avaliacoes") return root.querySelector<HTMLElement>(".lnr-proof-section");
  if (id === "root") return root;
  return root.querySelector<HTMLElement>(`section#${CSS.escape(id)}`);
}

function currentDevice(forced?: string | null): PreviewDevice {
  if (forced === "mobile" || forced === "tablet" || forced === "desktop") return forced;
  if (window.innerWidth <= 620) return "mobile";
  if (window.innerWidth <= 900) return "tablet";
  return "desktop";
}

function placementFor(element: FreeElement, device: PreviewDevice): FreePlacement {
  const direct = element.placements?.[device];
  const fallback = element.placements?.desktop || element.placements?.tablet || element.placements?.mobile;
  const source = direct || fallback || { xPct: 8, yPx: 80, widthPct: element.kind === "image" ? 32 : 45, z: 30 };
  return {
    xPct: Number.isFinite(source.xPct) ? source.xPct : 8,
    yPx: Number.isFinite(source.yPx) ? source.yPx : 80,
    widthPct: Number.isFinite(source.widthPct) ? source.widthPct : 45,
    z: Number.isFinite(source.z) ? source.z : 30,
  };
}

function elementRectSnapshot(element: HTMLElement, scope: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const scopeRect = scope.getBoundingClientRect();
  const width = Math.max(scopeRect.width, 1);
  return {
    xPct: Math.max(-25, Math.min(125, ((rect.left - scopeRect.left) / width) * 100)),
    yPx: rect.top - scopeRect.top,
    widthPct: Math.max(3, Math.min(140, (rect.width / width) * 100)),
  };
}

function textStyleSnapshot(element: HTMLElement) {
  const computed = window.getComputedStyle(element);
  const output: Record<string, string> = {};
  for (const key of freeTextStyleKeys) {
    const value = computed[key];
    if (typeof value === "string" && value) output[key] = value;
  }
  return output;
}

function imageStyleSnapshot(element: HTMLImageElement) {
  const computed = window.getComputedStyle(element);
  const output: Record<string, string> = {};
  for (const key of freeImageStyleKeys) {
    const value = computed[key];
    if (typeof value === "string" && value) output[key] = value;
  }
  return output;
}

function namedGroupSnapshot(element: HTMLElement, root: HTMLElement) {
  const group = element.closest<HTMLElement>("[data-cms-group]");
  if (!group || !root.contains(group)) return null;
  const scope = editableScope(group, root);
  const sectionId = scopeName(scope, root);
  const items: Array<{kind:"text"|"image";content?:string;src?:string;alt?:string;style:Record<string,string>;rect:{xPct:number;yPx:number;widthPct:number}}> = [];
  for (const node of Array.from(group.querySelectorAll<HTMLElement>('[data-cms-text-editable="1"],img[data-cms-image-editable="1"]'))) {
    if (node instanceof HTMLImageElement) {
      items.push({kind:"image",src:node.currentSrc||node.src,alt:node.alt||"",style:imageStyleSnapshot(node),rect:elementRectSnapshot(node,scope)});
      continue;
    }
    const mode=(node.dataset.cmsMode||"text") as EditableMode;
    items.push({kind:"text",content:selectedValue(node,mode),style:textStyleSnapshot(node),rect:elementRectSnapshot(node,scope)});
  }
  if (items.length < 2) return null;
  return { name: group.dataset.cmsGroup || "conjunto", sectionId, items };
}

function clearSelections(root: HTMLElement) {
  root.querySelectorAll(".cms-selected,.cms-free-selected").forEach((node) => node.classList.remove("cms-selected", "cms-free-selected"));
}

function postBaseTextSelection(root: HTMLElement, entry: EditableEntry) {
  const scope = editableScope(entry.element, root);
  window.parent.postMessage({
    type: "lordnutri-cms-select",
    key: entry.key,
    kind: "text",
    value: selectedValue(entry.element, entry.mode),
    originalValue: entry.originalValue,
    mode: entry.mode,
    sectionId: entry.scope,
    legacyKeys: [entry.legacyTextKey, entry.legacyRichKey],
    snapshot: textStyleSnapshot(entry.element),
    rect: elementRectSnapshot(entry.element, scope),
    group: namedGroupSnapshot(entry.element, root),
  }, window.location.origin);
}

function postBaseImageSelection(root: HTMLElement, entry: ImageEntry) {
  const scope = editableScope(entry.element, root);
  window.parent.postMessage({
    type: "lordnutri-cms-select",
    key: entry.key,
    kind: "image",
    sectionId: entry.scope,
    src: entry.element.currentSrc || entry.element.src,
    alt: entry.element.alt || "",
    snapshot: imageStyleSnapshot(entry.element),
    rect: elementRectSnapshot(entry.element, scope),
    group: namedGroupSnapshot(entry.element, root),
  }, window.location.origin);
}

function renderFreeElements(
  root: HTMLElement,
  content: LandingContent,
  editor: boolean,
  forcedDevice: PreviewDevice | null,
  selectedFreeId: string | null,
  onSelectFree?: (id: string) => void,
) {
  root.querySelectorAll('[data-cms-free-layer="1"]').forEach((node) => node.remove());
  const device = currentDevice(forcedDevice);
  for (const item of content.freeElements || []) {
    const scope = scopeElement(root, item.sectionId) || scopeElement(root, "inicio");
    if (!scope) continue;
    if (window.getComputedStyle(scope).position === "static") scope.style.position = "relative";
    let layer = scope.querySelector<HTMLElement>(':scope > [data-cms-free-layer="1"]');
    if (!layer) {
      layer = document.createElement("div");
      layer.dataset.cmsFreeLayer = "1";
      layer.className = "cms-free-layer";
      scope.append(layer);
    }
    const placement = placementFor(item, device);
    const box = document.createElement("div");
    box.dataset.cmsFreeElement = "1";
    box.dataset.cmsFreeId = item.id;
    if (item.groupId) box.dataset.cmsFreeGroup = item.groupId;
    box.className = `cms-free-element cms-free-${item.kind}${selectedFreeId === item.id ? " cms-free-selected" : ""}`;
    box.style.left = `${placement.xPct}%`;
    box.style.top = `${placement.yPx}px`;
    box.style.width = `${placement.widthPct}%`;
    box.style.zIndex = String(placement.z ?? 30);

    const contentNode = document.createElement("div");
    contentNode.className = "cms-free-content";
    if (item.kind === "image") {
      const image = document.createElement("img");
      image.src = item.src || "/brand/mix10-box-transparent-v3-web.webp";
      image.alt = item.alt || "";
      image.draggable = false;
      for (const [key, value] of Object.entries(item.style || {})) {
        if ((freeImageStyleKeys as readonly string[]).includes(key)) (image.style as any)[key] = value;
      }
      contentNode.append(image);
    } else {
      for (const [key, value] of Object.entries(item.style || {})) {
        if ((freeTextStyleKeys as readonly string[]).includes(key)) (contentNode.style as any)[key] = value;
      }
      renderLineText(contentNode, item.content || "Novo texto");
    }
    box.append(contentNode);

    if (editor) {
      box.style.pointerEvents = "auto";
      const move = document.createElement("button");
      move.type = "button";
      move.className = "cms-free-move";
      move.title = "Arrastar";
      move.textContent = "✥";
      const resize = document.createElement("button");
      resize.type = "button";
      resize.className = "cms-free-resize";
      resize.title = "Redimensionar";
      resize.textContent = "↘";
      box.append(move, resize);

      const postSelect = () => {
        clearSelections(root);
        box.classList.add("cms-free-selected");
        onSelectFree?.(item.id);
        window.parent.postMessage({ type: "lordnutri-cms-free-select", id: item.id, itemKind: item.kind, sectionId: item.sectionId, groupId: item.groupId || null }, window.location.origin);
      };
      box.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); postSelect(); });

      if (item.kind === "text") {
        contentNode.addEventListener("dblclick", (event) => {
          event.preventDefault(); event.stopPropagation(); postSelect();
          contentNode.textContent = item.content || "Novo texto";
          contentNode.contentEditable = "true";
          contentNode.spellcheck = true;
          contentNode.classList.add("cms-inline-editing");
          contentNode.focus();
          const paste = (pasteEvent: ClipboardEvent) => {
            pasteEvent.preventDefault();
            document.execCommand("insertText", false, pasteEvent.clipboardData?.getData("text/plain") || "");
          };
          const keydown = (keyboard: KeyboardEvent) => {
            if (keyboard.key === "Escape") contentNode.blur();
            if ((keyboard.ctrlKey || keyboard.metaKey) && keyboard.key === "Enter") contentNode.blur();
          };
          contentNode.addEventListener("paste", paste);
          contentNode.addEventListener("keydown", keydown);
          contentNode.addEventListener("blur", () => {
            contentNode.removeEventListener("paste", paste);
            contentNode.removeEventListener("keydown", keydown);
            const value = contentNode.innerText.trim();
            contentNode.contentEditable = "false";
            contentNode.classList.remove("cms-inline-editing");
            renderLineText(contentNode, value || "Novo texto");
            window.parent.postMessage({ type: "lordnutri-cms-free-patch", id: item.id, patch: { content: value || "Novo texto" } }, window.location.origin);
          }, { once: true });
        });
      }

      const startPointerAction = (event: PointerEvent, mode: "move" | "resize") => {
        event.preventDefault(); event.stopPropagation(); postSelect();
        const scopeRect = scope.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const startWidth = boxRect.width;
        const pointerId = event.pointerId;
        (event.currentTarget as HTMLElement).setPointerCapture?.(pointerId);
        const movingBoxes = mode === "move" && item.groupId
          ? Array.from(scope.querySelectorAll<HTMLElement>(`[data-cms-free-group="${CSS.escape(item.groupId)}"]`))
          : [box];
        const starts = movingBoxes.map((movingBox) => {
          const rect = movingBox.getBoundingClientRect();
          return {
            box: movingBox,
            id: movingBox.dataset.cmsFreeId || "",
            left: rect.left - scopeRect.left,
            top: rect.top - scopeRect.top,
            width: rect.width,
            z: Number(movingBox.style.zIndex || 30),
          };
        });
        const onMove = (moveEvent: PointerEvent) => {
          if (moveEvent.pointerId !== pointerId) return;
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;
          if (mode === "move") {
            for (const start of starts) {
              const maxLeft = Math.max(0, scopeRect.width - start.width * .25);
              const left = Math.max(-start.width * .75, Math.min(maxLeft, start.left + dx));
              const top = Math.max(-300, start.top + dy);
              start.box.style.left = `${(left / Math.max(scopeRect.width, 1)) * 100}%`;
              start.box.style.top = `${top}px`;
            }
          } else {
            const width = Math.max(48, Math.min(scopeRect.width * 1.4, startWidth + dx));
            box.style.width = `${(width / Math.max(scopeRect.width, 1)) * 100}%`;
          }
        };
        const onUp = (upEvent: PointerEvent) => {
          if (upEvent.pointerId !== pointerId) return;
          window.removeEventListener("pointermove", onMove, true);
          window.removeEventListener("pointerup", onUp, true);
          if (mode === "move" && starts.length > 1) {
            window.parent.postMessage({
              type: "lordnutri-cms-free-placement-batch",
              device,
              items: starts.map((start) => ({
                id: start.id,
                placement: {
                  xPct: parseFloat(start.box.style.left),
                  yPx: parseFloat(start.box.style.top),
                  widthPct: (start.width / Math.max(scopeRect.width, 1)) * 100,
                  z: start.z,
                },
              })),
            }, window.location.origin);
            return;
          }
          const leftPct = parseFloat(box.style.left) || placement.xPct;
          const topPx = parseFloat(box.style.top) || placement.yPx;
          const widthPct = parseFloat(box.style.width) || placement.widthPct;
          window.parent.postMessage({
            type: "lordnutri-cms-free-placement",
            id: item.id,
            device,
            placement: { xPct: leftPct, yPx: topPx, widthPct, z: placement.z ?? 30 },
          }, window.location.origin);
        };
        window.addEventListener("pointermove", onMove, true);
        window.addEventListener("pointerup", onUp, true);
      };
      move.addEventListener("pointerdown", (event) => startPointerAction(event, "move"));
      resize.addEventListener("pointerdown", (event) => startPointerAction(event, "resize"));
    }
    layer.append(box);
  }
}

function selectTextEntry(root: HTMLElement, entry: EditableEntry, scroll = false) {
  clearSelections(root);
  entry.element.classList.add("cms-selected");
  if (scroll) entry.element.scrollIntoView({ behavior: "smooth", block: "center" });
  postBaseTextSelection(root, entry);
}

function selectImageEntry(root: HTMLElement, entry: ImageEntry, scroll = false) {
  clearSelections(root);
  entry.element.classList.add("cms-selected");
  if (scroll) entry.element.scrollIntoView({ behavior: "smooth", block: "center" });
  postBaseImageSelection(root, entry);
}

export function ContentRuntime() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lnr-page");
    if (!root) return;
    const url = new URL(window.location.href);
    const preview = url.searchParams.get("cms_preview") === "draft";
    const editor = url.searchParams.get("cms_editor") === "1";
    const forcedDevice = editor ? currentDevice(url.searchParams.get("cms_device")) : null;
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

      const textEntries = collectTextEntries(root, editor);
      const imageEntries = collectImageEntries(root, editor);
      const textByKey = new Map(textEntries.map((entry) => [entry.key, entry]));
      const imageByKey = new Map(imageEntries.map((entry) => [entry.key, entry]));
      let currentContent = initialContent;
      let selectedFreeId: string | null = null;

      const applyContent = (content: LandingContent) => {
        currentContent = content;
        const overrides = content.overrides || {};
        for (const entry of textEntries) {
          let value: unknown = overrides[entry.key];
          if (typeof value !== "string") {
            value = entry.mode === "text"
              ? overrides[entry.legacyTextKey]
              : overrides[entry.legacyRichKey] ?? overrides[entry.legacyTextKey];
          }
          renderText(entry.element, typeof value === "string" ? value : entry.originalValue, entry.mode);
          applyFontScale(entry, content.fontScales?.[entry.key] ?? 1);
        }
        renderFreeElements(root, content, editor, forcedDevice, selectedFreeId, (id) => { selectedFreeId = id; });
      };
      applyContent(initialContent);

      if (!editor) {
        const resizeHandler = () => applyContent(currentContent);
        window.addEventListener("resize", resizeHandler);
        cleanup = () => window.removeEventListener("resize", resizeHandler);
        return;
      }

      const uniqueSections = new Map<string, string>();
      for (const entry of [...textEntries.map((item) => item.scope), ...imageEntries.map((item) => item.scope)]) {
        if (!uniqueSections.has(entry)) uniqueSections.set(entry, sectionLabels[entry] || entry);
      }
      window.parent.postMessage({
        type: "lordnutri-cms-ready",
        texts: textEntries.map((entry) => ({
          key: entry.key,
          value: selectedValue(entry.element, entry.mode),
          originalValue: entry.originalValue,
          sectionId: entry.scope,
          sectionLabel: sectionLabels[entry.scope] || entry.scope,
          mode: entry.mode,
          legacyKeys: [entry.legacyTextKey, entry.legacyRichKey],
        })),
        sections: Array.from(uniqueSections, ([id, label]) => ({ id, label })),
      }, window.location.origin);

      const clickHandler: EventListener = (event) => {
        const mouse = event as MouseEvent;
        const origin = mouse.target;
        if (!(origin instanceof Element)) return;
        if (origin.closest('[data-cms-free-element="1"]')) return;
        const textTarget = origin.closest<HTMLElement>('[data-cms-text-editable="1"]');
        if (textTarget && root.contains(textTarget)) {
          const entry = textByKey.get(textTarget.dataset.cmsKey || "");
          if (!entry) return;
          mouse.preventDefault(); mouse.stopPropagation(); selectTextEntry(root, entry); return;
        }
        const imageTarget = origin.closest<HTMLImageElement>('img[data-cms-image-editable="1"]');
        if (imageTarget && root.contains(imageTarget)) {
          const entry = imageByKey.get(imageTarget.dataset.cmsImageKey || "");
          if (!entry) return;
          mouse.preventDefault(); mouse.stopPropagation(); selectImageEntry(root, entry);
        }
      };

      const doubleClickHandler: EventListener = (event) => {
        const mouse = event as MouseEvent;
        const origin = mouse.target;
        if (!(origin instanceof Element) || origin.closest('[data-cms-free-element="1"]')) return;
        const target = origin.closest<HTMLElement>('[data-cms-text-editable="1"]');
        if (!target || !root.contains(target)) return;
        const entry = textByKey.get(target.dataset.cmsKey || "");
        if (!entry) return;
        mouse.preventDefault(); mouse.stopPropagation(); selectTextEntry(root, entry);
        target.dataset.cmsEditing = "1";
        target.contentEditable = "true";
        target.spellcheck = true;
        target.classList.add("cms-inline-editing");
        target.focus();
        const range = document.createRange();
        range.selectNodeContents(target); range.collapse(false);
        const nativeSelection = window.getSelection();
        nativeSelection?.removeAllRanges(); nativeSelection?.addRange(range);
        const finish = () => {
          target.contentEditable = "false";
          target.classList.remove("cms-inline-editing");
          delete target.dataset.cmsEditing;
          window.parent.postMessage({ type: "lordnutri-cms-inline-change", key: entry.key, value: selectedValue(target, entry.mode) }, window.location.origin);
        };
        const keydown = (keyboard: KeyboardEvent) => {
          if (keyboard.key === "Escape") { keyboard.preventDefault(); target.blur(); }
          if (keyboard.key === "Enter" && entry.mode !== "lines" && !keyboard.shiftKey) { keyboard.preventDefault(); target.blur(); }
          if ((keyboard.ctrlKey || keyboard.metaKey) && keyboard.key === "Enter") { keyboard.preventDefault(); target.blur(); }
        };
        const paste = (pasteEvent: ClipboardEvent) => {
          pasteEvent.preventDefault();
          document.execCommand("insertText", false, pasteEvent.clipboardData?.getData("text/plain") || "");
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
          const entry = textByKey.get(String(event.data.key || ""));
          if (entry) selectTextEntry(root, entry, true);
          return;
        }
        if (event.data?.type === "lordnutri-cms-focus-free") {
          selectedFreeId = String(event.data.id || "") || null;
          applyContent(currentContent);
          const target = root.querySelector<HTMLElement>(`[data-cms-free-id="${CSS.escape(selectedFreeId || "")}"]`);
          target?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };

      const resizeHandler = () => applyContent(currentContent);
      root.addEventListener("click", clickHandler, true);
      root.addEventListener("dblclick", doubleClickHandler, true);
      window.addEventListener("message", messageHandler);
      window.addEventListener("resize", resizeHandler);
      cleanup = () => {
        root.removeEventListener("click", clickHandler, true);
        root.removeEventListener("dblclick", doubleClickHandler, true);
        window.removeEventListener("message", messageHandler);
        window.removeEventListener("resize", resizeHandler);
      };
    };

    void run();
    return () => cleanup();
  }, []);
  return null;
}
