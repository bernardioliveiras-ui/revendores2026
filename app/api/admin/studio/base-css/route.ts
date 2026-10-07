import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const root = process.cwd();
    const [globalCss, landingCss] = await Promise.all([
      readFile(path.join(root, "app", "globals.css"), "utf8"),
      readFile(path.join(root, "app", "landing.css"), "utf8"),
    ]);
    return new Response(`${globalCss}\n${landingCss}`, {
      headers: { "content-type": "text/css; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return new Response("/* CSS indisponível */", { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500 });
  }
}
