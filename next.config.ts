import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Postgres driver opens raw sockets; let Node require it instead of
  // bundling it through webpack, which breaks the connection handling.
  serverExternalPackages: ["postgres"],
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
