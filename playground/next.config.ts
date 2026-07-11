import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The preview is intentionally usable from another device on the local
  // network. Next otherwise rejects the development HMR socket for that host,
  // leaving browsers connected to stale client bundles.
  allowedDevOrigins: ["192.168.1.3"],
};

export default nextConfig;
