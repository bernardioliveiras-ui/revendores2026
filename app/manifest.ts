import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LORD NUTRI - Revendedores MIX10 PRO",
    short_name: "LORD NUTRI",
    description: "Programa de Revendedores MIX10 PRO",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    icons: [{ src: "/brand/lord-nutri-transparent-v022.png", sizes: "508x491", type: "image/png" }],
  };
}
