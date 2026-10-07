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
  landing: { overrides: {}, imageOverrides: {}, styleOverrides: {}, sectionOrder: [] },
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
    sectionOrder: sanitizeSectionOrder(source.sectionOrder),
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
