import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // 개발 모드 설정 최적화
  reactStrictMode: true,
  // Turbopack 설정 (Next.js 16 기본값)
  turbopack: {},
};

export default nextConfig;
