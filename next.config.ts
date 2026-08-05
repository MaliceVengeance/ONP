import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  experimental: {
    // Server Actions default to a 1MB body cap. Project file / portfolio
    // photo uploads go through server actions (for EXIF stripping) and
    // allow up to 10MB per file, so the cap has to match or every upload
    // over 1MB fails with a generic "unexpected response" error before it
    // ever reaches the action's own size check.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
