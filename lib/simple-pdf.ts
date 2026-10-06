type ManualField = { id:string; text:string; x:number; y:number; w:number; h:number; size:number; font?:string; color?:number; background?:number[] };
type ManualPage = { page:number; width:number; height:number; background?:number[]; fields:ManualField[] };

function cp1252(text:string) {
  const replacements: Record<string,string> = {"–":"-","—":"-","“":"\"","”":"\"","‘":"'","’":"'","•":"·","…":"...","™":"TM","®":"(R)","→":">","←":"<","µ":"u"};
  let out="";
  for (const ch of text) {
    const c=replacements[ch]??ch;
    for (const x of c) out += x.charCodeAt(0) <= 255 ? x : "?";
  }
  return out;
}
function esc(text:string){return cp1252(text).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)").replace(/[\r\n]+/g," ");}
function rgbFromInt(value:number|undefined){const n=Number(value||0);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];}
function fmt(n:number){return Number.isFinite(n)?n.toFixed(3).replace(/\.000$/,''):"0";}
function splitText(text:string,width:number,size:number){
  const max=Math.max(2,Math.floor(width/Math.max(size*.52,1)));
  const words=text.split(/\s+/).filter(Boolean);const lines:string[]=[];let line="";
  for(const word of words){const next=line?`${line} ${word}`:word;if(next.length<=max)line=next;else{if(line)lines.push(line);line=word;}}
  if(line)lines.push(line);return lines.slice(0,8);
}
function jpegSize(buffer:Buffer){
  let i=2;
  while(i<buffer.length-9){if(buffer[i]!==0xff){i++;continue;}const marker=buffer[i+1];if(marker===0xd8||marker===0xd9){i+=2;continue;}const len=buffer.readUInt16BE(i+2);if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){return {height:buffer.readUInt16BE(i+5),width:buffer.readUInt16BE(i+7)};}i+=2+len;}
  throw new Error("JPEG inválido");
}

export function buildManualPdf(pages:ManualPage[], pageImages:Buffer[] = []) {
  const objects: Buffer[]=[];
  const add=(body:string|Buffer)=>{objects.push(Buffer.isBuffer(body)?body:Buffer.from(body,"latin1"));return objects.length;};
  const catalog=add("");
  const pagesObj=add("");
  const fontRegular=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const fontBold=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const kids:number[]=[];
  for(let pageIndex=0;pageIndex<pages.length;pageIndex++){
    const page=pages[pageIndex];
    let imageObj:number|undefined;
    const image=pageImages[pageIndex];
    if(image){
      const dim=jpegSize(image);
      imageObj=add(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${dim.width} /Height ${dim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`,`latin1`),image,Buffer.from("\nendstream","latin1")]));
    }
    const bg=page.background||[255,255,255];
    let stream=imageObj?`q ${fmt(page.width)} 0 0 ${fmt(page.height)} 0 0 cm /BG Do Q\n`:`q ${fmt(bg[0]/255)} ${fmt(bg[1]/255)} ${fmt(bg[2]/255)} rg 0 0 ${fmt(page.width)} ${fmt(page.height)} re f Q\n`;
    for(const field of page.fields||[]){
      const size=Math.max(5,Math.min(40,Number(field.size)||9));
      const [r,g,b]=rgbFromInt(field.color);
      const fb=field.background||bg;
      const pad=1.4;
      const rectY=page.height-field.y-field.h-pad;
      stream += `q ${fmt(fb[0]/255)} ${fmt(fb[1]/255)} ${fmt(fb[2]/255)} rg ${fmt(Math.max(0,field.x-pad))} ${fmt(Math.max(0,rectY))} ${fmt(field.w+pad*2)} ${fmt(field.h+pad*2)} re f Q\n`;
      const isBold=/bold|black|semibold|heavy/i.test(field.font||"");
      const lines=splitText(String(field.text||""),Math.max(field.w,20),size);
      const lineHeight=size*1.08;
      lines.forEach((line,i)=>{
        const x=field.x; const y=page.height-field.y-size-(i*lineHeight);
        stream += `BT /F${isBold?2:1} ${fmt(size)} Tf ${fmt(r)} ${fmt(g)} ${fmt(b)} rg 1 0 0 1 ${fmt(x)} ${fmt(y)} Tm (${esc(line)}) Tj ET\n`;
      });
    }
    const streamBuf=Buffer.from(stream,"latin1");
    const content=add(Buffer.concat([Buffer.from(`<< /Length ${streamBuf.length} >>\nstream\n`,`latin1`),streamBuf,Buffer.from("endstream","latin1")]));
    const xObject=imageObj?` /XObject << /BG ${imageObj} 0 R >>`:"";
    const pageObj=add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${fmt(page.width)} ${fmt(page.height)}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >>${xObject} >> /Contents ${content} 0 R >>`);
    kids.push(pageObj);
  }
  objects[catalog-1]=Buffer.from(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`,`latin1`);
  objects[pagesObj-1]=Buffer.from(`<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(id=>`${id} 0 R`).join(" ")}] >>`,`latin1`);
  const chunks:Buffer[]=[Buffer.from("%PDF-1.4\n%âãÏÓ\n","latin1")];
  const offsets=[0]; let pos=chunks[0].length;
  objects.forEach((obj,i)=>{offsets.push(pos);const chunk=Buffer.concat([Buffer.from(`${i+1} 0 obj\n`,`latin1`),obj,Buffer.from("\nendobj\n","latin1")]);chunks.push(chunk);pos+=chunk.length;});
  const xref=pos; let table=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<offsets.length;i++)table+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;
  table+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  chunks.push(Buffer.from(table,"latin1"));
  return Buffer.concat(chunks);
}
