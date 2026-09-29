import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root=new URL('..',import.meta.url).pathname;const read=(p)=>readFile(join(root,p),'utf8');

test('root metadata is optimized for LORDNUTRI reseller search and sharing',async()=>{
  const layout=await read('app/layout.tsx');
  for(const term of ['LORDNUTRI','MIX10 PRO','revendedores','openGraph','alternates','canonical','keywords','metadataBase']){
    assert.match(layout,new RegExp(term));
  }
  assert.match(layout,/revendedores\.mix10pro\.com\.br/);
});
