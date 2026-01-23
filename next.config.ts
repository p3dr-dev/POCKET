import type { NextConfig } from "next";
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  outputFileTracingIncludes: {
    '/api/ai/scan-receipt': ['./scripts/**/*'],
  },
};

export default withPWA(nextConfig);
