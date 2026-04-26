import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@nextgentra/ui", "@nextgentra/utils", "@nextgentra/config"],
};

export default nextConfig;
