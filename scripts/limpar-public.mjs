import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export async function limparPlanilhasPublicas(publicDirectory) {
  let count = 0;
  async function visit(directory) {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); }
    catch (error) { if (error.code === "ENOENT") return; throw error; }
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (/\.(csv|csc)$/i.test(entry.name)) {
        await unlink(path);
        count++;
      }
    }
  }
  await visit(publicDirectory);
  return count;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = await limparPlanilhasPublicas(join(process.cwd(), "public"));
  console.log(count + " planilha(s) removida(s) de public.");
}
