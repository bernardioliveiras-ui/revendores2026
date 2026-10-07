"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildStudioCss } from "@/components/studio-published-landing";

type Device = "desktop" | "tablet" | "mobile";
type DeviceStyles = Partial<Record<Device, Record<string, string>>>;
type StyleMap = Record<string, DeviceStyles>;
type StudioConfig = { enabled: boolean; version: string; html: string; styles: StyleMap };
type LandingDraft = { overrides?: Record<string, string>; fontScales?: Record<string, number>; freeElements?: unknown[]; studio?: StudioConfig };
type LandingDoc = { type: "landing"; draft: LandingDraft; published: LandingDraft; updatedAt?: string | null; publishedAt?: string | null };
type SelectedInfo = { id: string; tag: string; label: string; text: string; src: string; alt: string; href: string; protected: boolean; isImage: boolean; isText: boolean };
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
    [data-studio-selected="1"]{outline:3px solid #d3a83d!important;outline-offset:3px!important;position:relative}
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
    actual.setAttribute("data-studio-selected", "1");
    const isImage = actual.tagName === "IMG";
    const isText = isEditableText(actual);
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
          setStyles(loaded.draft.studio.styles || {});
          setNotice("Studio carregado. Clique em qualquer elemento para editar.");
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
        el.innerHTML = brandify(value);
        refreshSelected(el);
        refreshLayers();
        el.removeEventListener("blur", finish);
      };
      el.addEventListener("blur", finish);
    }, true);

    let dragState: { id: string; startX: number; startY: number; left: number; top: number; before: Snapshot; el: HTMLElement } | null = null;
    doc.addEventListener("pointerdown", (event) => {
      if (!event.altKey || event.button !== 0) return;
      const el = selectFromTarget(event.target);
      if (!el) return;
      const id = el.getAttribute("data-studio-id") || "";
      if (!id || el.hasAttribute("data-ln-protected")) return;
      const current = stylesRef.current[id]?.[deviceRef.current] || {};
      if (current.position !== "absolute") return;
      const computed = doc.defaultView?.getComputedStyle(el);
      dragState = {
        id,
        startX: event.clientX,
        startY: event.clientY,
        left: Number.parseFloat(current.left || computed?.left || "0") || 0,
        top: Number.parseFloat(current.top || computed?.top || "0") || 0,
        before: capture(),
        el,
      };
      el.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    }, true);
    doc.addEventListener("pointermove", (event) => {
      if (!dragState) return;
      const left = dragState.left + (event.clientX - dragState.startX);
      const top = dragState.top + (event.clientY - dragState.startY);
      dragState.el.style.left = `${Math.round(left)}px`;
      dragState.el.style.top = `${Math.round(top)}px`;
    }, true);
    doc.addEventListener("pointerup", (event) => {
      if (!dragState) return;
      const state = dragState;
      dragState = null;
      const left = state.left + (event.clientX - state.startX);
      const top = state.top + (event.clientY - state.startY);
      state.el.style.removeProperty("left");
      state.el.style.removeProperty("top");
      setStyles((current) => {
        const next = cloneStyles(current);
        next[state.id] ||= {};
        next[state.id][deviceRef.current] = { ...(next[state.id][deviceRef.current] || {}), left: `${Math.round(left)}px`, top: `${Math.round(top)}px`, position: "absolute" };
        return next;
      });
      undoRef.current.push(state.before);
      redoRef.current = [];
      setHistoryTick((n) => n + 1);
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
    el.innerHTML = brandify(value);
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
    if (!selected) return;
    setStyles((current) => {
      const next = cloneStyles(current);
      next[selected.id] ||= {};
      const deviceStyles = { ...(next[selected.id][device] || {}) };
      if (value.trim()) deviceStyles[property] = value.trim(); else delete deviceStyles[property];
      if (Object.keys(deviceStyles).length) next[selected.id][device] = deviceStyles; else delete next[selected.id][device];
      if (!Object.keys(next[selected.id]).length) delete next[selected.id];
      return next;
    });
  }, [device, selected]);

  const styleValue = useCallback((property: string) => selected ? styles[selected.id]?.[device]?.[property] || "" : "", [device, selected, styles]);

  const duplicateSelected = useCallback(() => {
    const el = currentElement();
    if (!el || selected?.protected) return;
    recordBeforeAction();
    const clone = el.cloneNode(true) as HTMLElement;
    assignIds(clone);
    clone.removeAttribute("data-studio-selected");
    el.insertAdjacentElement("afterend", clone);
    refreshLayers();
    refreshSelected(clone);
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

  const toggleFreePosition = useCallback(() => {
    const el = currentElement();
    if (!el || !selected || selected.protected) return;
    recordBeforeAction();
    const currentPosition = stylesRef.current[selected.id]?.[device]?.position;
    if (currentPosition === "absolute") {
      for (const key of ["position", "left", "top", "right", "bottom", "zIndex"]) setStyleValue(key, "");
      return;
    }
    const parent = el.parentElement;
    if (parent) {
      const parentId = parent.getAttribute("data-studio-id") || makeId();
      if (!parent.getAttribute("data-studio-id")) parent.setAttribute("data-studio-id", parentId);
      const computed = frameDocument()?.defaultView?.getComputedStyle(parent);
      if (computed?.position === "static") {
        setStyles((current) => {
          const next = cloneStyles(current);
          next[parentId] ||= {};
          next[parentId][device] = { ...(next[parentId][device] || {}), position: "relative" };
          return next;
        });
      }
    }
    const left = `${Math.max(0, Math.round(el.offsetLeft))}px`;
    const top = `${Math.max(0, Math.round(el.offsetTop))}px`;
    setStyles((current) => {
      const next = cloneStyles(current);
      next[selected.id] ||= {};
      next[selected.id][device] = { ...(next[selected.id][device] || {}), position: "absolute", left, top, zIndex: "20" };
      return next;
    });
    setNotice("Posição livre ativada. Segure ALT e arraste o elemento no canvas.");
  }, [currentElement, device, frameDocument, recordBeforeAction, selected, setStyleValue]);

  const copyStyle = useCallback(() => {
    if (!selected) return;
    styleClipboardRef.current = cloneStyles({ x: styles[selected.id] || {} }).x;
    setNotice("Estilo copiado. Selecione outro elemento e use Colar estilo.");
  }, [selected, styles]);

  const pasteStyle = useCallback(() => {
    if (!selected || !styleClipboardRef.current) return;
    recordBeforeAction();
    setStyles((current) => ({ ...cloneStyles(current), [selected.id]: JSON.parse(JSON.stringify(styleClipboardRef.current)) }));
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
        studio: { enabled: true, version: "1.0", html, styles: cloneStyles(stylesRef.current) },
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
        setNotice("Publicado. A landing pública agora usa o Studio Builder 1.0.");
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
    recordBeforeAction();
    target.parentElement.insertBefore(dragged, target);
    refreshLayers();
    refreshSelected(dragged);
  }, [frameDocument, recordBeforeAction, refreshLayers, refreshSelected]);

  const selectLayer = useCallback((id: string) => {
    const el = frameDocument()?.querySelector<HTMLElement>(`[data-studio-id="${id}"]`);
    if (!el) return;
    refreshSelected(el);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [frameDocument, refreshSelected]);

  if (loading) return <section className="portal-card ln-studio-loading"><h2>LORDNUTRI Studio Builder 1.0</h2><p>{notice}</p></section>;

  return (
    <section className="ln-studio-app">
      <header className="ln-studio-toolbar">
        <div className="ln-studio-title"><strong>LORDNUTRI Studio Builder</strong><span>1.0 · editor visual da landing</span></div>
        <div className="ln-studio-toolgroup">
          <button onClick={() => addElement("text")}>+ Texto</button><button onClick={() => addElement("title")}>+ Título</button><button onClick={() => addElement("button")}>+ Botão</button><button onClick={() => addElement("image")}>+ Imagem</button><button onClick={() => addElement("section")}>+ Seção</button>
        </div>
        <div className="ln-studio-toolgroup">
          <button disabled={!undoRef.current.length} onClick={undo}>↶</button><button disabled={!redoRef.current.length} onClick={redo}>↷</button>
          <button disabled={!selected || selected.protected} onClick={duplicateSelected}>Duplicar</button><button disabled={!selected || selected.protected} onClick={deleteSelected}>Excluir</button>
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
          <div className="ln-studio-panel-title"><strong>Camadas</strong><button onClick={() => setShowLayers((value) => !value)}>{showLayers ? "←" : "→"}</button></div>
          {showLayers ? <div className="ln-studio-layers">
            {layers.map((layer) => <button key={layer.id} draggable onDragStart={() => { draggedLayerRef.current = layer.id; }} onDragOver={(event) => event.preventDefault()} onDrop={() => layerDrop(layer.id)} onClick={() => selectLayer(layer.id)} className={selected?.id === layer.id ? "active" : ""} style={{ paddingLeft: 10 + layer.depth * 14 }}><span>{layer.protected ? "🔒" : "⋮⋮"}</span><em>{layer.label}</em></button>)}
          </div> : null}
          <div className="ln-studio-library"><strong>Biblioteca</strong><div className="ln-studio-library-grid">{media.slice(0, 12).map((asset) => <button key={asset.id} onClick={() => addElement("image", asset.url)}><img src={asset.url} alt=""/><span>{asset.label}</span></button>)}</div></div>
        </aside>

        <div className="ln-studio-canvas-stage">
          <div className="ln-studio-ruler">{device === "desktop" ? "Canvas responsivo · largura total" : device === "tablet" ? "820 px" : "390 px"}</div>
          <div className="ln-studio-device-frame" style={{ width: frameWidth }}>
            {srcDoc ? <iframe key={canvasKey} ref={iframeRef} className="ln-studio-iframe" title="Editor visual da landing" srcDoc={srcDoc} onLoad={onFrameLoad}/> : null}
          </div>
        </div>

        <aside className="ln-studio-inspector">
          {!selected ? <div className="ln-studio-empty"><strong>Selecione um elemento</strong><p>Clique em qualquer texto, imagem, botão, card ou seção no canvas. Para editar texto diretamente, dê duplo clique.</p><p><b>Dica:</b> arraste itens na lista de Camadas para reorganizar. Posição livre é opcional e usa ALT + arrastar.</p></div> : <>
            <div className="ln-studio-selection-head"><span>{selected.protected ? "🔒 componente protegido" : selected.tag}</span><strong>{selected.label}</strong></div>
            <div className="ln-studio-mini-actions"><button onClick={() => moveSelected(-1)}>↑</button><button onClick={() => moveSelected(1)}>↓</button><button disabled={selected.protected} onClick={duplicateSelected}>⧉</button><button onClick={copyStyle}>Copiar estilo</button><button disabled={!styleClipboardRef.current} onClick={pasteStyle}>Colar estilo</button></div>

            {selected.protected ? <div className="ln-studio-protected-note">A lógica deste componente é protegida. Você pode mover o bloco, mudar dimensões e espaçamento, mas não alterar a lógica de pagamento, simulador ou dados do Google.</div> : null}

            {selected.isText && !selected.protected ? <InspectorGroup title="Conteúdo"><label>Texto<textarea rows={5} value={selected.text} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(event) => updateSelectedText(event.target.value)}/></label>{selected.tag === "a" ? <label>Link<input value={selected.href} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(event) => updateAttribute("href", event.target.value)}/></label> : null}</InspectorGroup> : null}

            {selected.isImage && !selected.protected ? <InspectorGroup title="Imagem"><label>Arquivo / URL<input value={selected.src} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(event) => updateAttribute("src", event.target.value)}/></label><label>Descrição ALT<input value={selected.alt} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(event) => updateAttribute("alt", event.target.value)}/></label></InspectorGroup> : null}

            <InspectorGroup title={`Tipografia · ${device}`}>
              <StyleInput label="Tamanho" placeholder="ex.: 48px ou clamp(...)" value={styleValue("fontSize")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("fontSize", v)}/>
              <div className="ln-studio-two"><StyleInput label="Peso" placeholder="700" value={styleValue("fontWeight")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("fontWeight", v)}/><StyleInput label="Entrelinha" placeholder="1.2" value={styleValue("lineHeight")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("lineHeight", v)}/></div>
              <div className="ln-studio-two"><StyleInput label="Cor" placeholder="#ffffff" value={styleValue("color")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("color", v)}/><StyleSelect label="Alinhar" value={styleValue("textAlign")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("textAlign", v)} options={["", "left", "center", "right", "justify"]}/></div>
              <StyleInput label="Família" placeholder="Georgia, serif" value={styleValue("fontFamily")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("fontFamily", v)}/>
            </InspectorGroup>

            <InspectorGroup title={`Dimensões e espaçamento · ${device}`}>
              <div className="ln-studio-two"><StyleInput label="Largura" placeholder="auto / 100% / 420px" value={styleValue("width")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("width", v)}/><StyleInput label="Máx. largura" placeholder="1180px" value={styleValue("maxWidth")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("maxWidth", v)}/></div>
              <div className="ln-studio-four"><StyleInput label="MT" value={styleValue("marginTop")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("marginTop", v)}/><StyleInput label="MR" value={styleValue("marginRight")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("marginRight", v)}/><StyleInput label="MB" value={styleValue("marginBottom")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("marginBottom", v)}/><StyleInput label="ML" value={styleValue("marginLeft")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("marginLeft", v)}/></div>
              <div className="ln-studio-four"><StyleInput label="PT" value={styleValue("paddingTop")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("paddingTop", v)}/><StyleInput label="PR" value={styleValue("paddingRight")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("paddingRight", v)}/><StyleInput label="PB" value={styleValue("paddingBottom")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("paddingBottom", v)}/><StyleInput label="PL" value={styleValue("paddingLeft")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("paddingLeft", v)}/></div>
              <div className="ln-studio-two"><StyleInput label="Fundo" placeholder="#071722" value={styleValue("backgroundColor")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("backgroundColor", v)}/><StyleInput label="Raio" placeholder="20px" value={styleValue("borderRadius")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("borderRadius", v)}/></div>
            </InspectorGroup>

            <InspectorGroup title={`Layout · ${device}`}>
              <StyleSelect label="Display" value={styleValue("display")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("display", v)} options={["", "block", "flex", "grid", "inline-flex", "none"]}/>
              <div className="ln-studio-two"><StyleSelect label="Direção" value={styleValue("flexDirection")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("flexDirection", v)} options={["", "row", "column", "row-reverse", "column-reverse"]}/><StyleInput label="Gap" placeholder="20px" value={styleValue("gap")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("gap", v)}/></div>
              <div className="ln-studio-two"><StyleSelect label="Horizontal" value={styleValue("justifyContent")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("justifyContent", v)} options={["", "flex-start", "center", "flex-end", "space-between", "space-around"]}/><StyleSelect label="Vertical" value={styleValue("alignItems")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("alignItems", v)} options={["", "stretch", "flex-start", "center", "flex-end"]}/></div>
              <StyleInput label="Colunas do grid" placeholder="repeat(3, 1fr)" value={styleValue("gridTemplateColumns")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("gridTemplateColumns", v)}/>
              {!selected.protected ? <button className={styleValue("position") === "absolute" ? "ln-studio-free active" : "ln-studio-free"} onClick={toggleFreePosition}>{styleValue("position") === "absolute" ? "✓ Posição livre ativa" : "Ativar posição livre"}</button> : null}
              {styleValue("position") === "absolute" ? <><p className="ln-studio-help">Segure <b>ALT</b> e arraste no canvas. A posição é salva apenas em <b>{device}</b>.</p><div className="ln-studio-two"><StyleInput label="X / left" value={styleValue("left")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("left", v)}/><StyleInput label="Y / top" value={styleValue("top")} onFocus={beginFieldEdit} onBlur={endFieldEdit} onChange={(v) => setStyleValue("top", v)}/></div></> : null}
            </InspectorGroup>
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
