"use client";
import { useEffect } from "react";

type EditableMode = "text" | "brand" | "lines";
type StyleKey = "fontFamily" | "fontSize" | "fontWeight" | "fontStyle" | "color" | "textAlign" | "letterSpacing" | "lineHeight" | "textTransform" | "textDecoration";
type LayoutKey = "width" | "maxWidth" | "minWidth" | "height" | "maxHeight" | "marginTop" | "marginRight" | "marginBottom" | "marginLeft" | "paddingTop" | "paddingRight" | "paddingBottom" | "paddingLeft" | "borderRadius" | "opacity" | "objectFit" | "objectPosition" | "backgroundColor" | "borderColor" | "borderWidth" | "borderStyle" | "position" | "left" | "top" | "right" | "bottom" | "zIndex" | "order" | "flexBasis" | "gridColumn" | "gridRow" | "alignSelf" | "justifySelf";
type EditableStyle = Partial<Record<StyleKey, string>>;
type EditableLayout = Partial<Record<LayoutKey, string>>;
type SectionInstance = { id: string; sourceId: string; hidden?: boolean; label?: string };
type ElementClone = { id: string; sourceKey: string; sectionId: string; kind: "text" | "image"; mode?: string };
type ElementPlacement = { key: string; targetKey?: string; targetSectionId?: string; position: "before" | "after" | "append" | "prepend" };
type GroupClone = { id: string; sourceGroupKey: string; sectionId: string };
type PreviewDevice = "desktop" | "tablet" | "mobile";
type CustomBlock = { id: string; sectionId: string; kind: "heading" | "text" | "button" | "image"; content?: string; href?: string; src?: string };
type LandingContent = {
  overrides?: Record<string, string>;
  imageOverrides?: Record<string, string>;
  styleOverrides?: Record<string, EditableStyle>;
  layoutOverrides?: Record<string, EditableLayout>;
  responsiveLayoutOverrides?: Record<string, Partial<Record<PreviewDevice, EditableLayout>>>;
  sectionOrder?: string[];
  sectionInstances?: SectionInstance[];
  elementClones?: ElementClone[];
  groupClones?: GroupClone[];
  elementPlacements?: ElementPlacement[];
  customBlocks?: CustomBlock[];
  hiddenElements?: string[];
};

type EditableEntry = {
  element: HTMLElement;
  key: string;
  oldTextKey: string;
  oldRichKey: string;
  mode: EditableMode;
  scope: string;
  originalValue: string;
  cloneId?: string;
  sourceKey?: string;
  customId?: string;
};

type ImageEntry = {
  element: HTMLImageElement;
  key: string;
  oldKey: string;
  originalSrc: string;
  originalSrcset: string | null;
  scope: string;
  cloneId?: string;
  sourceKey?: string;
  customId?: string;
};

type GroupEntry = { element: HTMLElement; key: string; scope: string; cloneId?: string; sourceKey?: string };
type BlockCatalogEntry = { id: string; label: string; duplicateAllowed: boolean; element: HTMLElement };

const styleKeys: StyleKey[] = [
  "fontFamily", "fontSize", "fontWeight", "fontStyle", "color", "textAlign",
  "letterSpacing", "lineHeight", "textTransform", "textDecoration",
];
const layoutKeys: LayoutKey[] = [
  "width", "maxWidth", "minWidth", "height", "maxHeight", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderRadius", "opacity", "objectFit", "objectPosition",
  "backgroundColor", "borderColor", "borderWidth", "borderStyle", "position", "left", "top", "right", "bottom",
  "zIndex", "order", "flexBasis", "gridColumn", "gridRow", "alignSelf", "justifySelf",
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

const duplicateBlockedSections = new Set(["simulador", "checkout"]);

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
  const instance = element.closest<HTMLElement>("[data-cms-section-instance]");
  if (instance && root.contains(instance)) return instance;
  const section = element.closest<HTMLElement>("section[id]");
  if (section && root.contains(section)) return section;
  const identified = element.closest<HTMLElement>("[id]");
  if (identified && identified !== root && root.contains(identified)) return identified;
  return root;
}

function scopeName(scope: HTMLElement, root: HTMLElement) {
  if (scope === root) return "root";
  return scope.dataset.cmsSectionInstance || scope.id || "root";
}

