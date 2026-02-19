import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  webpack: (config) => {
    config.module.exprContextCritical = false;
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
