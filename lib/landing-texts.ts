import fields from "@/data/landing-texts.json";
export type LandingTexts = Record<string,string>;
export const LANDING_TEXT_FIELDS = fields;
const LEGACY_ANVISA_TEXTS = new Set([
  "Processo de Notificação Anvisa N°",
  "Processo de Notificação Anvisa N° 2535115572620267",
  "Processo de Notificação Anvisa N° 25351155726202677",
]);
export class LandingTextError extends Error {
  constructor(message:string,public status=400){super(message);}
}
export function landingText(texts:LandingTexts|undefined,key:string){
  const field=fields[key as keyof typeof fields];
  const text=texts?.[key]??field?.text??"";
  if(!field||!text)return text;
  const before=field.text.match(/^\s+/)?.[0]??"";
  const after=field.text.match(/\s+$/)?.[0]??"";
  return `${before&&!/^\s/.test(text)?before:""}${text}${after&&!/\s$/.test(text)?after:""}`;
}
export function validateLandingTexts(value:unknown):LandingTexts {
  if(!value||typeof value!=="object"||Array.isArray(value))throw new LandingTextError("Os textos enviados são inválidos.");
  const result:LandingTexts={};
  for(const [key,text] of Object.entries(value)){
    const field=fields[key as keyof typeof fields];
    if(!Object.hasOwn(fields,key)||!field)throw new LandingTextError("Este campo não pertence ao Studio de textos. Recarregue o painel.");
    if(typeof text!=="string"||text.length>field.maxLength||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))throw new LandingTextError(`Confira “${field.label}”: limite de ${field.maxLength} caracteres.`);
    result[key]=text;
  }
  return result;
}
export function resolveLandingTexts(value:unknown):LandingTexts {
  const defaults=Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,field.text]));
  try{
    const result={...defaults,...validateLandingTexts(value)};
    if(LEGACY_ANVISA_TEXTS.has(result["mix10pro.007"]?.trim()))result["mix10pro.007"]=defaults["mix10pro.007"];
    return result;
  }catch{return defaults;}
}