function stableKey(kind: "text" | "rich" | "image", element: HTMLElement, root: HTMLElement) {
  if (element.dataset.cmsExplicitKey) return element.dataset.cmsExplicitKey;
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
  if (!element.textContent?.trim()) return false;
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
  if (element.dataset.cmsEditing === "1") return;
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

function applyEditableLayout(element: HTMLElement, layout: EditableLayout | undefined) {
  const hasLayout = Boolean(layout && Object.values(layout).some(value => typeof value === "string" && value.trim()));
  if (!hasLayout && element.dataset.cmsLayoutApplied !== "1") return;
  for (const key of layoutKeys) element.style[key] = "";
  if (!hasLayout || !layout) { delete element.dataset.cmsLayoutApplied; return; }
  for (const key of layoutKeys) {
    const value = layout[key];
    if (typeof value === "string" && value.trim()) element.style[key] = value;
  }
  element.dataset.cmsLayoutApplied = "1";
}

function sourceCatalog(root: HTMLElement): BlockCatalogEntry[] {
  return Array.from(root.children).flatMap((child) => {
    if (!(child instanceof HTMLElement)) return [];
    let id = "";
    if (child.matches("section[id]")) id = child.id;
    else if (child.classList.contains("lnr-proof-section")) id = "avaliacoes";
    if (!id) return [];
    return [{ id, label: sectionLabels[id] || id, duplicateAllowed: !duplicateBlockedSections.has(id), element: child }];
  });
}

function normalizedInstances(content: LandingContent, catalog: BlockCatalogEntry[]): SectionInstance[] {
  const known = new Set(catalog.map(item => item.id));
  const raw = Array.isArray(content.sectionInstances) ? content.sectionInstances : [];
  const result: SectionInstance[] = [];
  const seen = new Set<string>();
  if (raw.length) {
    for (const item of raw) {
      if (!item || !known.has(item.sourceId) || seen.has(item.id)) continue;
      result.push({ id: item.id, sourceId: item.sourceId, hidden: item.hidden === true, label: item.label });
      seen.add(item.id);
    }
  } else {
    const legacy = Array.isArray(content.sectionOrder) ? content.sectionOrder.filter(id => known.has(id)) : [];
    const order = [...legacy, ...catalog.map(item => item.id).filter(id => !legacy.includes(id))];
    for (const id of order) { result.push({ id, sourceId: id }); seen.add(id); }
  }
  for (const item of catalog) {
    if (!result.some(instance => instance.id === item.id)) result.push({ id: item.id, sourceId: item.id });
  }
  return result;
}

function stripDuplicateIds(element: HTMLElement) {
  element.removeAttribute("id");
  for (const node of Array.from(element.querySelectorAll<HTMLElement>("[id]"))) node.removeAttribute("id");
}

function clearEditorMetadata(element: HTMLElement) {
  const nodes = [element, ...Array.from(element.querySelectorAll<HTMLElement>("*"))];
  for (const node of nodes) {
    delete node.dataset.cmsKey;
    delete node.dataset.cmsMode;
    delete node.dataset.cmsLayoutSafe;
    delete node.dataset.cmsExplicitKey;
    delete node.dataset.cmsCloneId;
    delete node.dataset.cmsCloneSource;
    delete node.dataset.cmsGroupKey;
    delete node.dataset.cmsGroupExplicitKey;
    delete node.dataset.cmsGroupCloneId;
    delete node.dataset.cmsGroupCloneSource;
    delete node.dataset.cmsKind;
    delete node.dataset.cmsCustomId;
    node.classList.remove("cms-selected", "cms-inline-editing");
    node.removeAttribute("contenteditable");
  }
}

function materializeSections(root: HTMLElement, content: LandingContent, editor: boolean) {
  const catalog = sourceCatalog(root);
  const bySource = new Map(catalog.map(item => [item.id, item]));
  const instances = normalizedInstances(content, catalog);
  const footer = Array.from(root.children).find(item => item instanceof HTMLElement && item.tagName === "FOOTER") || null;
  const usedOriginals = new Set<string>();
  const ordered: HTMLElement[] = [];

  for (const instance of instances) {
    const source = bySource.get(instance.sourceId);
    if (!source) continue;
    let element: HTMLElement;
    if (instance.id === instance.sourceId && !usedOriginals.has(instance.sourceId)) {
      element = source.element;
      usedOriginals.add(instance.sourceId);
    } else {
      element = source.element.cloneNode(true) as HTMLElement;
      stripDuplicateIds(element);
      clearEditorMetadata(element);
      element.dataset.cmsSectionClone = "1";
    }
    element.dataset.cmsSectionInstance = instance.id;
    element.dataset.cmsSectionSource = instance.sourceId;
    element.dataset.cmsSectionLabel = instance.label || source.label;
    if (instance.hidden) {
      element.dataset.cmsHidden = "1";
      element.style.display = "none";
    } else {
      delete element.dataset.cmsHidden;
      element.style.removeProperty("display");
    }
    if (editor) element.dataset.cmsSectionEditable = "1";
    ordered.push(element);
  }
  for (const element of ordered) root.insertBefore(element, footer);
  return { catalog, instances };
}

function currentBlocks(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-cms-section-instance]"));
}

function applyCurrentSectionState(root: HTMLElement, content: LandingContent) {
  const blocks = currentBlocks(root);
  const byId = new Map(blocks.map(block => [block.dataset.cmsSectionInstance || "", block]));
  if (Array.isArray(content.sectionInstances) && content.sectionInstances.length) {
    const footer = Array.from(root.children).find(item => item instanceof HTMLElement && item.tagName === "FOOTER") || null;
    for (const instance of content.sectionInstances) {
      const block = byId.get(instance.id);
      if (!block) continue;
      if (instance.hidden) { block.dataset.cmsHidden = "1"; block.style.display = "none"; }
      else { delete block.dataset.cmsHidden; block.style.removeProperty("display"); }
      root.insertBefore(block, footer);
    }
    return;
  }
  if (!Array.isArray(content.sectionOrder) || !content.sectionOrder.length) return;
  const footer = Array.from(root.children).find(item => item instanceof HTMLElement && item.tagName === "FOOTER") || null;
  for (const id of content.sectionOrder) {
    const block = byId.get(id);
    if (block) root.insertBefore(block, footer);
  }
}

// Compatibilidade do layout-lock 0.3.4: a regra equivalente continua sendo aplicada por classifyTextElement.
// if (!textLeaf && !brandRichText && !lineBreakRichText) continue;
function classifyTextElement(html: HTMLElement): EditableMode | null {
  if (["SCRIPT", "STYLE", "SVG", "PATH", "INPUT", "TEXTAREA", "SELECT", "OPTION", "BUTTON"].includes(html.tagName)) return null;
  if (html.closest(".cms-section-toolbar-runtime")) return null;
  if (html.matches(".lnr-lord-name, .lnr-mix-name, .lnr-mix-name *")) return null;
  if (isTextLeaf(html)) return "text";
  if (isBrandRichText(html)) return "brand";
  if (isLineBreakRichText(html)) return "lines";
  return null;
}

