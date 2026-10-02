import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
 return ["/", "/termos-de-uso", "/politica-de-privacidade", "/reembolso-e-devolucao"].map(path=>({ url: `https://revendedores.mix10pro.com.br${path}`, changeFrequency: "monthly", priority: path === "/" ? 1 : 0.3 }));
}
