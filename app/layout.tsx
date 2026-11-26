import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./portal-modern.css";
import { getSiteUrl } from "@/lib/seo";
import { TrafficAttribution } from "@/components/traffic-attribution";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: "LORD NUTRI | Programa de Revendedores MIX10 PRO", template: "%s | LORD NUTRI" },
  description: "Revenda MIX10 PRO com a LORD NUTRI. Escolha seu estoque, receba suas caixas e venda diretamente para sua rede de contatos.",
  keywords: ["LORD NUTRI", "MIX10 PRO", "revendedor MIX10 PRO", "revenda de suplementos", "programa de revendedores", "suplemento alimentar"],
  referrer: "origin",
  applicationName: "LORD NUTRI Revendedores",
  icons: {
    icon: [{ url: "/favicon-32.png?v=20261126-2", sizes: "32x32", type: "image/png" }, { url: "/icon.png?v=20261126-2", sizes: "512x512", type: "image/png" }],
    shortcut: "/favicon.ico?v=20261126-2",
    apple: [{ url: "/apple-icon.png?v=20261126-2", sizes: "512x512", type: "image/png" }],
  },
  authors: [{ name: "LORD NUTRI" }],
  creator: "LORD NUTRI",
  publisher: "LORD GROUP NETWORK EPP",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    title: "LORD NUTRI | Seja Revendedor MIX10 PRO",
    description: "Produto em mãos, números claros e espaço para desenvolver suas próprias vendas.",
    url: baseUrl,
    siteName: "LORD NUTRI Revendedores",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/brand/social-card.png", width: 1200, height: 630, alt: "MIX10 PRO - Programa de Revendedores LORD NUTRI" }],
  },
  twitter: { card: "summary_large_image", title: "LORD NUTRI | Revendedores MIX10 PRO", description: "Conheça o programa de revendedores LORD NUTRI.", images: ["/brand/social-card.png"] },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><TrafficAttribution />{children}</body></html>;
}