function selectableDescendants(container: HTMLElement) {
  const items: Array<{ element: HTMLElement; kind: "text" | "image"; mode?: EditableMode }> = [];
  for (const node of Array.from(container.querySelectorAll<HTMLElement>("*"))) {
    if (node instanceof HTMLImageElement) {
      if (!node.closest(".cms-section-toolbar-runtime,.cms-element-toolbar-runtime")) items.push({ element: node, kind: "image" });
      continue;
    }
    const mode = classifyTextElement(node);
    if (mode) items.push({ element: node, kind: "text", mode });
  }
  return items;
}

function isGroupCandidate(element: HTMLElement) {
  if (element.matches("section,main,footer,form,nav,details,summary,.lnr-shell,.cms-section-toolbar-runtime,.cms-element-toolbar-runtime")) return false;
  if (element.closest(".cms-section-toolbar-runtime,.cms-element-toolbar-runtime")) return false;
  const count = selectableDescendants(element).length;
  return count >= 2 && count <= 18;
}

function groupScope(element: HTMLElement, root: HTMLElement) {
  return editableScope(element, root);
}

function groupStableKey(element: HTMLElement, root: HTMLElement) {
  if (element.dataset.cmsGroupExplicitKey) return element.dataset.cmsGroupExplicitKey;
  const scope = groupScope(element, root);
  return `group:${scopeName(scope, root)}:${domPath(element, scope)}`;
}

function discoverGroupMap(root: HTMLElement) {
  const map = new Map<string, GroupEntry>();
  for (const element of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    if (!isGroupCandidate(element)) continue;
    const key = groupStableKey(element, root);
    map.set(key, {
      element,
      key,
      scope: scopeName(groupScope(element, root), root),
      cloneId: element.dataset.cmsGroupCloneId,
      sourceKey: element.dataset.cmsGroupCloneSource,
    });
  }
  return map;
}

function nearestGroup(target: HTMLElement, root: HTMLElement) {
  const section = target.closest<HTMLElement>("[data-cms-section-instance]");
  let node = target.parentElement;
  while (node && node !== root && node !== section) {
    if (isGroupCandidate(node)) return node;
    if (node.classList.contains("lnr-shell")) break;
    node = node.parentElement;
  }
  return null;
}

function cloneGroupExplicitKey(item: GroupClone) {
  return `group:${item.sectionId}:clone:${item.id}`;
}

function materializeGroupClones(root: HTMLElement, content: LandingContent) {
  const definitions = Array.isArray(content.groupClones) ? content.groupClones : [];
  if (!definitions.length) return;
  const groupMap = discoverGroupMap(root);
  for (const item of definitions) {
    const source = groupMap.get(item.sourceGroupKey);
    if (!source) continue;
    const clone = source.element.cloneNode(true) as HTMLElement;
    clearEditorMetadata(clone);
    stripDuplicateIds(clone);
    const groupKey = cloneGroupExplicitKey(item);
    clone.dataset.cmsGroupExplicitKey = groupKey;
    clone.dataset.cmsGroupCloneId = item.id;
    clone.dataset.cmsGroupCloneSource = item.sourceGroupKey;

    const sourceItems = selectableDescendants(source.element);
    const cloneItems = selectableDescendants(clone);
    cloneItems.forEach((entry, index) => {
      const sourceEntry = sourceItems[index];
      if (!sourceEntry) return;
      const sourceKind = sourceEntry.element instanceof HTMLImageElement ? "image" : sourceEntry.mode === "text" ? "text" : "rich";
      const sourceKey = stableKey(sourceKind, sourceEntry.element, root);
      const cloneKind = entry.element instanceof HTMLImageElement ? "image" : entry.mode === "text" ? "text" : "rich";
      entry.element.dataset.cmsExplicitKey = `${cloneKind}:${item.sectionId}:groupclone:${item.id}:${index}`;
      entry.element.dataset.cmsCloneSource = sourceKey;
    });

    source.element.insertAdjacentElement("afterend", clone);
    groupMap.set(groupKey, { element: clone, key: groupKey, scope: item.sectionId, cloneId: item.id, sourceKey: item.sourceGroupKey });
  }
}

function collectGroups(root: HTMLElement, editor: boolean) {
  const entries = Array.from(discoverGroupMap(root).values());
  for (const entry of entries) {
    entry.element.dataset.cmsGroupKey = entry.key;
    if (editor) {
      entry.element.dataset.cmsKind = "group";
      // Alias intentionally lets the same toolbar/drag system work for containers.
      entry.element.dataset.cmsKey = entry.key;
    }
  }
  return entries;
}

function previewDeviceForWidth(width: number): PreviewDevice {
  if (typeof window !== "undefined") {
    const forced = new URL(window.location.href).searchParams.get("cms_device");
    if (forced === "desktop" || forced === "tablet" || forced === "mobile") return forced;
  }
  if (width <= 700) return "mobile";
  if (width <= 1100) return "tablet";
  return "desktop";
}

function mergedResponsiveLayout(content: LandingContent, key: string, sourceKey?: string) {
  const device = previewDeviceForWidth(window.innerWidth);
  const baseSource = sourceKey ? content.layoutOverrides?.[sourceKey] || {} : {};
  const base = content.layoutOverrides?.[key] || {};
  const sourceResponsive = sourceKey ? content.responsiveLayoutOverrides?.[sourceKey] || {} : {};
  const responsive = content.responsiveLayoutOverrides?.[key] || {};
  const mergeFor = (all: Partial<Record<PreviewDevice, EditableLayout>>) => ({
    ...(all.desktop || {}),
    ...(device !== "desktop" ? all.tablet || {} : {}),
    ...(device === "mobile" ? all.mobile || {} : {}),
  });
  return { ...baseSource, ...mergeFor(sourceResponsive), ...base, ...mergeFor(responsive) } as EditableLayout;
}

