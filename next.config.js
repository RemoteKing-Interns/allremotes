/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
    ],
  },
  eslint: {
    // Preserve existing lint warnings during migration; CI can re-enable later.
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // Canonical host is non-www — Google was indexing both and splitting rank.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.allremotes.com.au" }],
        destination: "https://allremotes.com.au/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
