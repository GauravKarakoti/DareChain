import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['ipfs.io', 'filecoin.org'],
  },
  outputFileTracingRoot: './',
};

export default nextConfig;