function discoverElementMap(root: HTMLElement) {
  const map = new Map<string, { element: HTMLElement; kind: "text" | "image"; mode?: EditableMode; scope: string }>();
  for (const html of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const mode = classifyTextElement(html);
    if (!mode) continue;
    const kind = mode === "text" ? "text" : "rich";
    const key = stableKey(kind, html, root);
    if (!html.dataset.cmsExplicitKey) html.dataset.cmsExplicitKey = key;
    map.set(key, { element: html, kind: "text", mode, scope: scopeName(editableScope(html, root), root) });
  }
  for (const img of Array.from(root.querySelectorAll<HTMLImageElement>("img"))) {
    if (img.closest(".cms-section-toolbar-runtime")) continue;
    const key = stableKey("image", img, root);
    if (!img.dataset.cmsExplicitKey) img.dataset.cmsExplicitKey = key;
    map.set(key, { element: img, kind: "image", scope: scopeName(editableScope(img, root), root) });
  }
  return map;
}

function cloneExplicitKey(item: ElementClone) {
  const prefix = item.kind === "image" ? "image" : item.mode === "text" ? "text" : "rich";
  return `${prefix}:${item.sectionId}:clone:${item.id}`;
}

function customHost(section: HTMLElement) {
  return section.querySelector<HTMLElement>(":scope > .lnr-shell") || section.querySelector<HTMLElement>(".lnr-shell") || section;
}

function materializeCustomBlocks(root: HTMLElement, content: LandingContent) {
  const blocks = Array.isArray(content.customBlocks) ? content.customBlocks : [];
  const sections = new Map(currentBlocks(root).map(section => [section.dataset.cmsSectionInstance || "", section]));
  for (const block of blocks) {
    const section = sections.get(block.sectionId);
    if (!section) continue;
    const host = customHost(section);
    let element: HTMLElement;
    const baseClass = `cms-custom-block-runtime cms-custom-${block.kind}`;
    if (block.kind === "image") {
      const img = document.createElement("img");
      img.src = block.src || "/brand/mix10-box-transparent-v3-web.webp";
      img.alt = "";
      img.loading = "lazy";
      img.className = baseClass;
      img.dataset.cmsExplicitKey = `image:${block.sectionId}:custom:${block.id}`;
      element = img;
    } else if (block.kind === "button") {
      const link = document.createElement("a");
      link.href = block.href || "#";
      link.className = `${baseClass} lnr-button`;
      link.textContent = block.content || "NOVO BOTÃO";
      link.dataset.cmsExplicitKey = `text:${block.sectionId}:custom:${block.id}`;
      element = link;
    } else if (block.kind === "heading") {
      const heading = document.createElement("h2");
      heading.className = baseClass;
      heading.textContent = block.content || "Novo título";
      heading.dataset.cmsExplicitKey = `text:${block.sectionId}:custom:${block.id}`;
      element = heading;
    } else {
      const paragraph = document.createElement("p");
      paragraph.className = baseClass;
      paragraph.textContent = block.content || "Novo texto";
      paragraph.dataset.cmsExplicitKey = `text:${block.sectionId}:custom:${block.id}`;
      element = paragraph;
    }
    element.dataset.cmsCustomId = block.id;
    element.dataset.cmsSectionOwner = block.sectionId;
    host.append(element);
  }
}

function applyElementPlacements(content: LandingContent, entries: EditableEntry[], imageEntries: ImageEntry[], groups: GroupEntry[], root: HTMLElement) {
  const placements = Array.isArray(content.elementPlacements) ? content.elementPlacements : [];
  if (!placements.length) return;
  const map = new Map<string, HTMLElement>();
  for (const entry of entries) map.set(entry.key, entry.element);
  for (const entry of imageEntries) map.set(entry.key, entry.element);
  for (const entry of groups) map.set(entry.key, entry.element);
  const sections = new Map(currentBlocks(root).map(section => [section.dataset.cmsSectionInstance || "", section]));
  for (const placement of placements) {
    const moving = map.get(placement.key);
    if (!moving) continue;
    if (placement.targetSectionId && (placement.position === "append" || placement.position === "prepend")) {
      const section = sections.get(placement.targetSectionId);
      if (!section || moving === section || moving.contains(section)) continue;
      const host = customHost(section);
      if (placement.position === "prepend") host.prepend(moving);
      else host.append(moving);
      continue;
    }
    const target = placement.targetKey ? map.get(placement.targetKey) : undefined;
    if (!target || moving === target || moving.contains(target)) continue;
    if (placement.position === "before") target.insertAdjacentElement("beforebegin", moving);
    else target.insertAdjacentElement("afterend", moving);
  }
}

function materializeElementClones(root: HTMLElement, content: LandingContent) {
  const definitions = Array.isArray(content.elementClones) ? content.elementClones : [];
  if (!definitions.length) return;
  const map = discoverElementMap(root);
  for (const item of definitions) {
    const source = map.get(item.sourceKey);
    if (!source) continue;
    const clone = source.element.cloneNode(true) as HTMLElement;
    clearEditorMetadata(clone);
    stripDuplicateIds(clone);
    const explicitKey = cloneExplicitKey(item);
    clone.dataset.cmsExplicitKey = explicitKey;
    clone.dataset.cmsCloneId = item.id;
    clone.dataset.cmsCloneSource = item.sourceKey;
    source.element.insertAdjacentElement("afterend", clone);
    map.set(explicitKey, { element: clone, kind: item.kind, mode: item.kind === "text" ? ((item.mode as EditableMode) || source.mode || "text") : undefined, scope: item.sectionId });
  }
}

