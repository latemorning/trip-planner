import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.50.252', '218.145.237.191'],
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/.playwright-mcp/**', '**/data/**'],
    };
    return config;
  },
};

export default nextConfig;
