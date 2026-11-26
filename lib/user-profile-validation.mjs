export const MAX_AVATAR_BYTES=2*1024*1024;
export function validateBio(value){
  if(typeof value!=='string')throw new Error('A biografia deve ser um texto.');
  const bio=value.trim();if([...bio].length>160)throw new Error('A biografia deve ter no máximo 160 caracteres.');
  return bio;
}
export function identifyAvatar(bytes,declaredType,size){
  if(!Number.isSafeInteger(size)||size<4||size>MAX_AVATAR_BYTES)throw new Error('A foto deve ter até 2 MB.');
  const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  let type=null;
  if(b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)type='image/jpeg';
  else if(b.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))type='image/png';
  else if(b.length>=12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')type='image/webp';
  if(!type||type!==declaredType)throw new Error('Envie uma imagem JPEG, PNG ou WebP válida.');
  return type;
}
