import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.siliconflow.cn',
      },
      {
        protocol: 'https',
        hostname: 'api.apicore.ai',
      },
      {
        protocol: 'https',
        hostname: '*.siliconflow.cn',
      },
      {
        protocol: 'https',
        hostname: '*.apicore.ai',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60, // 1分钟缓存，避免长期缓存问题
  },
};

export default nextConfig;
