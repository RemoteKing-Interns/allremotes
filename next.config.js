/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    // Preserve existing lint warnings during migration; CI can re-enable later.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
