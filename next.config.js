/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  eslint: {
    // 배포 시 ESLint 오류 무시
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 배포 시 TypeScript 오류 무시
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;