import { limparPlanilhasPublicas } from "./limpar-public.mjs";
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

const count = await limparPlanilhasPublicas(join(process.cwd(),"public"));
if (count) console.log(count + " planilha(s) removida(s) de public antes do build.");
