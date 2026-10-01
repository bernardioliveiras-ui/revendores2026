import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://revendedores.mix10pro.com.br";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/painel", "/api", "/entrar", "/trocar-senha"] }], sitemap: `${base}/sitemap.xml` };
}
