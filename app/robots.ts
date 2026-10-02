import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
 return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/painel", "/entrar", "/trocar-senha"] }, sitemap: "https://revendedores.mix10pro.com.br/sitemap.xml" };
}
