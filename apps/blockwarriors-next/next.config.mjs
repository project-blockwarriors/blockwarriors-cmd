import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Set root to monorepo root for proper workspace package resolution
    // Must be an absolute path as per Next.js documentation
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;
