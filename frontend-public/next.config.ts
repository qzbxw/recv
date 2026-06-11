import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  // In Next.js 16.2.4 (Turbopack), eslint/typescript ignore flags are
  // moved to other places (env vars or turbopack-specific config).
  transpilePackages: ["remark-gfm", "remark-parse", "remark", "unified", "mdast-util-gfm", "micromark-extension-gfm"],
  // Security headers are set once at the edge (Caddyfile); setting them
  // here too produced duplicate headers with conflicting HSTS values.
};

export default nextConfig;
