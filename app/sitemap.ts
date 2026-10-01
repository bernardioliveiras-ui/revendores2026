import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://revendedores.mix10pro.com.br";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/comprar`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/termos-de-uso`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/politica-de-privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/reembolso-e-devolucao`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
