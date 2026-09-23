import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // The preview opens 127.0.0.1 while Next treats that as cross-origin in dev.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
