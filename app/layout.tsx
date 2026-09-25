import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIX10 PRO | Programa de Revendedores LORDNUTRI",
  description: "Escolha seu estoque, receba suas caixas e construa suas próprias vendas com MIX10 PRO.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
