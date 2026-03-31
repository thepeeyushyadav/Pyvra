import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'uploadthing.com' },
      { hostname: 'utfs.io' },
      { hostname: 'img.clerk.com' },
      { hostname: 'subdomain' },
      { hostname: 'files.stripe.com' },
    ],
  },
  reactStrictMode: false,
};

export default nextConfig;
