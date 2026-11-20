import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('continua preparado para Hostinger Node 22 + MySQL', async () => {
  const [pkg, deploy] = await Promise.all([read('package.json'), read('HOSTINGER-DEPLOY.md')]);
  assert.match(pkg, /"node": "22\.x"/);
  assert.match(pkg, /"mysql2"/);
  assert.match(deploy, /Hostinger/i);
});
