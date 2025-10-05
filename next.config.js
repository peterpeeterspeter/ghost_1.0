/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features if needed
  experimental: {
    // App directory is now stable, no need to enable
  },

  // API configuration is now handled differently in App Router
  // Body size limits are configured per route handler

  // Image configuration for handling large images
  images: {
    // Domains allowed for next/image component
    domains: [
      'fal.run',
      'storage.googleapis.com',
      'supabase.co',
      'localhost',
    ],
    // Image size limits
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Support for additional image formats
    formats: ['image/webp', 'image/avif'],
  },

  // Headers configuration
  async headers() {
    return [
      {
        // Apply CORS headers to API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },

  // Environment variables that should be available on the client side
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Add any custom webpack configurations here
    
    // Handle Node.js modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Optimize for production builds
    if (!dev && isServer) {
      // Server-side optimizations
      config.optimization.minimize = true;
    }

    return config;
  },

  // Redirects configuration
  async redirects() {
    return [
      // Add any URL redirects here if needed
    ];
  },

  // Rewrites configuration  
  async rewrites() {
    return [
      // Add any URL rewrites here if needed
    ];
  },

  // Output configuration
  output: 'standalone', // Useful for Docker deployments
  
  // Transpile packages if needed
  transpilePackages: ['@fal-ai/client', '@google/generative-ai'],

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Power packs or other optimizations
  poweredByHeader: false, // Remove X-Powered-By header

  // Compression
  compress: true,

  // Generate ETags for pages
  generateEtags: true,

  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // Trailing slash handling
  trailingSlash: false,

  // Development configuration
  ...(process.env.NODE_ENV === 'development' && {
    // Development-specific config
    reactStrictMode: true,
    
    // Enable source maps in development
    productionBrowserSourceMaps: false,
    
    // Fast refresh is enabled by default in development
  }),

  // Production configuration
  ...(process.env.NODE_ENV === 'production' && {
    // Production-specific config
    reactStrictMode: true,
    
    // Optimize for production
    swcMinify: true,
    
    // Enable source maps in production (optional, increases build size)
    productionBrowserSourceMaps: false,
  }),
};

module.exports = nextConfig;
