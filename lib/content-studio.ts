import { getMysqlPool } from "@/db";
import manualFields from "@/data/manual-fields.json";

export type StudioDocType = "landing" | "manual" | "products" | "media";

type StudioRow = { doc_type: StudioDocType; draft_json: string; published_json: string; updated_at: string; published_at: string | null };

const productDefaults = {
  products: [
    { id: "mix10pro", name: "MIX10 PRO", subtitle: "Suplemento alimentar em cápsulas", image: "/brand/mix10-box-transparent-v3-web.webp", anvisa: "2535115572620267", active: true },
    { id: "kit20", name: "KIT20", subtitle: "20 caixas", image: "/brand/mix10-box-transparent-v3-web.webp", price: "R$ 1.498,00", active: true },
    { id: "kit50", name: "KIT50", subtitle: "50 caixas", image: "/brand/mix10-box-transparent-v3-web.webp", price: "R$ 3.495,00", active: true },
  ],
};
const mediaDefaults = { assets: [
  { id:"lordnutri-logo", label:"Logo LORD NUTRI", url:"/brand/lordnutri-logo-gold-v3-web.webp", kind:"image" },
  { id:"mix10-box", label:"Caixa MIX10 PRO", url:"/brand/mix10-box-transparent-v3-web.webp", kind:"image" },
  { id:"people-revenda", label:"Foto revenda", url:"/brand/conversa-revenda-1280-v4.webp", kind:"image" },
  { id:"people-wellbeing", label:"Foto bem-estar", url:"/brand/caminhada-bem-estar-1280-v4.webp", kind:"image" },
]};
const defaults: Record<StudioDocType, unknown> = {
  landing: { overrides: {}, imageOverrides: {}, styleOverrides: {}, layoutOverrides: {}, responsiveLayoutOverrides: {}, sectionOrder: [], sectionInstances: [], elementClones: [], groupClones: [], elementPlacements: [], customBlocks: [], hiddenElements: [] },
  manual: manualFields,
  products: productDefaults,
  media: mediaDefaults,
};

