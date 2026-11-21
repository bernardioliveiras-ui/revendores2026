import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (admin.mustChangePassword) return new Response(null, { status:403 });
    const html = await readFile(join(process.cwd(),"private","demonstracao","index.html"),"utf8");
    return new Response(html, { headers:{
      "Content-Type":"text/html; charset=utf-8", "Cache-Control":"private, no-store",
      "Content-Security-Policy":"sandbox allow-scripts allow-modals; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; form-action 'none'",
      "X-Robots-Tag":"noindex, noarchive",
    }});
  } catch (error) {
    const key = error instanceof Error ? error.message : "";
    return new Response(null, { status:key === "UNAUTHORIZED" ? 401 : key === "FORBIDDEN" ? 403 : 500 });
  }
}
