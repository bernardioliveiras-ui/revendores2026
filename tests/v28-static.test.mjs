import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
test('KIT100 exclusivo da reposição e preço vindo do servidor',()=>{
 const kit=read('lib/kits.ts');
 assert.match(kit,/kit100:.*id: "kit100".*boxes: 100.*unitPriceCents: 6790.*totalCents: 679000/s);
 assert.match(kit,/getKit\(value: unknown\)[\s\S]*?kit20" \|\| value === "kit50"/);
 assert.doesNotMatch(kit.slice(kit.indexOf('export function getKit'),kit.indexOf('export const REPLENISHMENT_KITS')),/kit100/);
 const replenishment=read('app/api/replenishment/route.ts');
 assert.match(replenishment,/getReplenishmentKit\(body.kit\)/);
 assert.match(replenishment,/kit.totalCents \+ shipping.priceCents/);
});
test('materiais têm autenticação, distinção de papéis e downloads protegidos',()=>{
 assert.match(read('lib/reseller-materials.ts'),/requireSession\(request\)/);
 assert.match(read('lib/reseller-materials.ts'),/paymentStatus, "paid"/);
 assert.match(read('app/api/reseller/materials/[id]/route.ts'),/authorizeMaterials\(request\)/);
 assert.match(read('app/api/admin/reseller-materials/route.ts'),/requireAdmin\(request\)/);
 assert.match(read('components/reseller-materials.tsx'),/Baixar/);
});
