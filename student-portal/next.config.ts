import type { NextConfig } from 'next';
import path from 'path';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve('.'),
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-hook-form', '@hookform/resolvers'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'media.nextgentra.com',
      },
      {
        protocol: 'http',
        hostname: '192.168.53.105',
        port: '9000',
      },
    ],
  },
};

// Sentry instrumentation only in production — skipped in dev to reduce memory overhead
export default process.env.NODE_ENV === 'production'
  ? withSentryConfig(nextConfig, { silent: true })
  : nextConfig;
