import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/admin/demonstracao": ["./private/demonstracao/index.html"],
    "/api/reseller/manual": ["./private/manual/*.pdf"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "Referrer-Policy", value: "origin" }] },
      { source: "/ativar-cliente", headers: [{ key: "Referrer-Policy", value: "no-referrer" }, { key: "Cache-Control", value: "private, no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/minha-indicacao", headers: [{ key: "Cache-Control", value: "private, no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/minhas-indicacoes", headers: [{ key: "Cache-Control", value: "private, no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      ...["/api/:path*", "/painel/:path*", "/entrar/:path*", "/trocar-senha/:path*", "/comprar/:path*", "/r/:path*", "/manual/:path*", "/studio/:path*"].map((source) => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] })),
    ];
  },
  async redirects() {
    return [{ source: "/manual/:path*", destination: "/api/reseller/manual", permanent: false }];
  },
};

export default nextConfig;
