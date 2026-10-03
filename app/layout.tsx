import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TrafficAttribution } from "@/components/traffic-attribution";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://revendedores.mix10pro.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: "LORD NUTRI | Programa de Revendedores MIX10 PRO", template: "%s | LORD NUTRI" },
  description: "Conheça a LORD NUTRI, escolha seu kit MIX10 PRO e organize sua revenda com portal, estoque, vendas, acompanhamento e material de apoio.",
  keywords: ["LORD NUTRI", "MIX10 PRO", "revendedor MIX10 PRO", "revenda de suplementos", "programa de revendedores", "suplemento alimentar"],
  applicationName: "LORD NUTRI Revendedores",
  authors: [{ name: "LORD NUTRI" }],
  creator: "LORD NUTRI",
  publisher: "LORD GROUP NETWORK EPP",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    title: "LORD NUTRI | Seja Revendedor MIX10 PRO",
    description: "Produto físico, kits de entrada, Manual do Revendedor e portal para acompanhar sua operação.",
    url: baseUrl,
    siteName: "LORD NUTRI Revendedores",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/brand/mix10-trio.png", width: 1448, height: 1086, alt: "MIX10 PRO - Programa de Revendedores LORD NUTRI" }],
  },
  twitter: { card: "summary_large_image", title: "LORD NUTRI | Revendedores MIX10 PRO", description: "Conheça o programa de revendedores LORDNUTRI.", images: ["/brand/mix10-trio.png"] },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#080808" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><TrafficAttribution />{children}</body></html>;
}
