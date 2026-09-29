import type { Metadata } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://revendedores.mix10pro.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Revendedores LORDNUTRI | MIX10 PRO",
    template: "%s | Revendedores LORDNUTRI",
  },
  description: "Seja revendedor LORDNUTRI e venda MIX10 PRO com kits oficiais, portal de controle, links de indicação e suporte para sua operação.",
  keywords: [
    "LORDNUTRI",
    "MIX10 PRO",
    "revendedores LORDNUTRI",
    "revender MIX10 PRO",
    "suplemento alimentar",
    "programa de revendedores",
    "renda extra com suplementos",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Revendedores LORDNUTRI",
    title: "Revendedores LORDNUTRI | MIX10 PRO",
    description: "Entre para o programa de revendedores LORDNUTRI e gerencie sua operação MIX10 PRO com estoque, vendas e indicações.",
    images: [
      {
        url: "/brand/mix10-product.webp",
        width: 1200,
        height: 630,
        alt: "MIX10 PRO LORDNUTRI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Revendedores LORDNUTRI | MIX10 PRO",
    description: "Programa oficial para revender MIX10 PRO com portal, estoque e indicações.",
    images: ["/brand/mix10-product.webp"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
