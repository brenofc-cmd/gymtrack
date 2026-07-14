import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'brendongym.vercel.app',
        pathname: '/exercises/**',
      },
    ],
  },
}

export default nextConfig
