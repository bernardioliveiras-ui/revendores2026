import type { Metadata } from "next";
export function getSiteUrl(value = process.env.NEXT_PUBLIC_APP_URL || "https://revendedores.mix10pro.com.br") {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("NEXT_PUBLIC_APP_URL deve ser uma URL http(s) pública sem credenciais.");
  return url.origin;
}
export function publicPageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path, images: [{ url: "/brand/social-card.png", width: 1200, height: 630, alt: "LORD NUTRI · MIX10 PRO" }] }, twitter: { card: "summary_large_image", title, description, images: ["/brand/social-card.png"] } };
}
export const privatePageMetadata: Metadata = { robots: { index: false, follow: false, googleBot: { index: false, follow: false } }, alternates: { canonical: null } };
