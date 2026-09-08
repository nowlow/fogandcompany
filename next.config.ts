import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Postgres drivers open raw sockets; let Node require them instead of
  // bundling them through webpack.
  serverExternalPackages: ["postgres", "@neondatabase/serverless"],
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
