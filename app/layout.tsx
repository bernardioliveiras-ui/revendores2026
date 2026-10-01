import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://revendedores.mix10pro.com.br"),
  title: "MIX10 PRO | Suplemento alimentar e programa de revendedores LordNutri",
  description: "Conheça o MIX10 PRO, suplemento alimentar com colágeno tipo II, magnésio e vitamina D3, e o programa oficial de revendedores LordNutri.",
  keywords: ["MIX10 PRO", "LordNutri", "suplemento alimentar", "colágeno tipo II", "magnésio", "vitamina D3", "suplemento para mobilidade", "revenda de suplementos", "renda extra com suplementos", "programa de revendedores"],
  robots: { index: true, follow: true },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
