import {readdir, unlink} from 'node:fs/promises';
import {join} from 'node:path';

// Remove only legacy training downloads from the public manual directory.
// The authenticated PDF in private/manual is never touched.
const directory=join(process.cwd(),'public','manual');
let files=[];
try{files=await readdir(directory,{withFileTypes:true})}catch(error){if(error.code!=='ENOENT')throw error}
for(const file of files){
 if(file.isFile() && /\.(pdf|pptx)$/i.test(file.name))await unlink(join(directory,file.name));
}

// Ao sobrepor o ZIP em um clone antigo, arquivos que saíram da entrega podem continuar no disco.
const publicFiles = await readdir(join(process.cwd(),"public")).catch(error => {
  if (error.code === "ENOENT") return [];
  throw error;
});
const exposed = publicFiles.filter(name => /^(?:leads|coupons)_mix10pro_.*\.csv$/i.test(name));
if (exposed.length) throw new Error("Há exportações comerciais antigas em public. Mova esses CSVs para fora do repositório e refaça o build.");
