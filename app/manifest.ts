import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LORDNUTRI - Revendedores MIX10 PRO",
    short_name: "LORDNUTRI",
    description: "Programa de Revendedores MIX10 PRO",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf9",
    theme_color: "#0b2236",
    icons: [{ src: "/brand/lordnutri-mark.png", sizes: "512x512", type: "image/png" }],
  };
}
