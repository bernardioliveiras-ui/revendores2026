import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Resend não participa mais de nenhum fluxo de produção', async () => {
  for (const pattern of ['app/**/*.ts', 'app/**/*.tsx', 'lib/**/*.ts']) {
    for await (const file of glob(pattern, { cwd: root })) {
      const source = await read(file);
      assert.doesNotMatch(source, /api\.resend\.com|RESEND_API_KEY|sendPlatformEmail/, file);
    }
  }
});

test('rotas antigas de código e convite não disparam envio de e-mail', async () => {
  const requestCode = await read('app/api/auth/request-code/route.ts');
  const team = await read('app/api/team/route.ts');
  assert.match(requestCode, /status:\s*410/);
  assert.match(team, /multiusuário.*desativado|convites.*desativados/i);
  assert.match(team, /status:\s*410/);
});
