/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow mineflayer to work with Next.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle node-only modules on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