function collectEntries(root: HTMLElement, editor: boolean) {
  const entries: EditableEntry[] = [];
  const imageEntries: ImageEntry[] = [];
  for (const html of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const mode = classifyTextElement(html);
    if (!mode) continue;
    const kind = mode === "text" ? "text" : "rich";
    const key = stableKey(kind, html, root);
    const scope = editableScope(html, root);
    entries.push({
      element: html,
      key,
      oldTextKey: legacyKey("text", html, root),
      oldRichKey: legacyKey("rich", html, root),
      mode,
      scope: scopeName(scope, root),
      originalValue: selectedValue(html, mode),
      cloneId: html.dataset.cmsCloneId,
      sourceKey: html.dataset.cmsCloneSource,
      customId: html.dataset.cmsCustomId,
    });
    html.dataset.cmsKey = key;
    if (editor) {
      html.dataset.cmsLayoutSafe = "1";
      html.dataset.cmsMode = mode;
    }
  }

  for (const img of Array.from(root.querySelectorAll<HTMLImageElement>("img"))) {
    if (img.closest(".cms-section-toolbar-runtime")) continue;
    const scope = editableScope(img, root);
    const entry: ImageEntry = {
      element: img,
      key: stableKey("image", img, root),
      oldKey: legacyKey("image", img, root),
      originalSrc: img.getAttribute("src") || "",
      originalSrcset: img.getAttribute("srcset"),
      scope: scopeName(scope, root),
      cloneId: img.dataset.cmsCloneId,
      sourceKey: img.dataset.cmsCloneSource,
      customId: img.dataset.cmsCustomId,
    };
    imageEntries.push(entry);
    img.dataset.cmsKey = entry.key;
    if (editor) {
      img.dataset.cmsLayoutSafe = "1";
      img.dataset.cmsMode = "image";
    }
  }
  return { entries, imageEntries };
}

function installSectionToolbars(root: HTMLElement, catalog: BlockCatalogEntry[]) {
  const catalogMap = new Map(catalog.map(item => [item.id, item]));
  for (const block of currentBlocks(root)) {
    if (block.querySelector(":scope > .cms-section-toolbar-runtime")) continue;
    const instanceId = block.dataset.cmsSectionInstance || "";
    const sourceId = block.dataset.cmsSectionSource || instanceId;
    const definition = catalogMap.get(sourceId);
    const bar = document.createElement("div");
    bar.className = "cms-section-toolbar-runtime";
    bar.setAttribute("contenteditable", "false");

    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "cms-section-drag-runtime";
    handle.draggable = true;
    handle.title = "Arrastar seção";
    handle.textContent = "⋮⋮";

    const name = document.createElement("span");
    name.textContent = block.dataset.cmsSectionLabel || definition?.label || sourceId;

    const duplicate = document.createElement("button");
    duplicate.type = "button";
    duplicate.title = definition?.duplicateAllowed === false ? "Este bloco dinâmico não pode ser duplicado" : "Duplicar seção";
    duplicate.textContent = "⧉";
    duplicate.disabled = definition?.duplicateAllowed === false;
    duplicate.addEventListener("click", event => {
      event.preventDefault();event.stopPropagation();
      window.parent.postMessage({ type: "lordnutri-cms-section-command", action: "duplicate", instanceId }, window.location.origin);
    });

    const hide = document.createElement("button");
    hide.type = "button";
    hide.title = "Ocultar seção";
    hide.textContent = "◌";
    hide.addEventListener("click", event => {
      event.preventDefault();event.stopPropagation();
      window.parent.postMessage({ type: "lordnutri-cms-section-command", action: "toggle", instanceId }, window.location.origin);
    });

    if (instanceId !== sourceId) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "cms-section-delete-runtime";
      remove.title = "Excluir cópia";
      remove.textContent = "×";
      remove.addEventListener("click", event => {
        event.preventDefault();event.stopPropagation();
        window.parent.postMessage({ type: "lordnutri-cms-section-command", action: "delete", instanceId }, window.location.origin);
      });
      bar.append(handle, name, duplicate, hide, remove);
    } else bar.append(handle, name, duplicate, hide);

    block.prepend(bar);
  }
}

function selectionNeighbors(target: HTMLElement) {
  if (target.dataset.cmsKind === "group") {
    const siblings = Array.from(target.parentElement?.children || []).filter((node): node is HTMLElement => node instanceof HTMLElement && node.dataset.cmsKind === "group" && Boolean(node.dataset.cmsKey));
    const index = siblings.indexOf(target);
    return { previousKey: index > 0 ? siblings[index - 1]?.dataset.cmsKey : undefined, nextKey: index >= 0 && index < siblings.length - 1 ? siblings[index + 1]?.dataset.cmsKey : undefined };
  }
  const section = target.closest<HTMLElement>("[data-cms-section-instance]");
  const selectable = section ? Array.from(section.querySelectorAll<HTMLElement>('[data-cms-key]:not([data-cms-kind="group"])')) : [];
  const index = selectable.indexOf(target);
  return { previousKey: index > 0 ? selectable[index - 1]?.dataset.cmsKey : undefined, nextKey: index >= 0 && index < selectable.length - 1 ? selectable[index + 1]?.dataset.cmsKey : undefined };
}

function postSelection(root: HTMLElement, target: HTMLElement) {
  const isGroup = target.dataset.cmsKind === "group";
  const isImage = target instanceof HTMLImageElement;
  const mode = (target.dataset.cmsMode || "text") as EditableMode;
  const section = target.closest<HTMLElement>("[data-cms-section-instance]");
  const sectionId = section?.dataset.cmsSectionInstance || "root";
  const neighbors = selectionNeighbors(target);
  window.parent.postMessage({
    type: "lordnutri-cms-select",
    key: target.dataset.cmsKey,
    kind: isGroup ? "group" : isImage ? "image" : "text",
    mode: isGroup ? "group" : mode,
    sectionId,
    value: isGroup ? (target.innerText || "Conjunto").trim().slice(0, 240) : isImage ? target.currentSrc || target.src : selectedValue(target, mode),
    style: !isGroup && !isImage ? captureStyle(target) : undefined,
    cloneId: target.dataset.cmsCloneId,
    groupCloneId: target.dataset.cmsGroupCloneId,
    customId: target.dataset.cmsCustomId,
    sourceKey: isGroup ? target.dataset.cmsGroupCloneSource : target.dataset.cmsCloneSource,
    ...neighbors,
  }, window.location.origin);
  return neighbors;
}

