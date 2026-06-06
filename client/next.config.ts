import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: "res.cloudinary.com",
      },
      {
        protocol: 'https',
        hostname: "randomuser.me",
      }
    ]
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // @ts-ignore
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Redirect root (/) to /login automatically
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;