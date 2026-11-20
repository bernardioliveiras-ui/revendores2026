import { getMysqlPool } from "@/db";
import { ensureContentStudioSchema } from "@/lib/content-studio";
import { LandingTextError, resolveLandingTexts, validateLandingTexts } from "@/lib/landing-texts";
const TYPE="landing_texts_v1";
type Row={draft_json:string;published_json:string;updated_at:string;published_at:string|null};
function parse(value:string){try{return JSON.parse(value);}catch{return {};}}
async function row():Promise<Row>{
  await ensureContentStudioSchema();
  const pool=getMysqlPool();const initial=JSON.stringify(resolveLandingTexts({}));
  await pool.execute("INSERT IGNORE INTO content_studio (doc_type,draft_json,published_json,updated_at,published_at) VALUES (?,?,?,?,?)",[TYPE,initial,initial,new Date().toISOString(),null]);
  const [rows]=await pool.execute("SELECT * FROM content_studio WHERE doc_type=? LIMIT 1",[TYPE]);
  const found=(rows as Row[])[0];if(!found)throw Error("LANDING_TEXT_STORAGE");return found;
}
export async function readLandingTextDocument(){const value=await row();return {texts:resolveLandingTexts(parse(value.draft_json)),revision:value.updated_at,publishedAt:value.published_at};}
export async function readPublishedLandingTexts(){try{return resolveLandingTexts(parse((await row()).published_json));}catch{return resolveLandingTexts({});}}
export async function writeLandingTextDocument(value:unknown,revision:string,publish:boolean){
  const texts=validateLandingTexts(value);const previous=Date.parse(revision);
  if(!Number.isFinite(previous))throw new LandingTextError("Versão inválida. Recarregue o rascunho.");
  const next=new Date(Math.max(Date.now(),previous+1)).toISOString();const json=JSON.stringify(texts);
  const pool=getMysqlPool();
  const [result]=publish
    ?await pool.execute("UPDATE content_studio SET draft_json=?,published_json=?,updated_at=?,published_at=? WHERE doc_type=? AND updated_at=?",[json,json,next,next,TYPE,revision])
    :await pool.execute("UPDATE content_studio SET draft_json=?,updated_at=? WHERE doc_type=? AND updated_at=?",[json,next,TYPE,revision]);
  if((result as {affectedRows:number}).affectedRows!==1)throw new LandingTextError("Outra sessão salvou primeiro. Copie os textos que quer manter e recarregue o rascunho antes de salvar.",409);
  return {texts:resolveLandingTexts(texts),revision:next,publishedAt:publish?next:(await row()).published_at};
}
