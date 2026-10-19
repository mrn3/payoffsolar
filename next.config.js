/** @type {import('next').NextConfig} */
const nextConfig = {

  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
  experimental: {
    inlineCss: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Public HTML only: revalidate every time but stay eligible for back/forward cache
        source: '/((?!api/|_next/|uploads/|dashboard)[^.]*)',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Reduce memory usage during compilation
    config.parallelism = 1;
    config.cache = false;

    // Fixes npm packages that depend on Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
