import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Set root to monorepo root for proper workspace package resolution
    root: path.join(__dirname, '../../'),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.convex.cloud', // change this to prod on production
        port: '',
        pathname: '/api/storage/**',
      },
    ],
  },
};

export default nextConfig;
