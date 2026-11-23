import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LORD NUTRI - Revendedores MIX10 PRO",
    short_name: "LORD NUTRI",
    description: "Programa de Revendedores MIX10 PRO",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/brand/lordnutri-app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/lordnutri-app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
