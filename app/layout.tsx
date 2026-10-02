import type { Metadata } from "next";
import "./globals.css";
import { TrafficAttribution } from "@/components/traffic-attribution";

export const metadata: Metadata = {
  metadataBase: new URL("https://revendedores.mix10pro.com.br"),
  title: "LORDNUTRI | Programa de Revendedores MIX10 PRO",
  keywords: ["LORDNUTRI", "MIX10 PRO", "revenda de suplementos", "suplemento alimentar", "colágeno tipo II", "magnésio", "vitamina D3"],
  openGraph: { title: "LORDNUTRI | Programa de Revendedores", description: "Conheça o programa LORDNUTRI e escolha seu kit MIX10 PRO.", locale: "pt_BR", type: "website" },
  description: "Escolha seu estoque, receba suas caixas e construa suas próprias vendas com MIX10 PRO.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><TrafficAttribution />{children}</body></html>;
}