function installElementToolbar(root: HTMLElement, target: HTMLElement, neighbors = selectionNeighbors(target)) {
  root.querySelectorAll(".cms-element-toolbar-runtime").forEach(node => node.remove());
  const toolbar = document.createElement("div");
  toolbar.className = "cms-element-toolbar-runtime";
  toolbar.setAttribute("contenteditable", "false");
  toolbar.dataset.cmsFor = target.dataset.cmsKey || "";

  const drag = document.createElement("button");
  drag.type = "button"; drag.draggable = true; drag.className = "cms-element-drag-runtime"; drag.title = "Arrastar e encaixar em outro ponto ou seção"; drag.textContent = "⋮⋮";
  drag.dataset.cmsDragKey = target.dataset.cmsKey || "";

  const free = document.createElement("button");
  free.type = "button"; free.className = "cms-element-free-runtime"; free.title = "Mover livremente neste tamanho de tela"; free.textContent = "✥";
  free.addEventListener("pointerdown", event => {
    event.preventDefault(); event.stopPropagation();
    const startX = event.clientX; const startY = event.clientY;
    target.classList.add("cms-element-free-moving-runtime");
    const move = (pointer: PointerEvent) => {
      const dx = Math.round(pointer.clientX - startX); const dy = Math.round(pointer.clientY - startY);
      target.style.translate = `${dx}px ${dy}px`;
    };
    const finish = (pointer: PointerEvent) => {
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", finish);
      const dx = Math.round(pointer.clientX - startX); const dy = Math.round(pointer.clientY - startY);
      target.style.removeProperty("translate"); target.classList.remove("cms-element-free-moving-runtime");
      if (Math.abs(dx) + Math.abs(dy) < 2) return;
      window.parent.postMessage({ type: "lordnutri-cms-free-move", key: target.dataset.cmsKey, dx, dy, device: previewDeviceForWidth(window.innerWidth) }, window.location.origin);
    };
    document.addEventListener("pointermove", move); document.addEventListener("pointerup", finish, { once: true });
  });

  const up = document.createElement("button");
  up.type = "button"; up.title = "Mover para cima"; up.textContent = "↑"; up.disabled = !neighbors.previousKey;
  up.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); if (neighbors.previousKey) window.parent.postMessage({type:"lordnutri-cms-element-drop",dragKey:target.dataset.cmsKey,targetKey:neighbors.previousKey,position:"before"},window.location.origin); });
  const down = document.createElement("button");
  down.type = "button"; down.title = "Mover para baixo"; down.textContent = "↓"; down.disabled = !neighbors.nextKey;
  down.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); if (neighbors.nextKey) window.parent.postMessage({type:"lordnutri-cms-element-drop",dragKey:target.dataset.cmsKey,targetKey:neighbors.nextKey,position:"after"},window.location.origin); });
  const duplicate = document.createElement("button");
  duplicate.type = "button"; duplicate.title = target.dataset.cmsKind === "group" ? "Duplicar conjunto inteiro" : "Duplicar elemento"; duplicate.textContent = "⧉";
  duplicate.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); postSelection(root,target); window.parent.postMessage({type:"lordnutri-cms-element-command",action:"duplicate",key:target.dataset.cmsKey},window.location.origin); });
  const hide = document.createElement("button");
  hide.type = "button"; hide.title = "Ocultar elemento"; hide.textContent = "◌";
  hide.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); postSelection(root,target); window.parent.postMessage({type:"lordnutri-cms-element-command",action:"toggle",key:target.dataset.cmsKey},window.location.origin); });
  toolbar.append(drag, free, up, down, duplicate, hide);

  if (target.dataset.cmsKind !== "group") {
    const group = nearestGroup(target, root);
    if (group?.dataset.cmsKey) {
      const groupButton = document.createElement("button");
      groupButton.type = "button"; groupButton.className = "cms-element-group-runtime"; groupButton.title = "Selecionar número + texto como um conjunto"; groupButton.textContent = "▦ conjunto";
      groupButton.addEventListener("click", event => {
        event.preventDefault(); event.stopPropagation();
        root.querySelectorAll(".cms-selected").forEach(item => item.classList.remove("cms-selected"));
        group.classList.add("cms-selected", "cms-group-selected-runtime");
        const groupNeighbors = postSelection(root, group);
        installElementToolbar(root, group, groupNeighbors);
      });
      toolbar.append(groupButton);
    }
  }

  if (target.dataset.cmsCloneId || target.dataset.cmsGroupCloneId || target.dataset.cmsCustomId) {
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "cms-element-delete-runtime"; remove.title = "Excluir elemento"; remove.textContent = "×";
    remove.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); postSelection(root,target); window.parent.postMessage({type:"lordnutri-cms-element-command",action:"delete",key:target.dataset.cmsKey,cloneId:target.dataset.cmsCloneId,groupCloneId:target.dataset.cmsGroupCloneId,customId:target.dataset.cmsCustomId},window.location.origin); });
    toolbar.append(remove);
  }
  const rect = target.getBoundingClientRect();
  toolbar.style.left = `${Math.max(6, Math.min(window.innerWidth - 330, rect.left))}px`;
  toolbar.style.top = `${Math.max(6, rect.top - 38)}px`;
  target.insertAdjacentElement("beforebegin", toolbar);
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
    let cleanupDrag = () => {};
    let cleanupResize = () => {};

    const run = async () => {
      const [response, productResponse] = await Promise.all([
        fetch(`/api/public/cms/landing${preview ? "?preview=draft" : ""}`, { cache: "no-store" }),
        fetch(`/api/public/cms/products${preview ? "?preview=draft" : ""}`, { cache: "no-store" }),
      ]);
      const body = await response.json().catch(() => ({ content: null }));
      const productBody = await productResponse.json().catch(() => ({ content: null }));
      const initialContent = (body?.content || {}) as LandingContent;
      const products = productBody?.content?.products || [];

      const { catalog, instances } = materializeSections(root, initialContent, editor);
      materializeCustomBlocks(root, initialContent);
      materializeGroupClones(root, initialContent);
      materializeElementClones(root, initialContent);
      const { entries, imageEntries } = collectEntries(root, editor);
      const groupEntries = collectGroups(root, editor);
      applyElementPlacements(initialContent, entries, imageEntries, groupEntries, root);

      let currentContent = initialContent;
      const applyContent = (content: LandingContent) => {
        currentContent = content;
        const overrides = content.overrides || {};
        const imageOverrides = content.imageOverrides || {};
        const styleOverrides = content.styleOverrides || {};
        const layoutOverrides = content.layoutOverrides || {};
        const hiddenElements = new Set(content.hiddenElements || []);
        applyCurrentSectionState(root, content);

        for (const entry of entries) {
          const blockLegacy = entry.scope === "lord-nutri";
          let value: unknown = overrides[entry.key];
          if (typeof value !== "string" && entry.sourceKey) value = overrides[entry.sourceKey];
          if (typeof value !== "string" && !blockLegacy && !entry.cloneId && !entry.sourceKey) {
            value = entry.mode === "text"
              ? overrides[entry.oldTextKey]
              : overrides[entry.oldRichKey] ?? overrides[entry.oldTextKey];
          }
          renderText(entry.element, typeof value === "string" ? value : entry.originalValue, entry.mode);
          const sourceStyle = entry.sourceKey ? styleOverrides[entry.sourceKey] || {} : {};
          applyEditableStyle(entry.element, { ...sourceStyle, ...(styleOverrides[entry.key] || {}) });
          applyEditableLayout(entry.element, mergedResponsiveLayout(content, entry.key, entry.sourceKey));
          if (!entry.element.dataset.cmsEditing) entry.element.style.display = hiddenElements.has(entry.key) ? "none" : "";
        }

        for (const entry of imageEntries) {
          const value = imageOverrides[entry.key] ?? (entry.sourceKey ? imageOverrides[entry.sourceKey] : undefined) ?? (!entry.cloneId ? imageOverrides[entry.oldKey] : undefined);
          if (typeof value === "string" && value) {
            entry.element.setAttribute("src", value);
            entry.element.removeAttribute("srcset");
          } else {
            entry.element.setAttribute("src", entry.originalSrc);
            if (entry.originalSrcset) entry.element.setAttribute("srcset", entry.originalSrcset);
            else entry.element.removeAttribute("srcset");
          }
          applyEditableLayout(entry.element, mergedResponsiveLayout(content, entry.key, entry.sourceKey));
          entry.element.style.display = hiddenElements.has(entry.key) ? "none" : "";
        }

        for (const entry of groupEntries) {
          applyEditableLayout(entry.element, mergedResponsiveLayout(content, entry.key, entry.sourceKey));
          entry.element.style.display = hiddenElements.has(entry.key) ? "none" : "";
        }
      };

      applyContent(initialContent);
      const resizeHandler = () => applyContent(currentContent);
      window.addEventListener("resize", resizeHandler);
      cleanupResize = () => window.removeEventListener("resize", resizeHandler);

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

      if (editor) {
        installSectionToolbars(root, catalog);
        window.parent.postMessage({
          type: "lordnutri-cms-ready",
          sections: catalog.map(item => ({ id: item.id, label: item.label, sourceId: item.id, duplicateAllowed: item.duplicateAllowed })),
          instances,
        }, window.location.origin);

        const clickHandler: EventListener = (event) => {
          const mouseEvent = event as MouseEvent;
          const origin = mouseEvent.target;
          if (!(origin instanceof Element)) return;
          if (origin.closest(".cms-section-toolbar-runtime,.cms-element-toolbar-runtime")) return;
          const target = origin.closest<HTMLElement>("[data-cms-key]");
          if (!target || !root.contains(target)) return;
          mouseEvent.preventDefault();
          mouseEvent.stopPropagation();
          root.querySelectorAll(".cms-selected,.cms-group-selected-runtime").forEach(item => item.classList.remove("cms-selected","cms-group-selected-runtime"));
          target.classList.add("cms-selected");
          if (target.dataset.cmsKind === "group") target.classList.add("cms-group-selected-runtime");
          const neighbors = postSelection(root, target);
          installElementToolbar(root, target, neighbors);
        };

        const doubleClickHandler: EventListener = (event) => {
          const mouseEvent = event as MouseEvent;
          const origin = mouseEvent.target;
          if (!(origin instanceof Element) || origin.closest(".cms-section-toolbar-runtime")) return;
          const target = origin.closest<HTMLElement>("[data-cms-key]");
          if (!target || target.dataset.cmsKind === "group" || target instanceof HTMLImageElement || !root.contains(target)) return;
          mouseEvent.preventDefault();mouseEvent.stopPropagation();
          target.dataset.cmsEditing = "1";
          target.contentEditable = "true";
          target.spellcheck = true;
          target.classList.add("cms-inline-editing");
          target.focus();
          const range = document.createRange();range.selectNodeContents(target);range.collapse(false);
          const selection = window.getSelection();selection?.removeAllRanges();selection?.addRange(range);

          const finish = () => {
            target.contentEditable = "false";
            target.classList.remove("cms-inline-editing");
            delete target.dataset.cmsEditing;
            const mode = (target.dataset.cmsMode || "text") as EditableMode;
            window.parent.postMessage({type:"lordnutri-cms-inline-change",key:target.dataset.cmsKey,value:selectedValue(target,mode)},window.location.origin);
          };
          const keydown = (keyboard: KeyboardEvent) => {
            if (keyboard.key === "Escape") { keyboard.preventDefault(); target.blur(); }
            if ((keyboard.ctrlKey || keyboard.metaKey) && keyboard.key === "Enter") { keyboard.preventDefault(); target.blur(); }
          };
          const paste = (pasteEvent: ClipboardEvent) => {
            pasteEvent.preventDefault();
            const text = pasteEvent.clipboardData?.getData("text/plain") || "";
            document.execCommand("insertText", false, text);
          };
          target.addEventListener("keydown", keydown, { once: false });
          target.addEventListener("paste", paste, { once: false });
          target.addEventListener("blur", () => { target.removeEventListener("keydown", keydown);target.removeEventListener("paste", paste);finish(); }, { once: true });
        };

        let draggedSection = "";
        let draggedElement = "";
        const dragStartHandler = (event: DragEvent) => {
          const origin = event.target;
          if (!(origin instanceof Element)) return;
          const elementHandle = origin.closest<HTMLElement>(".cms-element-drag-runtime");
          if (elementHandle) {
            draggedElement = elementHandle.dataset.cmsDragKey || "";
            const selected = root.querySelector<HTMLElement>(`[data-cms-key="${CSS.escape(draggedElement)}"]`);
            selected?.classList.add("cms-element-dragging-runtime");
            if (event.dataTransfer) { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", draggedElement); }
            return;
          }
          const handle = origin.closest<HTMLElement>(".cms-section-drag-runtime");
          if (!handle) return;
          const block = handle.closest<HTMLElement>("[data-cms-section-instance]");
          draggedSection = block?.dataset.cmsSectionInstance || "";
          if (event.dataTransfer) { event.dataTransfer.effectAllowed = "move";event.dataTransfer.setData("text/plain", draggedSection); }
          block?.classList.add("cms-section-dragging-runtime");
        };
        const dragEndHandler = () => {root.querySelectorAll(".cms-section-dragging-runtime,.cms-element-dragging-runtime").forEach(node=>node.classList.remove("cms-section-dragging-runtime","cms-element-dragging-runtime"));draggedSection="";draggedElement="";};
        const dragOverHandler = (event: DragEvent) => {
          if (!draggedSection && !draggedElement) return;
          const origin=event.target;if(!(origin instanceof Element))return;
          if (draggedElement) {
            const moving=root.querySelector<HTMLElement>(`[data-cms-key="${CSS.escape(draggedElement)}"]`);
            if(!moving)return;
            const rawTarget=origin.closest<HTMLElement>("[data-cms-key]");
            const target=moving.dataset.cmsKind==="group"?(origin.closest<HTMLElement>('[data-cms-kind="group"]')||rawTarget):rawTarget;
            if(target&&target.dataset.cmsKey!==draggedElement&&!moving.contains(target)) {
              event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect="move";return;
            }
            const targetSection=origin.closest<HTMLElement>("[data-cms-section-instance]");
            if(targetSection&&!moving.contains(targetSection)){event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect="move";}
            return;
          }
          const block=origin.closest<HTMLElement>("[data-cms-section-instance]");if(!block)return;
          event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect="move";
        };
        const dropHandler = (event: DragEvent) => {
          const origin=event.target;if(!(origin instanceof Element))return;
          if (draggedElement) {
            const moving=root.querySelector<HTMLElement>(`[data-cms-key="${CSS.escape(draggedElement)}"]`);
            if(!moving)return;
            const rawTarget=origin.closest<HTMLElement>("[data-cms-key]");
            const target=moving.dataset.cmsKind==="group"?(origin.closest<HTMLElement>('[data-cms-kind="group"]')||rawTarget):rawTarget;
            if(target&&target.dataset.cmsKey!==draggedElement&&!moving.contains(target)) {
              event.preventDefault();
              const rect=target.getBoundingClientRect();
              const position: "before" | "after" = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
              window.parent.postMessage({type:"lordnutri-cms-element-drop",dragKey:draggedElement,targetKey:target.dataset.cmsKey,position},window.location.origin);
              dragEndHandler();return;
            }
            const targetSection=origin.closest<HTMLElement>("[data-cms-section-instance]");
            const targetSectionId=targetSection?.dataset.cmsSectionInstance||"";
            if(targetSectionId&&!moving.contains(targetSection!)) {
              event.preventDefault();
              window.parent.postMessage({type:"lordnutri-cms-element-drop",dragKey:draggedElement,targetSectionId,position:"append"},window.location.origin);
              dragEndHandler();return;
            }
            return;
          }
          if (!draggedSection) return;
          const block=origin.closest<HTMLElement>("[data-cms-section-instance]");if(!block)return;
          event.preventDefault();
          const targetId=block.dataset.cmsSectionInstance||"";
          if(targetId&&targetId!==draggedSection)window.parent.postMessage({type:"lordnutri-cms-section-drop",dragId:draggedSection,targetId},window.location.origin);
          dragEndHandler();
        };

        root.addEventListener("click", clickHandler, true);
        root.addEventListener("dblclick", doubleClickHandler, true);
        root.addEventListener("dragstart", dragStartHandler);
        root.addEventListener("dragend", dragEndHandler);
        root.addEventListener("dragover", dragOverHandler);
        root.addEventListener("drop", dropHandler);
        cleanupClicks = () => {root.removeEventListener("click", clickHandler, true);root.removeEventListener("dblclick", doubleClickHandler, true);};
        cleanupDrag = () => {root.removeEventListener("dragstart", dragStartHandler);root.removeEventListener("dragend", dragEndHandler);root.removeEventListener("dragover", dragOverHandler);root.removeEventListener("drop", dropHandler);};

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
    return () => { cleanupClicks();cleanupMessages();cleanupDrag();cleanupResize(); };
  }, []);
  return null;
}
