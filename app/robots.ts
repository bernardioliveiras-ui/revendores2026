import type { MetadataRoute } from "next";
const base = process.env.NEXT_PUBLIC_APP_URL || "https://revendedores.mix10pro.com.br";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/painel", "/entrar", "/trocar-senha"] },
      { userAgent: "Googlebot", allow: "/", disallow: ["/api/", "/painel", "/entrar", "/trocar-senha"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
