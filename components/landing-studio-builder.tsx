"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildStudioCss } from "@/components/studio-published-landing";

type Device = "desktop" | "tablet" | "mobile";
type DeviceStyles = Partial<Record<Device, Record<string, string>>>;
type StyleMap = Record<string, DeviceStyles>;
type StudioConfig = { enabled: boolean; version: string; html: string; styles: StyleMap };
type LandingDraft = { overrides?: Record<string, string>; fontScales?: Record<string, number>; freeElements?: unknown[]; studio?: StudioConfig };
type LandingDoc = { type: "landing"; draft: LandingDraft; published: LandingDraft; updatedAt?: string | null; publishedAt?: string | null };
type SelectedInfo = { id: string; tag: string; label: string; text: string; src: string; alt: string; href: string; protected: boolean; isImage: boolean; isText: boolean; computedColor: string; computedFontSize: string; computedTextAlign: string };
type LayerItem = { id: string; depth: number; label: string; protected: boolean };
type Snapshot = { html: string; styles: StyleMap };
type MediaAsset = { id: string; label: string; url: string; kind: string };

const devices: Array<{ id: Device; label: string; width: string }> = [
  { id: "desktop", label: "Desktop", width: "100%" },
  { id: "tablet", label: "Tablet", width: "820px" },
  { id: "mobile", label: "Celular", width: "390px" },
];

const textTags = new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "STRONG", "SMALL", "A", "BUTTON", "DT", "DD", "LI", "B", "EM"]);
const containerTags = new Set(["MAIN", "SECTION", "DIV", "ARTICLE", "HEADER", "FOOTER", "NAV", "ASIDE"]);

function makeId() {
  return `ln-${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function brandify(value: string) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/LORD NUTRI/g, '<span class="lnr-lord-name">LORD NUTRI</span>')
    .replace(/MIX10 PRO/g, '<span class="lnr-mix-name"><span>MIX10</span> <span>PRO</span></span>')
    .replace(/\n/g, "<br>");
}

function cloneStyles(value: StyleMap): StyleMap {
  return JSON.parse(JSON.stringify(value || {})) as StyleMap;
}

const flowBlockedProperties = new Set(["position", "left", "top", "right", "bottom", "zIndex"]);

function normalizeFlowStyles(value: StyleMap): StyleMap {
  const next = cloneStyles(value || {});
  for (const [id, byDevice] of Object.entries(next)) {
    for (const device of ["desktop", "tablet", "mobile"] as const) {
      const raw = byDevice?.[device];
      if (!raw) continue;
      for (const property of flowBlockedProperties) delete raw[property];
      if (!Object.keys(raw).length) delete byDevice[device];
    }
    if (!Object.keys(byDevice).length) delete next[id];
  }
  return next;
}

function rgbToHex(value: string) {
  if (/^#[0-9a-f]{6}$/i.test(value.trim())) return value.trim();
  const match = value.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (!match) return "#ffffff";
  return `#${[match[1], match[2], match[3]].map((part) => Math.max(0, Math.min(255, Number(part))).toString(16).padStart(2, "0")).join("")}`;
}

function labelFor(el: Element) {
  const protectedName = el.getAttribute("data-ln-label");
  if (protectedName) return protectedName;
  const text = (el.textContent || "").replace(/\s+/g, " ").trim();
  if (text) return `${el.tagName.toLowerCase()} · ${text.slice(0, 42)}`;
  if (el.tagName === "IMG") return `imagem · ${el.getAttribute("alt") || el.getAttribute("src") || "sem descrição"}`.slice(0, 58);
  const cls = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean)[0];
  return cls ? `${el.tagName.toLowerCase()} · .${cls}` : el.tagName.toLowerCase();
}

function assignIds(root: Element) {
  const all = [root, ...Array.from(root.querySelectorAll("*"))];
  for (const el of all) {
    if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
    if (!el.getAttribute("data-studio-id")) el.setAttribute("data-studio-id", makeId());
    el.removeAttribute("contenteditable");
    el.removeAttribute("draggable");
    el.removeAttribute("data-studio-selected");
  }
}

function stripEditorState(root: Element) {
  root.querySelectorAll("[data-studio-selected]").forEach((el) => el.removeAttribute("data-studio-selected"));
  root.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
  root.querySelectorAll("[draggable]").forEach((el) => el.removeAttribute("draggable"));
}

function editorShellCss() {
  return `
    html,body{margin:0;min-height:100%;background:#f4eee6}
    body.studio-editing{overflow-x:hidden}
    body.studio-editing a{cursor:default}
    [data-studio-selected="1"]{outline:3px solid #d3a83d!important;outline-offset:3px!important;position:relative;cursor:grab!important}
    [data-studio-drop="before"]{box-shadow:inset 0 4px 0 #16a34a!important}
    [data-studio-drop="after"]{box-shadow:inset 0 -4px 0 #16a34a!important}
    [data-studio-dragging="1"]{opacity:.45!important}
    [data-ln-protected]{min-height:120px!important;display:grid!important;place-items:center!important;border:2px dashed rgba(211,168,61,.85)!important;background:repeating-linear-gradient(135deg,rgba(211,168,61,.08),rgba(211,168,61,.08) 10px,rgba(11,34,54,.03) 10px,rgba(11,34,54,.03) 20px)!important;color:#8c6727!important}
    [data-ln-protected]::before{content:attr(data-ln-label);font:800 12px/1.2 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:10px 14px;border-radius:999px;background:#fff7df;border:1px solid #d3a83d}
  `;
}

function buildSrcDoc(html: string, baseCss: string, styles: StyleMap, origin: string) {
  const userCss = buildStudioCss(styles);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${origin}/"><style>${baseCss}</style><style>${editorShellCss()}</style><style id="ln-studio-user-css">${userCss}</style></head><body class="studio-editing"><main class="lnr-page" id="ln-studio-root">${html}</main></body></html>`;
}

function isEditableText(el: HTMLElement) {
  if (!textTags.has(el.tagName) || el.closest("[data-ln-protected]")) return false;
  const complexChildren = Array.from(el.children).filter((child) => !child.classList.contains("lnr-lord-name") && !child.classList.contains("lnr-mix-name") && !child.closest(".lnr-mix-name"));
  return complexChildren.length === 0 || el.tagName === "A" || el.tagName === "BUTTON";
}

