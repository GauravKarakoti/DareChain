import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },
  allowedDevOrigins: ['*', 'stodgiest-unsalutary-keely.ngrok-free.dev'], // Add your dev origin here
  reactStrictMode: false,
};

export default nextConfig;
