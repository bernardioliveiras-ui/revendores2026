import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/reseller/manual": ["./private/manual/*.pdf"],
  },
  async redirects() {
    return [{ source: "/manual/:path*", destination: "/api/reseller/manual", permanent: false }];
  },
};

export default nextConfig;
