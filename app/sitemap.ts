import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return ["/", "/termos-de-uso", "/politica-de-privacidade", "/reembolso-e-devolucao", "/cookies"].map((path) => ({ url: `${base}${path}`, changeFrequency: path === "/" ? "weekly" : "monthly", priority: path === "/" ? 1 : 0.3 }));
}
