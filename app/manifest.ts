import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LORD NUTRI - Revendedores MIX10 PRO",
    short_name: "LORD NUTRI",
    description: "Programa de Revendedores MIX10 PRO",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F5F2",
    theme_color: "#071F33",
    icons: [
      { src: "/brand/lordnutri-app-icon-2026.png?v=20261126-3", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/lordnutri-maskable-icon-2026.png?v=20261126-3", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