export async function ensureContentStudioSchema() {
  await getMysqlPool().query(`CREATE TABLE IF NOT EXISTS \`content_studio\` (
    \`doc_type\` varchar(30) NOT NULL,
    \`draft_json\` longtext NOT NULL,
    \`published_json\` longtext NOT NULL,
    \`updated_at\` varchar(40) NOT NULL,
    \`published_at\` varchar(40) NULL,
    PRIMARY KEY (\`doc_type\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const now = new Date().toISOString();
  for (const type of Object.keys(defaults) as StudioDocType[]) {
    const initial = JSON.stringify(defaults[type]);
    await getMysqlPool().execute(
      "INSERT IGNORE INTO content_studio (doc_type,draft_json,published_json,updated_at,published_at) VALUES (?,?,?,?,?)",
      [type, initial, initial, now, now],
    );
  }
}

function parse(value: string | null | undefined, fallback: unknown) {
  try { return JSON.parse(value || ""); } catch { return fallback; }
}

function sanitizeStringMap(value: unknown, maxLength: number) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry !== "string") continue;
    if (!/^(text|rich|image):/.test(key)) continue;
    output[key.slice(0, 500)] = entry.slice(0, maxLength);
  }
  return output;
}

const allowedStyleKeys = new Set([
  "fontFamily", "fontSize", "fontWeight", "fontStyle", "color", "textAlign",
  "letterSpacing", "lineHeight", "textTransform", "textDecoration",
]);

function sanitizeStyleOverrides(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, Record<string, string>> = {};
  for (const [key, rawStyle] of Object.entries(value as Record<string, unknown>)) {
    if (!/^(text|rich):/.test(key)) continue;
    if (!rawStyle || typeof rawStyle !== "object" || Array.isArray(rawStyle)) continue;
    const clean: Record<string, string> = {};
    for (const [styleKey, rawValue] of Object.entries(rawStyle as Record<string, unknown>)) {
      if (!allowedStyleKeys.has(styleKey) || typeof rawValue !== "string") continue;
      const value = rawValue.trim().slice(0, 180);
      if (!value) continue;
      clean[styleKey] = value;
    }
    if (Object.keys(clean).length) output[key.slice(0, 500)] = clean;
  }
  return output;
}

const allowedLayoutKeys = new Set([
  "width", "maxWidth", "minWidth", "height", "maxHeight", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderRadius", "opacity", "objectFit", "objectPosition",
  "backgroundColor", "borderColor", "borderWidth", "borderStyle", "position", "left", "top", "right", "bottom",
  "zIndex", "order", "flexBasis", "gridColumn", "gridRow", "alignSelf", "justifySelf",
]);

function safeCssValue(value: string) {
  const trimmed = value.trim().slice(0, 160);
  if (!trimmed || /[;{}<>]/.test(trimmed) || /url\s*\(|expression\s*\(/i.test(trimmed)) return "";
  return trimmed;
}

function sanitizeLayoutOverrides(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, Record<string, string>> = {};
  for (const [key, rawLayout] of Object.entries(value as Record<string, unknown>)) {
    if (!/^(text|rich|image|group):/.test(key)) continue;
    if (!rawLayout || typeof rawLayout !== "object" || Array.isArray(rawLayout)) continue;
    const clean: Record<string, string> = {};
    for (const [layoutKey, rawValue] of Object.entries(rawLayout as Record<string, unknown>)) {
      if (!allowedLayoutKeys.has(layoutKey) || typeof rawValue !== "string") continue;
      const normalized = safeCssValue(rawValue);
      if (normalized) clean[layoutKey] = normalized;
    }
    if (Object.keys(clean).length) output[key.slice(0, 500)] = clean;
  }
  return output;
}

function sanitizeResponsiveLayoutOverrides(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, Record<string, Record<string, string>>> = {};
  for (const [key, rawByDevice] of Object.entries(value as Record<string, unknown>)) {
    if (!/^(text|rich|image|group):/.test(key) || !rawByDevice || typeof rawByDevice !== "object" || Array.isArray(rawByDevice)) continue;
    const cleanByDevice: Record<string, Record<string, string>> = {};
    for (const device of ["desktop","tablet","mobile"] as const) {
      const rawLayout = (rawByDevice as Record<string, unknown>)[device];
      if (!rawLayout || typeof rawLayout !== "object" || Array.isArray(rawLayout)) continue;
      const clean: Record<string, string> = {};
      for (const [layoutKey, rawValue] of Object.entries(rawLayout as Record<string, unknown>)) {
        if (!allowedLayoutKeys.has(layoutKey) || typeof rawValue !== "string") continue;
        const normalized = safeCssValue(rawValue);
        if (normalized) clean[layoutKey] = normalized;
      }
      if (Object.keys(clean).length) cleanByDevice[device] = clean;
    }
    if (Object.keys(cleanByDevice).length) output[key.slice(0,500)] = cleanByDevice;
  }
  return output;
}

function sanitizeGroupClones(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const output: Array<{ id: string; sourceGroupKey: string; sectionId: string }> = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim().slice(0,100) : "";
    const sourceGroupKey = typeof item.sourceGroupKey === "string" ? item.sourceGroupKey.trim().slice(0,500) : "";
    const sectionId = typeof item.sectionId === "string" ? item.sectionId.trim().slice(0,100) : "";
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id) || !/^group:/.test(sourceGroupKey) || !/^[a-z0-9][a-z0-9-]*$/i.test(sectionId) || seen.has(id)) continue;
    seen.add(id); output.push({id,sourceGroupKey,sectionId});
    if (output.length >= 120) break;
  }
  return output;
}

function sanitizeSectionOrder(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const id = raw.trim().slice(0, 80);
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id) || seen.has(id)) continue;
    seen.add(id);
    output.push(id);
    if (output.length >= 30) break;
  }
  return output;
}


function sanitizeSectionInstances(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const output: Array<{ id: string; sourceId: string; hidden?: boolean; label?: string }> = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim().slice(0, 100) : "";
    const sourceId = typeof item.sourceId === "string" ? item.sourceId.trim().slice(0, 80) : "";
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id) || !/^[a-z0-9][a-z0-9-]*$/i.test(sourceId) || seen.has(id)) continue;
    seen.add(id);
    const next: { id: string; sourceId: string; hidden?: boolean; label?: string } = { id, sourceId };
    if (item.hidden === true) next.hidden = true;
    if (typeof item.label === "string" && item.label.trim()) next.label = item.label.trim().slice(0, 80);
    output.push(next);
    if (output.length >= 40) break;
  }
  return output;
}

function sanitizeElementClones(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const output: Array<{ id: string; sourceKey: string; sectionId: string; kind: "text" | "image"; mode?: string }> = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim().slice(0, 100) : "";
    const sourceKey = typeof item.sourceKey === "string" ? item.sourceKey.trim().slice(0, 500) : "";
    const sectionId = typeof item.sectionId === "string" ? item.sectionId.trim().slice(0, 100) : "";
    const kind = item.kind === "image" ? "image" : "text";
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id) || !/^(text|rich|image):/.test(sourceKey) || !/^[a-z0-9][a-z0-9-]*$/i.test(sectionId) || seen.has(id)) continue;
    seen.add(id);
    const next: { id: string; sourceKey: string; sectionId: string; kind: "text" | "image"; mode?: string } = { id, sourceKey, sectionId, kind };
    if (typeof item.mode === "string" && ["text", "brand", "lines", "image"].includes(item.mode)) next.mode = item.mode;
    output.push(next);
    if (output.length >= 120) break;
  }
  return output;
}

function sanitizeElementPlacements(value: unknown) {
  if (!Array.isArray(value)) return [];
  const output: Array<{ key: string; targetKey?: string; targetSectionId?: string; position: "before" | "after" | "append" | "prepend" }> = [];
  const seen = new Set<string>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const key = typeof item.key === "string" ? item.key.trim().slice(0,500) : "";
    const targetKey = typeof item.targetKey === "string" ? item.targetKey.trim().slice(0,500) : "";
    const targetSectionId = typeof item.targetSectionId === "string" ? item.targetSectionId.trim().slice(0,100) : "";
    const position = ["before","after","append","prepend"].includes(String(item.position)) ? item.position as "before"|"after"|"append"|"prepend" : null;
    if (!position || !/^(text|rich|image|group):/.test(key) || seen.has(key)) continue;
    if ((position === "before" || position === "after") && (!/^(text|rich|image|group):/.test(targetKey) || key === targetKey)) continue;
    if ((position === "append" || position === "prepend") && !/^[a-z0-9][a-z0-9-]*$/i.test(targetSectionId)) continue;
    seen.add(key);
    const next: { key:string;targetKey?:string;targetSectionId?:string;position:"before"|"after"|"append"|"prepend" }={key,position};
    if (targetKey) next.targetKey=targetKey;
    if (targetSectionId) next.targetSectionId=targetSectionId;
    output.push(next);
    if (output.length >= 180) break;
  }
  return output;
}

function sanitizeCustomBlocks(value: unknown) {
  if (!Array.isArray(value)) return [];
  const output: Array<{ id: string; sectionId: string; kind: "heading" | "text" | "button" | "image"; content?: string; href?: string; src?: string }> = [];
  const seen = new Set<string>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim().slice(0, 100) : "";
    const sectionId = typeof item.sectionId === "string" ? item.sectionId.trim().slice(0, 100) : "";
    const kind = ["heading","text","button","image"].includes(String(item.kind)) ? item.kind as "heading"|"text"|"button"|"image" : null;
    if (!kind || !/^[a-z0-9][a-z0-9-]*$/i.test(id) || !/^[a-z0-9][a-z0-9-]*$/i.test(sectionId) || seen.has(id)) continue;
    seen.add(id);
    const next: { id: string; sectionId: string; kind: "heading" | "text" | "button" | "image"; content?: string; href?: string; src?: string } = { id, sectionId, kind };
    if (typeof item.content === "string") next.content = item.content.slice(0, 5000);
    if (typeof item.href === "string") next.href = item.href.trim().slice(0, 1200);
    if (typeof item.src === "string") next.src = item.src.trim().slice(0, 1500);
    output.push(next);
    if (output.length >= 120) break;
  }
  return output;
}

function sanitizeStringList(value: unknown, max = 160) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const entry = raw.trim().slice(0, 500);
    if (!entry || seen.has(entry) || !/^(text|rich|image|group):/.test(entry)) continue;
    seen.add(entry);
    output.push(entry);
    if (output.length >= max) break;
  }
  return output;
}

function sanitizeLandingDraft(value: unknown) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    // O editor visual nunca persiste HTML, classes arbitrárias ou scripts.
    // Conteúdo, estilos tipográficos permitidos e ordem das seções são dados separados.
    overrides: sanitizeStringMap(source.overrides, 5000),
    imageOverrides: sanitizeStringMap(source.imageOverrides, 1500),
    styleOverrides: sanitizeStyleOverrides(source.styleOverrides),
    layoutOverrides: sanitizeLayoutOverrides(source.layoutOverrides),
    responsiveLayoutOverrides: sanitizeResponsiveLayoutOverrides(source.responsiveLayoutOverrides),
    sectionOrder: sanitizeSectionOrder(source.sectionOrder),
    sectionInstances: sanitizeSectionInstances(source.sectionInstances),
    elementClones: sanitizeElementClones(source.elementClones),
    groupClones: sanitizeGroupClones(source.groupClones),
    elementPlacements: sanitizeElementPlacements(source.elementPlacements),
    customBlocks: sanitizeCustomBlocks(source.customBlocks),
    hiddenElements: sanitizeStringList(source.hiddenElements),
  };
}

export async function getStudioDoc(type: StudioDocType) {
  await ensureContentStudioSchema();
  const [rows] = await getMysqlPool().execute("SELECT * FROM content_studio WHERE doc_type=? LIMIT 1", [type]);
  const row = (rows as StudioRow[])[0];
  return {
    type,
    draft: parse(row?.draft_json, defaults[type]),
    published: parse(row?.published_json, defaults[type]),
    updatedAt: row?.updated_at || null,
    publishedAt: row?.published_at || null,
  };
}

export async function saveStudioDraft(type: StudioDocType, value: unknown) {
  await ensureContentStudioSchema();
  const now = new Date().toISOString();
  const safeValue = type === "landing" ? sanitizeLandingDraft(value) : value;
  await getMysqlPool().execute("UPDATE content_studio SET draft_json=?,updated_at=? WHERE doc_type=?", [JSON.stringify(safeValue), now, type]);
  return getStudioDoc(type);
}

export async function publishStudioDoc(type: StudioDocType) {
  await ensureContentStudioSchema();
  const now = new Date().toISOString();
  await getMysqlPool().execute("UPDATE content_studio SET published_json=draft_json,published_at=?,updated_at=? WHERE doc_type=?", [now, now, type]);
  return getStudioDoc(type);
}

export function isStudioDocType(value: string): value is StudioDocType {
  return value === "landing" || value === "manual" || value === "products" || value === "media";
}
