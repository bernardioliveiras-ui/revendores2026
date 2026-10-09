import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LORD NUTRI - Revendedores MIX10 PRO",
    short_name: "LORD NUTRI",
    description: "Programa de Revendedores MIX10 PRO",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf9",
    theme_color: "#111810",
    icons: [{ src: "/brand/lordnutri-mark.png", sizes: "512x512", type: "image/png" }],
  };
}
