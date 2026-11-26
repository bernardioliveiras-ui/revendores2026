import {readFile,writeFile} from 'node:fs/promises';

// PNG incorpora o monograma original com canal alfa verdadeiro. O SVG
// não pinta retângulo de fundo e funciona mesmo sem carregar arquivos externos.
const mark=await readFile(new URL('../public/brand/lordnutri-mark-transparente-2026.png',import.meta.url));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image width="512" height="512" href="data:image/png;base64,${mark.toString('base64')}"/></svg>\n`;
await writeFile(new URL('../public/favicon.svg',import.meta.url),svg);
