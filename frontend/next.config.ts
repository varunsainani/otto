import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Same-origin proxy: the browser only ever talks to the frontend origin. In prod
// set API_PROXY_TARGET to the backend Vercel URL so the backend stays hidden.
const target = process.env.API_PROXY_TARGET || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${target}/api/:path*` },
      { source: "/health", destination: `${target}/health` },
    ];
  },
};

export default withNextIntl(nextConfig);