function cleanPlainText(el: HTMLElement) {
  return (el.innerText || el.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

function writePlainText(el: HTMLElement, value: string) {
  const onlyChild = el.children.length === 1 ? el.firstElementChild as HTMLElement | null : null;
  const keepButtonSpan = (el.tagName === "A" || el.tagName === "BUTTON") && onlyChild?.tagName === "SPAN" && !onlyChild.classList.contains("lnr-lord-name") && !onlyChild.classList.contains("lnr-mix-name");
  if (keepButtonSpan && onlyChild) onlyChild.innerHTML = brandify(value);
  else el.innerHTML = brandify(value);
}

export function LandingStudioBuilder() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sourceFrameRef = useRef<HTMLIFrameElement | null>(null);
  const docRef = useRef<LandingDoc | null>(null);
  const stylesRef = useRef<StyleMap>({});
  const deviceRef = useRef<Device>("desktop");
  const selectedIdRef = useRef("");
  const draggedLayerRef = useRef("");
  const undoRef = useRef<Snapshot[]>([]);
  const redoRef = useRef<Snapshot[]>([]);
  const fieldStartRef = useRef<Snapshot | null>(null);
  const styleClipboardRef = useRef<DeviceStyles | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Carregando Studio Builder…");
  const [baseCss, setBaseCss] = useState("");
  const [initialHtml, setInitialHtml] = useState("");
  const [styles, setStyles] = useState<StyleMap>({});
  const [device, setDevice] = useState<Device>("desktop");
  const [selected, setSelected] = useState<SelectedInfo | null>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [canvasKey, setCanvasKey] = useState(0);
  const [historyTick, setHistoryTick] = useState(0);
  const [showLayers, setShowLayers] = useState(true);

  stylesRef.current = styles;
  deviceRef.current = device;
  selectedIdRef.current = selected?.id || "";

  const frameWidth = useMemo(() => devices.find((item) => item.id === device)?.width || "100%", [device]);
  const srcDoc = useMemo(() => initialHtml && baseCss && typeof window !== "undefined" ? buildSrcDoc(initialHtml, baseCss, styles, window.location.origin) : "", [initialHtml, baseCss, canvasKey]);

  const frameDocument = useCallback(() => iframeRef.current?.contentDocument || null, []);
  const studioRoot = useCallback(() => frameDocument()?.getElementById("ln-studio-root") || null, [frameDocument]);

  const serialize = useCallback(() => {
    const root = studioRoot();
    if (!root) return "";
    const clone = root.cloneNode(true) as HTMLElement;
    stripEditorState(clone);
    return clone.innerHTML;
  }, [studioRoot]);

  const capture = useCallback((): Snapshot => ({ html: serialize(), styles: cloneStyles(stylesRef.current) }), [serialize]);

  const refreshLayers = useCallback(() => {
    const root = studioRoot();
    if (!root) return;
    const output: LayerItem[] = [];
    const walk = (parent: Element, depth: number) => {
      if (depth > 4 || output.length > 420) return;
      for (const child of Array.from(parent.children)) {
        if (!(child instanceof (frameDocument()?.defaultView?.HTMLElement || HTMLElement))) continue;
        const id = child.getAttribute("data-studio-id");
        if (!id) continue;
        const protectedBlock = child.hasAttribute("data-ln-protected");
        output.push({ id, depth, label: labelFor(child), protected: protectedBlock });
        if (!protectedBlock && child.children.length && (depth < 2 || containerTags.has(child.tagName))) walk(child, depth + 1);
      }
    };
    walk(root, 0);
    setLayers(output);
  }, [frameDocument, studioRoot]);

  const refreshSelected = useCallback((el?: HTMLElement | null) => {
    const doc = frameDocument();
    if (!doc) return;
    const target = el || (selectedIdRef.current ? doc.querySelector<HTMLElement>(`[data-studio-id="${selectedIdRef.current}"]`) : null);
    if (!target) { setSelected(null); return; }
    const protectedBlock = Boolean(target.closest("[data-ln-protected]"));
    const actual = protectedBlock ? target.closest<HTMLElement>("[data-ln-protected]") || target : target;
    const id = actual.getAttribute("data-studio-id") || makeId();
    if (!actual.getAttribute("data-studio-id")) actual.setAttribute("data-studio-id", id);
    doc.querySelectorAll("[data-studio-selected]").forEach((node) => node.removeAttribute("data-studio-selected"));
    doc.querySelectorAll("[draggable=\"true\"]").forEach((node) => node.removeAttribute("draggable"));
    actual.setAttribute("data-studio-selected", "1");
    if (!actual.hasAttribute("data-ln-protected")) actual.setAttribute("draggable", "true");
    const isImage = actual.tagName === "IMG";
    const isText = isEditableText(actual);
    const computed = doc.defaultView?.getComputedStyle(actual);
    setSelected({
      id,
      tag: actual.tagName.toLowerCase(),
      label: labelFor(actual),
      text: isText ? cleanPlainText(actual) : "",
      src: isImage ? actual.getAttribute("src") || "" : "",
      alt: isImage ? actual.getAttribute("alt") || "" : "",
      href: actual.tagName === "A" ? actual.getAttribute("href") || "" : "",
      protected: actual.hasAttribute("data-ln-protected"),
      isImage,
      isText,
      computedColor: computed?.color || "#ffffff",
      computedFontSize: computed?.fontSize || "16px",
      computedTextAlign: computed?.textAlign || "left",
    });
  }, [frameDocument]);

  const applyCss = useCallback((nextStyles = stylesRef.current) => {
    const doc = frameDocument();
    const style = doc?.getElementById("ln-studio-user-css");
    if (style) style.textContent = buildStudioCss(nextStyles);
  }, [frameDocument]);

  useEffect(() => { applyCss(styles); }, [styles, applyCss]);

  const restoreSnapshot = useCallback((snapshot: Snapshot) => {
    const root = studioRoot();
    if (!root) return;
    root.innerHTML = snapshot.html;
    assignIds(root);
    setStyles(cloneStyles(snapshot.styles));
    setSelected(null);
    refreshLayers();
  }, [refreshLayers, studioRoot]);

  const recordBeforeAction = useCallback(() => {
    const snapshot = capture();
    if (snapshot.html) {
      undoRef.current.push(snapshot);
      if (undoRef.current.length > 80) undoRef.current.shift();
      redoRef.current = [];
      setHistoryTick((n) => n + 1);
    }
  }, [capture]);

  const undo = useCallback(() => {
    const previous = undoRef.current.pop();
    if (!previous) return;
    redoRef.current.push(capture());
    restoreSnapshot(previous);
    setHistoryTick((n) => n + 1);
  }, [capture, restoreSnapshot]);

  const redo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next) return;
    undoRef.current.push(capture());
    restoreSnapshot(next);
    setHistoryTick((n) => n + 1);
  }, [capture, restoreSnapshot]);

  const beginFieldEdit = useCallback(() => { if (!fieldStartRef.current) fieldStartRef.current = capture(); }, [capture]);
  const endFieldEdit = useCallback(() => {
    const before = fieldStartRef.current;
    fieldStartRef.current = null;
    if (!before) return;
    const after = capture();
    if (before.html !== after.html || JSON.stringify(before.styles) !== JSON.stringify(after.styles)) {
      undoRef.current.push(before);
      redoRef.current = [];
      setHistoryTick((n) => n + 1);
    }
  }, [capture]);

  const seedFromBase = useCallback(async () => {
    setNotice("Importando a landing atual como template do Studio…");
    const frame = document.createElement("iframe");
    sourceFrameRef.current = frame;
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:1440px;height:900px;opacity:0;pointer-events:none";
    frame.src = `/?studio_source=base&cms_preview=draft&studio_seed=${Date.now()}`;
    document.body.appendChild(frame);
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("Tempo esgotado ao importar a landing.")), 15000);
      frame.onload = () => { window.clearTimeout(timer); window.setTimeout(resolve, 1500); };
    });
    const sourceDoc = frame.contentDocument;
    const sourceMain = sourceDoc?.querySelector<HTMLElement>("main.lnr-page");
    if (!sourceMain) throw new Error("Não encontrei a landing-base para importar.");
    const clone = sourceMain.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("script,noscript").forEach((node) => node.remove());
    clone.querySelectorAll(".cms-free-move,.cms-free-resize").forEach((node) => node.remove());

    const proof = clone.querySelector<HTMLElement>(".lnr-proof-section");
    if (proof) {
      const reviewShell = proof.querySelector<HTMLElement>(".ln-reviews");
      if (reviewShell) {
        reviewShell.querySelector(".ln-google-score")?.remove();
        reviewShell.querySelector(".ln-review-grid")?.remove();
        const marker = clone.ownerDocument.createElement("div");
        marker.setAttribute("data-ln-protected", "google-dynamic");
        marker.setAttribute("data-ln-label", "Avaliações Google · dados dinâmicos protegidos");
        marker.className = "ln-studio-google-dynamic";
        const disclaimer = reviewShell.querySelector(".lnr-review-disclaimer");
        if (disclaimer) reviewShell.insertBefore(marker, disclaimer); else reviewShell.appendChild(marker);
      }
    }

    const simulator = clone.querySelector<HTMLElement>("#simulador-calculo");
    if (simulator) {
      simulator.innerHTML = "";
      simulator.setAttribute("data-ln-protected", "simulator");
      simulator.setAttribute("data-ln-label", "Simulador · lógica protegida");
    }
    const checkout = clone.querySelector<HTMLElement>("form.checkout-card");
    if (checkout) {
      const marker = clone.ownerDocument.createElement("div");
      marker.className = "ln-studio-checkout-placeholder";
      marker.setAttribute("data-ln-protected", "checkout");
      marker.setAttribute("data-ln-label", "Checkout Asaas · lógica protegida");
      checkout.replaceWith(marker);
    }
    assignIds(clone);
    const html = clone.innerHTML;
    frame.remove();
    sourceFrameRef.current = null;
    return html;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cmsResponse, cssResponse, mediaResponse] = await Promise.all([
          fetch("/api/admin/cms/landing", { cache: "no-store" }),
          fetch("/api/admin/studio/base-css", { cache: "no-store" }),
          fetch("/api/admin/cms/media", { cache: "no-store" }),
        ]);
        if (!cmsResponse.ok) throw new Error("Não foi possível carregar a landing no BKO.");
        const loaded = await cmsResponse.json() as LandingDoc;
        const css = cssResponse.ok ? await cssResponse.text() : "";
        const mediaDoc = mediaResponse.ok ? await mediaResponse.json() : null;
        if (!active) return;
        docRef.current = loaded;
        setBaseCss(css);
        setMedia(Array.isArray(mediaDoc?.draft?.assets) ? mediaDoc.draft.assets : []);
        if (loaded.draft?.studio?.html) {
          setInitialHtml(loaded.draft.studio.html);
          setStyles(normalizeFlowStyles(loaded.draft.studio.styles || {}));
          setNotice("Studio Flow carregado. Clique em um elemento, edite e arraste no fluxo sem sair do eixo.");
        } else {
          const html = await seedFromBase();
          if (!active) return;
          setInitialHtml(html);
          setStyles({});
          setNotice("Template importado. Salve o rascunho antes de publicar.");
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Falha ao abrir o Studio Builder.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; sourceFrameRef.current?.remove(); };
  }, [seedFromBase]);

  const onFrameLoad = useCallback(() => {
    const doc = frameDocument();
    const root = studioRoot();
    if (!doc || !root) return;
    assignIds(root);
    applyCss();
    refreshLayers();

    const selectFromTarget = (target: EventTarget | null) => {
      const ElementCtor = doc.defaultView?.Element;
      if (!ElementCtor || !(target instanceof ElementCtor)) return null;
      const el = target as HTMLElement;
      return el.closest<HTMLElement>("[data-ln-protected]") || el.closest<HTMLElement>("[data-studio-id]");
    };

    doc.addEventListener("click", (event) => {
      const el = selectFromTarget(event.target);
      if (!el || el === root) return;
      event.preventDefault();
      event.stopPropagation();
      refreshSelected(el);
    }, true);

    doc.addEventListener("dblclick", (event) => {
      const el = selectFromTarget(event.target);
      if (!el || !isEditableText(el) || el.hasAttribute("data-ln-protected")) return;
      event.preventDefault();
      event.stopPropagation();
      recordBeforeAction();
      el.setAttribute("contenteditable", "true");
      el.focus();
      const range = doc.createRange();
      range.selectNodeContents(el);
      const selection = doc.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      const finish = () => {
        const value = cleanPlainText(el);
        el.removeAttribute("contenteditable");
        writePlainText(el, value);
        refreshSelected(el);
        refreshLayers();
        el.removeEventListener("blur", finish);
      };
      el.addEventListener("blur", finish);
    }, true);

    let flowDrag: { id: string; before: Snapshot; el: HTMLElement } | null = null;
    const clearDropMarks = () => doc.querySelectorAll("[data-studio-drop]").forEach((node) => node.removeAttribute("data-studio-drop"));

    doc.addEventListener("dragstart", (event) => {
      const el = selectFromTarget(event.target);
      if (!el || el.hasAttribute("data-ln-protected") || el.getAttribute("data-studio-selected") !== "1") {
        event.preventDefault();
        return;
      }
      const id = el.getAttribute("data-studio-id") || "";
      if (!id) return;
      flowDrag = { id, before: capture(), el };
      el.setAttribute("data-studio-dragging", "1");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
      }
    }, true);

    doc.addEventListener("dragover", (event) => {
      if (!flowDrag) return;
      const target = selectFromTarget(event.target);
      if (!target || target === flowDrag.el || target.hasAttribute("data-ln-protected")) return;
      if (target.parentElement !== flowDrag.el.parentElement) return;
      event.preventDefault();
      clearDropMarks();
      const rect = target.getBoundingClientRect();
      const parentStyle = target.parentElement ? doc.defaultView?.getComputedStyle(target.parentElement) : null;
      const horizontal = parentStyle?.display.includes("flex") && (parentStyle.flexDirection === "row" || parentStyle.flexDirection === "row-reverse");
      const before = horizontal ? event.clientX < rect.left + rect.width / 2 : event.clientY < rect.top + rect.height / 2;
      target.setAttribute("data-studio-drop", before ? "before" : "after");
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    }, true);

    doc.addEventListener("drop", (event) => {
      if (!flowDrag) return;
      const target = selectFromTarget(event.target);
      if (!target || target === flowDrag.el || target.parentElement !== flowDrag.el.parentElement) { clearDropMarks(); return; }
      event.preventDefault();
      const mode = target.getAttribute("data-studio-drop") || "before";
      const parent = target.parentElement;
      if (!parent) return;
      if (mode === "after") parent.insertBefore(flowDrag.el, target.nextSibling);
      else parent.insertBefore(flowDrag.el, target);
      undoRef.current.push(flowDrag.before);
      redoRef.current = [];
      setHistoryTick((n) => n + 1);
      flowDrag.el.removeAttribute("data-studio-dragging");
      clearDropMarks();
      refreshLayers();
      refreshSelected(flowDrag.el);
      setNotice("Elemento movido no fluxo. O layout continua responsivo.");
      flowDrag = null;
    }, true);

    doc.addEventListener("dragend", () => {
      if (flowDrag?.el) flowDrag.el.removeAttribute("data-studio-dragging");
      clearDropMarks();
      flowDrag = null;
    }, true);
  }, [applyCss, capture, frameDocument, recordBeforeAction, refreshLayers, refreshSelected, studioRoot]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) return;
      if (event.key.toLowerCase() === "z" && !event.shiftKey) { event.preventDefault(); undo(); }
      if ((event.key.toLowerCase() === "z" && event.shiftKey) || event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
      if (event.key.toLowerCase() === "d" && selectedIdRef.current) { event.preventDefault(); duplicateSelected(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const currentElement = useCallback(() => {
    const id = selectedIdRef.current;
    return id ? frameDocument()?.querySelector<HTMLElement>(`[data-studio-id="${id}"]`) || null : null;
  }, [frameDocument]);

  const updateSelectedText = useCallback((value: string) => {
    const el = currentElement();
    if (!el || !selected?.isText) return;
    writePlainText(el, value);
    setSelected((current) => current ? { ...current, text: value, label: labelFor(el) } : current);
    refreshLayers();
  }, [currentElement, refreshLayers, selected?.isText]);

  const updateAttribute = useCallback((name: "src" | "alt" | "href", value: string) => {
    const el = currentElement();
    if (!el) return;
    el.setAttribute(name, value);
    refreshSelected(el);
  }, [currentElement, refreshSelected]);

  const setStyleValue = useCallback((property: string, value: string) => {
    if (!selected || flowBlockedProperties.has(property)) return;
    setStyles((current) => {
      const next = cloneStyles(current);
      next[selected.id] ||= {};
      const deviceStyles = { ...(next[selected.id][device] || {}) };
      if (value.trim()) deviceStyles[property] = value.trim(); else delete deviceStyles[property];
      if (Object.keys(deviceStyles).length) next[selected.id][device] = deviceStyles; else delete next[selected.id][device];
      if (!Object.keys(next[selected.id]).length) delete next[selected.id];
      return next;
    });
    window.setTimeout(() => refreshSelected(currentElement()), 0);
  }, [currentElement, device, refreshSelected, selected]);

  const styleValue = useCallback((property: string) => selected ? styles[selected.id]?.[device]?.[property] || "" : "", [device, selected, styles]);

  const patchSelectedStyles = useCallback((patch: Record<string, string>) => {
    if (!selected) return;
    setStyles((current) => {
      const next = cloneStyles(current);
      next[selected.id] ||= {};
      const deviceStyles = { ...(next[selected.id][device] || {}) };
      for (const [property, rawValue] of Object.entries(patch)) {
        if (flowBlockedProperties.has(property)) continue;
        const value = rawValue.trim();
        if (value) deviceStyles[property] = value; else delete deviceStyles[property];
      }
      if (Object.keys(deviceStyles).length) next[selected.id][device] = deviceStyles; else delete next[selected.id][device];
      if (!Object.keys(next[selected.id]).length) delete next[selected.id];
      return next;
    });
    window.setTimeout(() => refreshSelected(currentElement()), 0);
  }, [currentElement, device, refreshSelected, selected]);

  const changeFontSize = useCallback((delta: number) => {
    if (!selected || selected.isImage) return;
    const el = currentElement();
    if (!el || (!textTags.has(el.tagName) && !selected.isText)) return;
    recordBeforeAction();
    const computed = frameDocument()?.defaultView?.getComputedStyle(el);
    const base = Number.parseFloat(styleValue("fontSize") || computed?.fontSize || selected.computedFontSize || "16") || 16;
    const next = Math.max(9, Math.min(120, Math.round(base + delta)));
    patchSelectedStyles({ fontSize: `${next}px` });
    setNotice(`Fonte ajustada para ${next}px em ${device}.`);
  }, [currentElement, device, frameDocument, patchSelectedStyles, recordBeforeAction, selected, styleValue]);

  const alignSelected = useCallback((align: "left" | "center" | "right") => {
    if (!selected) return;
    const el = currentElement();
    if (!el) return;
    recordBeforeAction();
    if (selected.isText || textTags.has(el.tagName)) {
      patchSelectedStyles({ display: "block", width: "100%", textAlign: align, marginLeft: "0", marginRight: "0" });
    } else if (align === "center") {
      patchSelectedStyles({ marginLeft: "auto", marginRight: "auto" });
    } else if (align === "left") {
      patchSelectedStyles({ marginLeft: "0", marginRight: "auto" });
    } else {
      patchSelectedStyles({ marginLeft: "auto", marginRight: "0" });
    }
    setNotice(align === "center" ? "Elemento centralizado no bloco." : `Elemento alinhado à ${align === "left" ? "esquerda" : "direita"}.`);
  }, [currentElement, patchSelectedStyles, recordBeforeAction, selected]);

  const setFlowWidth = useCallback((width: string) => {
    if (!selected) return;
    recordBeforeAction();
    patchSelectedStyles({ width, maxWidth: width === "auto" ? "" : styleValue("maxWidth") });
  }, [patchSelectedStyles, recordBeforeAction, selected, styleValue]);

  const resetSelectedDeviceStyles = useCallback(() => {
    if (!selected) return;
    recordBeforeAction();
    setStyles((current) => {
      const next = cloneStyles(current);
      if (next[selected.id]) {
        delete next[selected.id][device];
        if (!Object.keys(next[selected.id]).length) delete next[selected.id];
      }
      return next;
    });
    setNotice(`Estilo de ${device} restaurado ao layout original.`);
    window.setTimeout(() => refreshSelected(currentElement()), 0);
  }, [currentElement, device, recordBeforeAction, refreshSelected, selected]);

  const selectParent = useCallback(() => {
    const el = currentElement();
    const root = studioRoot();
    const parent = el?.parentElement;
    if (!parent || parent === root) return;
    refreshSelected(parent);
    parent.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentElement, refreshSelected, studioRoot]);

  const duplicateSelected = useCallback(() => {
    const el = currentElement();
    if (!el || selected?.protected) return;
    recordBeforeAction();
    const clone = el.cloneNode(true) as HTMLElement;
    const sourceNodes = [el, ...Array.from(el.querySelectorAll<HTMLElement>("[data-studio-id]"))];
    const cloneNodes = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("[data-studio-id]"))];
    const styleCopies: Array<{ from: string; to: string }> = [];
    for (let index = 0; index < cloneNodes.length; index += 1) {
      const source = sourceNodes[index];
      const copy = cloneNodes[index];
      const oldId = source?.getAttribute("data-studio-id") || copy.getAttribute("data-studio-id") || "";
      const newId = makeId();
      copy.setAttribute("data-studio-id", newId);
      copy.removeAttribute("data-studio-selected");
      copy.removeAttribute("draggable");
      if (oldId) styleCopies.push({ from: oldId, to: newId });
    }
    setStyles((current) => {
      const next = cloneStyles(current);
      for (const pair of styleCopies) if (current[pair.from]) next[pair.to] = cloneStyles({ x: current[pair.from] }).x;
      return next;
    });
    el.insertAdjacentElement("afterend", clone);
    refreshLayers();
    refreshSelected(clone);
    setNotice("Elemento duplicado com formatação própria, sem compartilhar IDs com o original.");
  }, [currentElement, recordBeforeAction, refreshLayers, refreshSelected, selected?.protected]);

  const deleteSelected = useCallback(() => {
    const el = currentElement();
    if (!el || selected?.protected) return;
    if (!window.confirm("Excluir este elemento da landing? Você pode desfazer com Ctrl+Z.")) return;
    recordBeforeAction();
    el.remove();
    setSelected(null);
    refreshLayers();
  }, [currentElement, recordBeforeAction, refreshLayers, selected?.protected]);

  const moveSelected = useCallback((direction: -1 | 1) => {
    const el = currentElement();
    if (!el?.parentElement) return;
    const sibling = direction < 0 ? el.previousElementSibling : el.nextElementSibling;
    if (!sibling) return;
    recordBeforeAction();
    if (direction < 0) el.parentElement.insertBefore(el, sibling); else el.parentElement.insertBefore(sibling, el);
    refreshLayers();
    refreshSelected(el);
  }, [currentElement, recordBeforeAction, refreshLayers, refreshSelected]);

  const addElement = useCallback((kind: "text" | "title" | "button" | "image" | "section", imageSrc?: string) => {
    const doc = frameDocument();
    const root = studioRoot();
    if (!doc || !root) return;
    recordBeforeAction();
    let el: HTMLElement;
    if (kind === "section") {
      el = doc.createElement("section");
      el.className = "lnr-section";
      el.innerHTML = '<div class="lnr-shell"><span class="lnr-eyebrow">NOVA SEÇÃO</span><h2>Novo título</h2><p>Edite este conteúdo no Studio Builder.</p></div>';
      root.appendChild(el);
    } else {
      const selectedEl = currentElement();
      const target = selectedEl?.closest<HTMLElement>(".lnr-shell") || selectedEl?.parentElement || root;
      if (kind === "title") { el = doc.createElement("h2"); el.textContent = "Novo título"; }
      else if (kind === "button") { el = doc.createElement("a"); el.className = "lnr-button"; el.setAttribute("href", "#"); el.innerHTML = "<span>NOVO BOTÃO</span>"; }
      else if (kind === "image") { el = doc.createElement("img"); el.setAttribute("src", imageSrc || media[0]?.url || "/brand/mix10-box-transparent-v3-web.webp"); el.setAttribute("alt", "Nova imagem"); }
      else { el = doc.createElement("p"); el.textContent = "Novo texto"; }
      target.appendChild(el);
    }
    assignIds(el);
    refreshLayers();
    refreshSelected(el);
  }, [currentElement, frameDocument, media, recordBeforeAction, refreshLayers, refreshSelected, studioRoot]);

  const copyStyle = useCallback(() => {
    if (!selected) return;
    styleClipboardRef.current = cloneStyles({ x: styles[selected.id] || {} }).x;
    setNotice("Estilo copiado. Selecione outro elemento e use Colar estilo.");
  }, [selected, styles]);

  const pasteStyle = useCallback(() => {
    if (!selected || !styleClipboardRef.current) return;
    recordBeforeAction();
    setStyles((current) => normalizeFlowStyles({ ...cloneStyles(current), [selected.id]: JSON.parse(JSON.stringify(styleClipboardRef.current)) }));
  }, [recordBeforeAction, selected]);

  const save = useCallback(async (publish = false) => {
    const currentDoc = docRef.current;
    const html = serialize();
    if (!currentDoc || !html) return;
    setBusy(true);
    setNotice(publish ? "Salvando e publicando…" : "Salvando rascunho…");
    try {
      const draft: LandingDraft = {
        ...currentDoc.draft,
        studio: { enabled: true, version: "1.1", html, styles: normalizeFlowStyles(stylesRef.current) },
      };
      const patch = await fetch("/api/admin/cms/landing", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ draft }) });
      const patched = await patch.json();
      if (!patch.ok) throw new Error(patched.error || "Não foi possível salvar o Studio.");
      docRef.current = patched;
      if (publish) {
        const response = await fetch("/api/admin/cms/landing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "publish" }) });
        const published = await response.json();
        if (!response.ok) throw new Error(published.error || "Não foi possível publicar.");
        docRef.current = published;
        setNotice("Publicado. A landing pública agora usa o Studio Flow 1.1.");
      } else setNotice("Rascunho salvo.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao salvar.");
    } finally { setBusy(false); }
  }, [serialize]);

  const resetBase = useCallback(async () => {
    if (!window.confirm("Reimportar a landing-base? O rascunho atual do Studio será substituído, mas a versão publicada só muda quando você clicar em Publicar.")) return;
    setBusy(true);
    try {
      const html = await seedFromBase();
      undoRef.current.push(capture());
      redoRef.current = [];
      setInitialHtml(html);
      setStyles({});
      setSelected(null);
      setCanvasKey((n) => n + 1);
      setNotice("Landing-base reimportada. Revise e salve o rascunho.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível reimportar."); }
    finally { setBusy(false); }
  }, [capture, seedFromBase]);

  const disableStudio = useCallback(async () => {
    const currentDoc = docRef.current;
    if (!currentDoc?.draft?.studio || !window.confirm("Publicar novamente a landing original do código e desativar o Studio? Seu projeto do Studio continuará salvo no rascunho.")) return;
    setBusy(true);
    try {
      const draft = { ...currentDoc.draft, studio: { ...currentDoc.draft.studio, enabled: false } };
      const patch = await fetch("/api/admin/cms/landing", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ draft }) });
      const patched = await patch.json(); if (!patch.ok) throw new Error(patched.error || "Falha ao desativar.");
      const response = await fetch("/api/admin/cms/landing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "publish" }) });
      const published = await response.json(); if (!response.ok) throw new Error(published.error || "Falha ao publicar.");
      docRef.current = published;
      setNotice("Studio desativado na página pública. O layout original voltou a ser exibido.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Falha ao desativar o Studio."); }
    finally { setBusy(false); }
  }, []);

  const layerDrop = useCallback((targetId: string) => {
    const draggedId = draggedLayerRef.current;
    draggedLayerRef.current = "";
    if (!draggedId || draggedId === targetId) return;
    const doc = frameDocument();
    const dragged = doc?.querySelector<HTMLElement>(`[data-studio-id="${draggedId}"]`);
    const target = doc?.querySelector<HTMLElement>(`[data-studio-id="${targetId}"]`);
    if (!dragged || !target || !target.parentElement || dragged.contains(target)) return;
    if (dragged.parentElement !== target.parentElement) {
      setNotice("Para manter o responsivo estável, arraste entre elementos do mesmo bloco. Use ‘Selecionar bloco pai’ para mover um conjunto maior.");
      return;
    }
    recordBeforeAction();
    target.parentElement.insertBefore(dragged, target);
    refreshLayers();
    refreshSelected(dragged);
    setNotice("Ordem alterada dentro do bloco, sem posição livre.");
  }, [frameDocument, recordBeforeAction, refreshLayers, refreshSelected]);

  const selectLayer = useCallback((id: string) => {
    const el = frameDocument()?.querySelector<HTMLElement>(`[data-studio-id="${id}"]`);
    if (!el) return;
    refreshSelected(el);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [frameDocument, refreshSelected]);

  if (loading) return <section className="portal-card ln-studio-loading"><h2>LORDNUTRI Studio Flow 1.1</h2><p>{notice}</p></section>;

  return (
    <section className="ln-studio-app ln-studio-flow">
      <header className="ln-studio-toolbar">
        <div className="ln-studio-title"><strong>LORDNUTRI Studio Flow</strong><span>1.1 · edição profissional sem posição livre</span></div>
        <div className="ln-studio-toolgroup">
          <button onClick={() => addElement("text")}>+ Texto</button><button onClick={() => addElement("title")}>+ Título</button><button onClick={() => addElement("button")}>+ Botão</button><button onClick={() => addElement("image")}>+ Imagem</button><button onClick={() => addElement("section")}>+ Seção</button>
        </div>
        <div className="ln-studio-toolgroup">
          <button disabled={!undoRef.current.length} onClick={undo}>↶ Desfazer</button><button disabled={!redoRef.current.length} onClick={redo}>↷ Refazer</button>
          <button disabled={!selected || selected.protected} onClick={duplicateSelected}>⧉ Duplicar</button><button disabled={!selected || selected.protected} onClick={deleteSelected}>Excluir</button>
        </div>
        <div className="ln-studio-toolgroup ln-studio-devices">
          {devices.map((item) => <button key={item.id} className={device === item.id ? "active" : ""} onClick={() => setDevice(item.id)}>{item.label}</button>)}
        </div>
        <div className="ln-studio-publish">
          <button className="secondary-button compact" disabled={busy} onClick={() => void save(false)}>Salvar</button>
          <button className="primary-button compact" disabled={busy} onClick={() => void save(true)}>Publicar</button>
        </div>
      </header>

      <div className="ln-studio-notice">{notice}</div>

      <div className={`ln-studio-workspace${showLayers ? " has-layers" : ""}`}>
        <aside className="ln-studio-left">
          <div className="ln-studio-panel-title"><strong>Estrutura da LP</strong><button onClick={() => setShowLayers((value) => !value)}>{showLayers ? "←" : "→"}</button></div>
          {showLayers ? <div className="ln-studio-layers">
            {layers.map((layer) => <button key={layer.id} draggable={!layer.protected} onDragStart={() => { draggedLayerRef.current = layer.id; }} onDragOver={(event) => event.preventDefault()} onDrop={() => layerDrop(layer.id)} onClick={() => selectLayer(layer.id)} className={selected?.id === layer.id ? "active" : ""} style={{ paddingLeft: 10 + layer.depth * 14 }}><span>{layer.protected ? "🔒" : "⋮⋮"}</span><em>{layer.label}</em></button>)}
          </div> : null}
          <div className="ln-studio-library"><strong>Imagens</strong><div className="ln-studio-library-grid">{media.slice(0, 12).map((asset) => <button key={asset.id} onClick={() => addElement("image", asset.url)}><img src={asset.url} alt=""/><span>{asset.label}</span></button>)}</div></div>
        </aside>

        <div className="ln-studio-canvas-stage">
          <div className="ln-studio-ruler">{device === "desktop" ? "Desktop · fluxo responsivo" : device === "tablet" ? "Tablet · 820 px" : "Celular · 390 px"} · clique para selecionar · arraste o selecionado para reordenar no mesmo bloco</div>
          <div className="ln-studio-device-frame" style={{ width: frameWidth }}>
            {srcDoc ? <iframe key={canvasKey} ref={iframeRef} className="ln-studio-iframe" title="Editor visual da landing" srcDoc={srcDoc} onLoad={onFrameLoad}/> : null}
          </div>
        </div>

        <aside className="ln-studio-inspector">
          {!selected ? <div className="ln-studio-empty"><strong>Selecione algo na landing</strong><p>Clique no texto, imagem, botão, card ou seção. O editor trabalha em <b>fluxo responsivo</b>: sem X/Y e sem posição absoluta.</p><p>Depois de selecionar, você pode editar, mudar cor/tamanho, centralizar, duplicar e arrastar dentro do mesmo bloco.</p></div> : <>
            <div className="ln-studio-selection-head"><span>{selected.protected ? "🔒 componente protegido" : selected.tag}</span><strong>{selected.label}</strong></div>

            <div className="ln-studio-flow-actions">
              <button type="button" onClick={selectParent}>Selecionar bloco pai</button>
              <button type="button" onClick={() => moveSelected(-1)}>↑ Subir</button>
              <button type="button" onClick={() => moveSelected(1)}>↓ Descer</button>
              <button type="button" disabled={selected.protected} onClick={duplicateSelected}>⧉ Duplicar</button>
            </div>

            {selected.protected ? <div className="ln-studio-protected-note">A lógica interna deste componente fica protegida. Você ainda pode reposicionar o bloco no fluxo e ajustar largura/espaçamento sem mexer no Asaas, simulador ou dados do Google.</div> : null}

            {selected.isText && !selected.protected ? <InspectorGroup title="Texto"><label>Conteúdo<textarea rows={5} value={selected.text} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(event) => updateSelectedText(event.target.value)}/></label>{selected.tag === "a" ? <label>Link<input value={selected.href} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(event) => updateAttribute("href", event.target.value)}/></label> : null}</InspectorGroup> : null}

            {selected.isImage && !selected.protected ? <InspectorGroup title="Imagem"><label>Arquivo / URL<input value={selected.src} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(event) => updateAttribute("src", event.target.value)}/></label><label>Descrição ALT<input value={selected.alt} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(event) => updateAttribute("alt", event.target.value)}/></label></InspectorGroup> : null}

            {!selected.isImage ? <InspectorGroup title={`Aparência do texto · ${device}`}>
              <div className="ln-studio-quick-row"><button type="button" onClick={() => changeFontSize(-2)}>A−</button><span>{styleValue("fontSize") || selected.computedFontSize}</span><button type="button" onClick={() => changeFontSize(2)}>A+</button></div>
              <ColorControl label="Cor" value={rgbToHex(styleValue("color") || selected.computedColor)} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(value) => setStyleValue("color", value)}/>
              <div className="ln-studio-align-buttons"><button type="button" onClick={() => alignSelected("left")}>Esquerda</button><button type="button" className={(styleValue("textAlign") || selected.computedTextAlign) === "center" ? "active" : ""} onClick={() => alignSelected("center")}>Centralizar</button><button type="button" onClick={() => alignSelected("right")}>Direita</button></div>
              <div className="ln-studio-two"><StyleSelect label="Peso" value={styleValue("fontWeight")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("fontWeight", v)} options={["", "400", "500", "600", "700", "800", "900"]}/><StyleSelect label="Estilo" value={styleValue("fontStyle")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("fontStyle", v)} options={["", "normal", "italic"]}/></div>
            </InspectorGroup> : null}

            <InspectorGroup title={`Largura e posição no fluxo · ${device}`}>
              <div className="ln-studio-width-buttons"><button type="button" onClick={() => setFlowWidth("auto")}>Auto</button><button type="button" onClick={() => setFlowWidth("50%")}>50%</button><button type="button" onClick={() => setFlowWidth("75%")}>75%</button><button type="button" onClick={() => setFlowWidth("100%")}>100%</button></div>
              <div className="ln-studio-align-buttons"><button type="button" onClick={() => alignSelected("left")}>←</button><button type="button" onClick={() => alignSelected("center")}>Centralizar no bloco</button><button type="button" onClick={() => alignSelected("right")}>→</button></div>
              <div className="ln-studio-two"><StyleInput label="Espaço acima" placeholder="0px" value={styleValue("marginTop")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("marginTop", v)}/><StyleInput label="Espaço abaixo" placeholder="0px" value={styleValue("marginBottom")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("marginBottom", v)}/></div>
              <p className="ln-studio-help">Para mover, selecione o elemento e arraste-o antes/depois de outro elemento do mesmo bloco. Nada usa posição absoluta.</p>
            </InspectorGroup>

            <details className="ln-studio-advanced"><summary>Opções avançadas</summary>
              <InspectorGroup title={`Estilo · ${device}`}>
                <div className="ln-studio-two"><StyleInput label="Tamanho" placeholder="48px" value={styleValue("fontSize")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("fontSize", v)}/><StyleInput label="Entrelinha" placeholder="1.2" value={styleValue("lineHeight")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("lineHeight", v)}/></div>
                <StyleInput label="Família" placeholder="Georgia, serif" value={styleValue("fontFamily")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("fontFamily", v)}/>
                <div className="ln-studio-two"><StyleInput label="Largura" placeholder="auto / 100% / 420px" value={styleValue("width")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("width", v)}/><StyleInput label="Máx. largura" placeholder="1180px" value={styleValue("maxWidth")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("maxWidth", v)}/></div>
                <div className="ln-studio-four"><StyleInput label="PT" value={styleValue("paddingTop")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("paddingTop", v)}/><StyleInput label="PR" value={styleValue("paddingRight")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("paddingRight", v)}/><StyleInput label="PB" value={styleValue("paddingBottom")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("paddingBottom", v)}/><StyleInput label="PL" value={styleValue("paddingLeft")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("paddingLeft", v)}/></div>
                <div className="ln-studio-two"><StyleInput label="Fundo" placeholder="#071722" value={styleValue("backgroundColor")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("backgroundColor", v)}/><StyleInput label="Raio" placeholder="20px" value={styleValue("borderRadius")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("borderRadius", v)}/></div>
              </InspectorGroup>
              <InspectorGroup title={`Organização do bloco · ${device}`}>
                <StyleSelect label="Display" value={styleValue("display")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("display", v)} options={["", "block", "flex", "grid", "inline-flex", "none"]}/>
                <div className="ln-studio-two"><StyleSelect label="Direção" value={styleValue("flexDirection")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("flexDirection", v)} options={["", "row", "column", "row-reverse", "column-reverse"]}/><StyleInput label="Gap" placeholder="20px" value={styleValue("gap")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("gap", v)}/></div>
                <div className="ln-studio-two"><StyleSelect label="Horizontal" value={styleValue("justifyContent")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("justifyContent", v)} options={["", "flex-start", "center", "flex-end", "space-between", "space-around"]}/><StyleSelect label="Vertical" value={styleValue("alignItems")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("alignItems", v)} options={["", "stretch", "flex-start", "center", "flex-end"]}/></div>
                <StyleInput label="Colunas do grid" placeholder="repeat(3, 1fr)" value={styleValue("gridTemplateColumns")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("gridTemplateColumns", v)}/>
              </InspectorGroup>
            </details>

            <div className="ln-studio-mini-actions"><button type="button" onClick={copyStyle}>Copiar estilo</button><button type="button" disabled={!styleClipboardRef.current} onClick={pasteStyle}>Colar estilo</button><button type="button" onClick={resetSelectedDeviceStyles}>Restaurar estilo</button></div>
          </>}

          <div className="ln-studio-system-actions"><button disabled={busy} onClick={() => void resetBase()}>Reimportar layout-base</button><button disabled={busy} className="danger" onClick={() => void disableStudio()}>Publicar layout original</button><a href="/" target="_blank" rel="noopener noreferrer">Abrir landing ↗</a></div>
        </aside>
      </div>
      <span hidden>{historyTick}</span>
    </section>
  );
}

