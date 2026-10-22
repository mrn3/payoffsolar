const isDevelopment = process.env.NODE_ENV === 'development';
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https://checkout.stripe.com",
  // Next.js hydration and existing CMS scripts need inline scripts; eval is development-only.
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://js.stripe.com https://maps.googleapis.com https://maps.gstatic.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.googletagmanager.com https://api.stripe.com https://r.stripe.com https://m.stripe.network https://q.stripe.com https://maps.googleapis.com https://maps.gstatic.com${isDevelopment ? ' ws://localhost:* ws://127.0.0.1:*' : ''}`,
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com",
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
  ...(!isDevelopment ? ['upgrade-insecure-requests'] : []),
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: false,
  },

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
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), usb=(), payment=(self "https://js.stripe.com" "https://hooks.stripe.com" "https://checkout.stripe.com")',
          },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        ],
      },
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
