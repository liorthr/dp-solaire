import type { NextConfig } from "next";

const isStatic = process.env.DEPLOY_TARGET === "static";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(isStatic ? { output: "export" as const, trailingSlash: true } : {}),
  basePath: basePath || undefined,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_DEPLOY_TARGET: isStatic ? "static" : "server",
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
  },
};

export default nextConfig;