function InspectorGroup({ title, children }: { title: string; children: ReactNode }) {
  return <fieldset className="ln-studio-inspector-group"><legend>{title}</legend>{children}</fieldset>;
}

function StyleInput({ label, value, placeholder = "", onChange, onFocus, onBlur }: { label: string; value: string; placeholder?: string; onChange: (value: string) => void; onFocus?: () => void; onBlur?: () => void }) {
  return <label>{label}<input value={value} placeholder={placeholder} onFocus={onFocus} onBlur={onBlur} onChange={(event) => onChange(event.target.value)}/></label>;
}

function StyleSelect({ label, value, options, onChange, onFocus, onBlur }: { label: string; value: string; options: string[]; onChange: (value: string) => void; onFocus?: () => void; onBlur?: () => void }) {
  return <label>{label}<select value={value} onFocus={onFocus} onBlur={onBlur} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option || "inherit"} value={option}>{option || "Herdar do layout"}</option>)}</select></label>;
}
function ColorControl({ label, value, onChange, onFocus, onBlur }: { label: string; value: string; onChange: (value: string) => void; onFocus?: () => void; onBlur?: () => void }) {
  const safe = /^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff";
  return <label className="ln-studio-color-control">{label}<span><input type="color" value={safe} onFocus={onFocus} onBlur={onBlur} onChange={(event) => onChange(event.target.value)}/><input value={value} placeholder="#ffffff" onFocus={onFocus} onBlur={onBlur} onChange={(event) => onChange(event.target.value)}/></span></label>;
}
