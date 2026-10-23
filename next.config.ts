import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client"],
  // The preview opens 127.0.0.1 while Next treats that as cross-origin in dev.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
    proxyClientMaxBodySize: "16mb",
  },
};

export default nextConfig;
