/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://7a55-2a01-4f8-1c1c-7c0e-00-1.ngrok-free.app/api/:path*",
      },
    ]
  },
}

module.exports = nextConfig
