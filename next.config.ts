import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16/Turbopack otherwise treats this ESM package as unresolved on host builds
  // when node_modules is stale or the /react export is externalized for SSR.
  transpilePackages: ["@convex-dev/auth"],
};

export default nextConfig;
