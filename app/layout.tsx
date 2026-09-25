import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIX10 PRO | Programa de Revendedores LordNutri",
  description: "Escolha seu estoque, receba suas caixas e construa suas próprias vendas com MIX10 PRO.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
