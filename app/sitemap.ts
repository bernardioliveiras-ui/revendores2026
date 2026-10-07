import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL || "https://revendedores.mix10pro.com.br";
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/termos-de-uso", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/politica-de-privacidade", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/reembolso-e-devolucao", changeFrequency: "monthly" as const, priority: 0.3 },
  ].map((item) => ({ url: `${base}${item.path}`, lastModified: now, changeFrequency: item.changeFrequency, priority: item.priority }));
}
