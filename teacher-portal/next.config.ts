import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve('.'),
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-hook-form',
      '@hookform/resolvers',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'react-markdown',
    ],
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

export default nextConfig;
